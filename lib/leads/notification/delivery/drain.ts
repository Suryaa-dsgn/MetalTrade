import type { LeadReader } from "@/lib/leads/repository/types"
import type { LeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository"
import {
  attemptEmailDelivery,
  type EmailAttemptConfig,
} from "@/lib/leads/notification/delivery/first-attempt"
import type { BackoffOptions } from "@/lib/leads/notification/delivery/backoff"
import { logger } from "@/lib/observability/logger"

/*
  Backend Phase 2E-3 — notification drain dispatcher (application layer, NO raw SQL).
  Recovers durable delivery rows that are pending-and-due or processing-with-an-
  expired-lease (crash recovery), and delivers them using the SAME attempt core as the
  first attempt (`attemptEmailDelivery`) — no second send pipeline.

  It is host-agnostic: a protected route invokes it and a platform scheduler will call
  that route later. It claims only sendable providers, never increments attempts during
  claiming, and returns a minimal PII-free operational summary.
*/

export const DEFAULT_BATCH_SIZE = 10
export const DEFAULT_LEASE_MS = 60_000 // comfortably longer than the send timeout
export const DEFAULT_SEND_TIMEOUT_MS = 10_000

/** Which providers can currently send, and the attempt config for each. Produced by a
 *  server-only resolver (fail-loud: a misconfigured selected provider yields an empty
 *  set + a loud event, so its pending rows are preserved, not claimed). */
export type SendableResolution = {
  sendableProviders: string[]
  configFor(provider: string): EmailAttemptConfig | undefined
}

export type DrainSummary = {
  claimed: number
  sent: number
  retryScheduled: number
  failed: number
}

export type DrainDeps = {
  repository: LeadNotificationDeliveryRepository
  leadReader: LeadReader
  resolveSendable: () => SendableResolution
  workerId: string
  now?: () => Date
  batchSize?: number
  leaseDurationMs?: number
  sendTimeoutMs?: number
  backoff?: BackoffOptions
}

export async function drainNotificationDeliveries(
  deps: DrainDeps
): Promise<DrainSummary> {
  const now = deps.now ?? (() => new Date())
  const { repository, leadReader, workerId } = deps
  const summary: DrainSummary = { claimed: 0, sent: 0, retryScheduled: 0, failed: 0 }

  const sendable = deps.resolveSendable()
  if (sendable.sendableProviders.length === 0) {
    // No operable provider (disabled, or misconfigured — the resolver has already
    // emitted the loud event). Claim nothing; preserve pending rows.
    logger.info("lead.notification.drain.completed", {
      workerId,
      claimedCount: 0,
      sentCount: 0,
      retryCount: 0,
      failedCount: 0,
    })
    return summary
  }

  const claimed = await repository.claimDue({
    batchSize: deps.batchSize ?? DEFAULT_BATCH_SIZE,
    workerId,
    leaseDurationMs: deps.leaseDurationMs ?? DEFAULT_LEASE_MS,
    now: now(),
    sendableProviders: sendable.sendableProviders,
  })
  summary.claimed = claimed.length

  for (const d of claimed) {
    const base = {
      workerId,
      deliveryId: d.id,
      leadId: d.leadId,
      channel: d.channel,
      purpose: d.purpose,
      provider: d.provider,
    }
    logger.info(
      d.reclaimed ? "lead.notification.reclaimed" : "lead.notification.claimed",
      { ...base, attempt: d.attempts }
    )

    const lead = await leadReader.getById(d.leadId)
    if (!lead) {
      // Defensive: FK + ON DELETE CASCADE should prevent this. Fail terminally with a
      // safe classification rather than retrying forever. No PII.
      await repository.markFailed(d.id, now().toISOString(), "lead_not_found")
      logger.warn("lead.notification.failed", {
        ...base,
        status: "failed",
        failureClass: "lead_not_found",
      })
      summary.failed += 1
      continue
    }

    const providerConfig = sendable.configFor(d.provider)
    if (!providerConfig) {
      // Provider became unsendable between resolution and this row (unlikely). Leave
      // the row processing→lease will expire and a later drain retries it. Not a send.
      continue
    }

    const outcome = await attemptEmailDelivery(
      lead,
      d,
      repository,
      {
        ...providerConfig,
        now,
        backoff: deps.backoff,
        timeoutMs: deps.sendTimeoutMs ?? DEFAULT_SEND_TIMEOUT_MS,
      },
      { correlationId: workerId, workerId }
    )

    if (outcome === "sent") summary.sent += 1
    else if (outcome === "retry") summary.retryScheduled += 1
    else summary.failed += 1 // "failed" | "exhausted"
  }

  logger.info("lead.notification.drain.completed", {
    workerId,
    claimedCount: summary.claimed,
    sentCount: summary.sent,
    retryCount: summary.retryScheduled,
    failedCount: summary.failed,
  })
  return summary
}
