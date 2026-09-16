import "server-only"

import type { Lead, LeadInput, LeadSubmissionContext } from "@/lib/leads/types"
import { buildLead } from "@/lib/leads/normalize"
import { newInternalId, newPublicReference } from "@/lib/leads/reference"
import {
  LeadReferenceCollisionError,
  type LeadRepository,
} from "@/lib/leads/repository/types"
import type { LeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import {
  type LeadUnitOfWork,
  SingleRepositoryUnitOfWork,
} from "@/lib/leads/unit-of-work"
import { getLeadUnitOfWork } from "@/lib/leads/unit-of-work.factory"
import {
  getLeadNotificationService,
  type LeadNotificationService,
} from "@/lib/leads/notification/service"
import {
  defaultEmailIntent,
  type EmailIntentDescriptor,
} from "@/lib/leads/notification/email/registration"
import { runDefaultFirstAttempt } from "@/lib/leads/notification/delivery/first-attempt.factory"
import { logger } from "@/lib/observability/logger"

/*
  LeadSubmissionService (Backend Phase 2A; Phase 2E-1 adds the durable outbox).
  Orchestrates, within ONE atomic Unit of Work:
    1. normalize validated values → Lead
    2. persist the lead (createOrGet) AND, for a newly created lead with email
       intended, persist a `pending` notification INTENT — both commit together or
       roll back together (transactional outbox). This is the SUCCESS BOUNDARY.
       A public-reference collision regenerates + retries (bounded).
  Then, OUTSIDE the transaction and best-effort (never failing submission), it runs
  the existing notification dispatch (Phase 2D). Notification never gates success.

  Provider-agnostic and dependency-injected for tests; the service holds NO raw SQL
  (the Unit of Work owns the transaction). correlationId is observability metadata.
*/

export type LeadSubmissionResult =
  | { ok: true; lead: Lead; created: boolean }
  // "unavailable": durable persistence is not configured in production (fail closed);
  // "persistence": the store errored.
  | { ok: false; reason: "unavailable" | "persistence" }

export type LeadSubmissionDeps = {
  /** The atomic Unit of Work (default: selected by LEAD_STORE via the factory). */
  unitOfWork?: LeadUnitOfWork
  /** Legacy/test convenience: a single LeadRepository, wrapped in a Unit of Work.
   *  Ignored when `unitOfWork` is provided. */
  repository?: LeadRepository
  /** Optional delivery repo paired with `repository` (else an in-memory one). */
  deliveries?: LeadNotificationDeliveryRepository
  notifier?: LeadNotificationService
  now?: () => Date
  newId?: () => string
  newDeliveryId?: () => string
  newReference?: (now: Date) => string
  /** Injected env flag (default reads NODE_ENV in ONE place). */
  isProduction?: boolean
  /** The notification intent to persist for a new lead; default derived from config
   *  (`null` = email disabled → no intent row). Injectable for tests. */
  emailIntent?: EmailIntentDescriptor | null
  /** The durable first-attempt (default: config-resolved email attempt). Runs
   *  post-commit, best-effort; never fails the submission. Injectable for tests. */
  firstAttempt?: (
    lead: Lead,
    delivery: LeadNotificationDelivery,
    ctx: { correlationId: string }
  ) => Promise<void>
}

const MAX_REFERENCE_ATTEMPTS = 5

function resolveUnitOfWork(deps: LeadSubmissionDeps): LeadUnitOfWork {
  if (deps.unitOfWork) return deps.unitOfWork
  if (deps.repository) {
    return new SingleRepositoryUnitOfWork(deps.repository, deps.deliveries)
  }
  return getLeadUnitOfWork()
}

export async function submitLead(
  input: LeadInput,
  ctx: LeadSubmissionContext,
  deps: LeadSubmissionDeps = {}
): Promise<LeadSubmissionResult> {
  const unitOfWork = resolveUnitOfWork(deps)
  const notifier = deps.notifier ?? getLeadNotificationService()
  const nowFn = deps.now ?? (() => new Date())
  const idFn = deps.newId ?? newInternalId
  const deliveryIdFn = deps.newDeliveryId ?? newInternalId
  const referenceFn = deps.newReference ?? newPublicReference
  const isProduction = deps.isProduction ?? process.env.NODE_ENV === "production"
  const emailIntent =
    deps.emailIntent !== undefined ? deps.emailIntent : defaultEmailIntent()
  const firstAttempt = deps.firstAttempt ?? runDefaultFirstAttempt

  // Production safety: an ephemeral (in-memory) store must NEVER masquerade as
  // durable production persistence. Fail closed rather than return a false success.
  // Enforcement is driven by the Unit of Work's `durability` capability — no
  // filename/class inspection, and NODE_ENV is read in exactly one place (above).
  if (isProduction && unitOfWork.durability !== "durable") {
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
    durability: unitOfWork.durability,
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
      // Atomic unit of work: lead + (for a new lead with email intended) the pending
      // notification intent. Both commit together or roll back together.
      const { outcome, intentCreated, delivery } = await unitOfWork.run(
        async ({ leads, deliveries }) => {
          const outcome = await leads.createOrGet(lead)
          let intentCreated = false
          let delivery: LeadNotificationDelivery | undefined
          if (outcome.created && emailIntent) {
            const nowIso = now.toISOString()
            const intent: LeadNotificationDelivery = {
              id: deliveryIdFn(),
              leadId: outcome.lead.id,
              channel: emailIntent.channel,
              purpose: emailIntent.purpose,
              provider: emailIntent.provider,
              status: "pending",
              attempts: 0,
              nextAttemptAt: nowIso,
              createdAt: nowIso,
              updatedAt: nowIso,
            }
            const res = await deliveries.createIntent(intent)
            intentCreated = res.created
            delivery = res.delivery
          }
          return { outcome, intentCreated, delivery }
        }
      )

      if (outcome.created) {
        logger.info("lead.created", {
          correlationId: ctx.correlationId,
          leadId: outcome.lead.id,
          reference: outcome.lead.reference,
          enquiryType: outcome.lead.enquiryType,
          commodity: outcome.lead.commodity,
        })
        if (intentCreated && emailIntent) {
          logger.info("lead.notification.intent.persisted", {
            correlationId: ctx.correlationId,
            leadId: outcome.lead.id,
            channel: emailIntent.channel,
            purpose: emailIntent.purpose,
            provider: emailIntent.provider,
          })
        }

        // Durable first attempt (2E-2): bounded email send whose OUTCOME is persisted
        // onto the delivery row. Runs OUTSIDE the transaction, best-effort — a send
        // failure/timeout never changes the already-successful submission. Only for a
        // newly persisted intent (so a duplicate never triggers a second attempt).
        if (intentCreated && delivery) {
          try {
            await firstAttempt(outcome.lead, delivery, {
              correlationId: ctx.correlationId,
            })
          } catch (attemptErr) {
            logger.error("lead.notification.failed", {
              correlationId: ctx.correlationId,
              leadId: outcome.lead.id,
              deliveryId: delivery.id,
              errorClass: attemptErr instanceof Error ? attemptErr.name : "unknown",
            })
          }
        }

        // Non-durable log-channel heartbeat (Phase 2D seam). Email is NOT dispatched
        // here any more — it flows through the durable delivery above — so there is no
        // double send. Best-effort; never fails a persisted submission.
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
