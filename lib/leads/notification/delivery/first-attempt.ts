import type { Lead } from "@/lib/leads/types"
import type { EmailTransport } from "@/lib/leads/notification/email/types"
import { buildLeadEmail } from "@/lib/leads/notification/email/content"
import { sendWithTimeout } from "@/lib/leads/notification/email/send"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import type { LeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository"
import {
  MAX_ATTEMPTS,
  nextAttemptAt as computeNextAttemptAt,
  type BackoffOptions,
} from "@/lib/leads/notification/delivery/backoff"
import { logger } from "@/lib/observability/logger"

/*
  Backend Phase 2E-2 — durable FIRST notification attempt. Given a persisted `pending`
  delivery intent, it performs ONE bounded email send and persists the outcome onto
  the row. It never schedules or performs a second attempt (retry/drain is a later
  slice); a retryable outcome only records `next_attempt_at` as DATA. It also never
  throws to the caller — the lead is already durably persisted and its success must
  not change.

  The two layers stay separated: this knows the Lead (builds the message via the
  content builder) and hands the transport an EmailMessage only. The stable delivery
  `id` is passed as the provider idempotency key (a structured option), so a provider
  that enforces idempotency suppresses a duplicate on a later retry.
*/

const DEFAULT_TIMEOUT_MS = 10_000

/** Codes whose delivery status is AMBIGUOUS (the send may or may not have landed). */
const AMBIGUOUS_CODES = new Set(["timeout", "transport_exception"])

export type EmailAttemptConfig = {
  transport: EmailTransport
  /** Verified sender / recipient — server configuration only. */
  from: string
  to: string
  replyToLeadEmail: boolean
  timeoutMs?: number
  now?: () => Date
  backoff?: BackoffOptions
}

/** The persisted result of one attempt — returned so the drain can count outcomes.
 *  ("exhausted" is a terminal failure that hit MAX_ATTEMPTS.) */
export type AttemptOutcome = "sent" | "retry" | "failed" | "exhausted"

/** Observability context. `workerId` is set for drain attempts (opaque). */
export type AttemptContext = { correlationId: string; workerId?: string }

/** Resolution of the configured email transport for a delivery attempt, or a reason
 *  the provider cannot currently send (surfaced loudly; the intent stays pending). */
export type ResolvedEmailAttempt =
  | { ok: true; config: EmailAttemptConfig }
  | { ok: false; reason: string }

function baseEvent(
  lead: Lead,
  delivery: LeadNotificationDelivery,
  ctx: AttemptContext
) {
  return {
    correlationId: ctx.correlationId,
    ...(ctx.workerId ? { workerId: ctx.workerId } : {}),
    leadId: lead.id,
    deliveryId: delivery.id,
    channel: delivery.channel,
    purpose: delivery.purpose,
    provider: delivery.provider,
  }
}

/**
 * Perform one bounded send and persist the outcome against the delivery row. The
 * transport is already resolved + configured — a genuine provider attempt WILL be
 * made here, so `attempts` is incremented exactly once (by the repository transition).
 */
export async function attemptEmailDelivery(
  lead: Lead,
  delivery: LeadNotificationDelivery,
  repo: LeadNotificationDeliveryRepository,
  config: EmailAttemptConfig,
  ctx: AttemptContext
): Promise<AttemptOutcome> {
  const nowFn = config.now ?? (() => new Date())
  const attempt = delivery.attempts + 1
  const at = nowFn().toISOString()
  const base = baseEvent(lead, delivery, ctx)

  // Defensive cap check BEFORE sending: a row already at the cap is never sent again.
  if (delivery.attempts >= MAX_ATTEMPTS) {
    await repo.markFailed(delivery.id, at, "exhausted")
    logger.warn("lead.notification.exhausted", {
      ...base,
      attempt: delivery.attempts,
      status: "failed",
      failureClass: "exhausted",
    })
    return "exhausted"
  }

  logger.info("lead.notification.started", { ...base, attempt })

  const replyTo =
    config.replyToLeadEmail && lead.contact.email ? lead.contact.email : undefined
  const message = buildLeadEmail(lead, { from: config.from, to: config.to, replyTo })

  const result = await sendWithTimeout(config.transport, message, {
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    idempotencyKey: delivery.id, // stable across retries
  })

  if (result.status === "sent") {
    await repo.markSent(delivery.id, at, result.providerMessageId)
    logger.info("lead.notification.sent", {
      ...base,
      attempt,
      status: "sent",
      providerMessageId: result.providerMessageId,
    })
    return "sent"
  }

  if (result.status === "permanent_failure" || result.status === "not_configured") {
    const failureClass =
      result.status === "not_configured" ? "not_configured" : result.code
    await repo.markFailed(delivery.id, at, failureClass)
    logger.warn("lead.notification.failed", {
      ...base,
      attempt,
      status: "failed",
      failureClass,
    })
    return "failed"
  }

  // temporary_failure — apply the capability-based ambiguity rule.
  const code = result.code
  const ambiguous = AMBIGUOUS_CODES.has(code)
  if (ambiguous && !config.transport.capabilities.idempotentSend) {
    // Ambiguous outcome + a transport that does NOT guarantee idempotency: do NOT
    // blindly schedule an automatic retry (it could double-send). Persist an explicit
    // classification for operator recovery.
    const failureClass = `ambiguous_${code}`
    await repo.markFailed(delivery.id, at, failureClass)
    logger.warn("lead.notification.failed", {
      ...base,
      attempt,
      status: "failed",
      failureClass,
    })
    return "failed"
  }

  // Retryable — but if this attempt exhausts the cap, fail terminally instead of
  // scheduling an unreachable retry.
  if (attempt >= MAX_ATTEMPTS) {
    await repo.markFailed(delivery.id, at, code)
    logger.warn("lead.notification.exhausted", {
      ...base,
      attempt,
      status: "failed",
      failureClass: code,
    })
    return "exhausted"
  }

  // Schedule the future re-attempt in DATA ONLY (the drain will pick it up).
  const scheduledFor = computeNextAttemptAt(nowFn(), attempt, config.backoff)
  await repo.markRetry(delivery.id, at, code, scheduledFor)
  logger.info("lead.notification.retry.scheduled", {
    ...base,
    attempt,
    status: "pending",
    failureClass: code,
    nextAttemptAt: scheduledFor,
  })
  return "retry"
}

/**
 * Wrap the attempt with provider resolution. When the provider cannot currently send
 * (disabled/misconfigured/unsupported) the pending intent is PRESERVED, `attempts` is
 * NOT incremented, and a loud PII-free configuration event is emitted so the row can
 * be processed once configuration is corrected.
 */
export async function runEmailFirstAttempt(
  lead: Lead,
  delivery: LeadNotificationDelivery,
  repo: LeadNotificationDeliveryRepository,
  resolved: ResolvedEmailAttempt,
  ctx: AttemptContext
): Promise<void> {
  if (!resolved.ok) {
    // "disabled" should not occur here (no intent is created when email is off), but
    // guard anyway. Any other reason is a genuine misconfiguration — surface loudly.
    if (resolved.reason !== "disabled") {
      logger.error("lead.notification.email.misconfigured", {
        ...baseEvent(lead, delivery, ctx),
        reason: resolved.reason,
      })
    }
    return // preserve pending; no attempt, no attempts increment
  }
  void (await attemptEmailDelivery(lead, delivery, repo, resolved.config, ctx))
}
