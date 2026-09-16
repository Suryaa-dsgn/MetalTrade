import "server-only"

import type { Lead, LeadInput, LeadSubmissionContext } from "@/lib/leads/types"
import { buildLead } from "@/lib/leads/normalize"
import { newInternalId, newPublicReference } from "@/lib/leads/reference"
import {
  LeadReferenceCollisionError,
  type LeadRepository,
} from "@/lib/leads/repository/types"
import { getLeadRepository } from "@/lib/leads/repository"
import {
  getLeadNotificationService,
  type LeadNotificationService,
} from "@/lib/leads/notification/service"
import { logger } from "@/lib/observability/logger"

/*
  LeadSubmissionService (Backend Phase 2A). Orchestrates:
    1. normalize validated values → Lead
    2. persist atomically (createOrGet) — the SUCCESS BOUNDARY; regenerate + retry on
       a public-reference collision (bounded)
    3. if newly created, notify (synchronous log provider; never fails submission)

  Provider-agnostic and dependency-injected for tests. correlationId is carried only
  for observability. Persistence success — NOT notification — determines submission
  success.
*/

export type LeadSubmissionResult =
  | { ok: true; lead: Lead; created: boolean }
  // "unavailable": durable persistence is not configured in production (fail closed);
  // "persistence": the store errored.
  | { ok: false; reason: "unavailable" | "persistence" }

export type LeadSubmissionDeps = {
  repository?: LeadRepository
  notifier?: LeadNotificationService
  now?: () => Date
  newId?: () => string
  newReference?: (now: Date) => string
  /** Injected env flag (default reads NODE_ENV in ONE place). */
  isProduction?: boolean
}

const MAX_REFERENCE_ATTEMPTS = 5

export async function submitLead(
  input: LeadInput,
  ctx: LeadSubmissionContext,
  deps: LeadSubmissionDeps = {}
): Promise<LeadSubmissionResult> {
  const repository = deps.repository ?? getLeadRepository()
  const notifier = deps.notifier ?? getLeadNotificationService()
  const nowFn = deps.now ?? (() => new Date())
  const idFn = deps.newId ?? newInternalId
  const referenceFn = deps.newReference ?? newPublicReference
  const isProduction = deps.isProduction ?? process.env.NODE_ENV === "production"

  // Production safety: an ephemeral (in-memory) store must NEVER masquerade as
  // durable production persistence. Fail closed rather than return a false success.
  // Enforcement is driven by the repository's `durability` capability — no filename/
  // class inspection, and NODE_ENV is read in exactly one place (above).
  if (isProduction && repository.durability !== "durable") {
    logger.error("lead.submission.unavailable", {
      correlationId: ctx.correlationId,
      reason: "non_durable_store",
    })
    return { ok: false, reason: "unavailable" }
  }

  logger.info("lead.submission.started", {
    correlationId: ctx.correlationId,
    enquiryType: input.enquiryType,
    source: ctx.source,
  })
  logger.info("lead.persist.started", {
    correlationId: ctx.correlationId,
    durability: repository.durability,
  })

  for (let attempt = 1; attempt <= MAX_REFERENCE_ATTEMPTS; attempt++) {
    const now = nowFn()
    const lead = buildLead(input, {
      id: idFn(),
      reference: referenceFn(now),
      now: now.toISOString(),
      submissionToken: ctx.submissionToken,
      source: ctx.source,
    })

    try {
      const outcome = await repository.createOrGet(lead)

      if (outcome.created) {
        logger.info("lead.created", {
          correlationId: ctx.correlationId,
          leadId: outcome.lead.id,
          reference: outcome.lead.reference,
          enquiryType: outcome.lead.enquiryType,
          commodity: outcome.lead.commodity,
        })
        // Post-persist notification. Never changes submission success — the
        // service already guarantees no-throw, and this guard is belt-and-suspenders
        // so even a misbehaving notifier cannot fail a persisted submission.
        try {
          await notifier.notify(outcome.lead, { correlationId: ctx.correlationId })
        } catch (notifyErr) {
          logger.error("lead.notification.failed", {
            correlationId: ctx.correlationId,
            leadId: outcome.lead.id,
            errorClass: notifyErr instanceof Error ? notifyErr.name : "unknown",
          })
        }
      } else {
        logger.info("lead.duplicate.detected", {
          correlationId: ctx.correlationId,
          leadId: outcome.lead.id,
          reference: outcome.lead.reference,
          enquiryType: outcome.lead.enquiryType,
          commodity: outcome.lead.commodity,
        })
      }

      return { ok: true, lead: outcome.lead, created: outcome.created }
    } catch (err) {
      if (
        err instanceof LeadReferenceCollisionError &&
        attempt < MAX_REFERENCE_ATTEMPTS
      ) {
        logger.warn("lead.reference.collision", {
          correlationId: ctx.correlationId,
          attempt,
        })
        continue // regenerate reference and retry
      }
      logger.error("lead.persist.failed", {
        correlationId: ctx.correlationId,
        errorClass: err instanceof Error ? err.name : "unknown",
      })
      return { ok: false, reason: "persistence" }
    }
  }

  // Unreachable in practice (the loop returns or throws), but fail safe.
  return { ok: false, reason: "persistence" }
}
