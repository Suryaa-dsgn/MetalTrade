"use server"

import { headers } from "next/headers"

import {
  enquirySchemas,
  contactEnquirySchema,
  type EnquiryIntent,
} from "@/lib/validation/enquiry"
import { getEnquirySink } from "@/lib/enquiries/sink"
import { serverConfig } from "@/lib/config/env"
import { enquiryRateLimiter } from "@/lib/security/rate-limiter"
import { deriveClientKey } from "@/lib/security/client-identity"
import { getBotVerifier } from "@/lib/security/bot-verification"
import { logger } from "@/lib/observability/logger"
import { newCorrelationId } from "@/lib/observability/correlation"
import { buildLead } from "@/lib/leads/normalize"
import { newInternalId, newPublicReference } from "@/lib/leads/reference"
import {
  getContactEnquiryEmailSink,
  type ContactEnquiryEmailSink,
} from "@/lib/enquiries/email/sink"
import {
  isValidSubmissionToken,
  tokenFingerprint,
} from "@/lib/leads/submission-token"

/*
  Enquiry submission. Validation stays here; DELIVERY is delegated to a pluggable
  server-side sink (Phase 10). The default `log` sink records redacted metadata
  only — no live email/CRM is connected. The discriminated union keeps SEPARATE
  validation and submission errors, so swapping in a real sink never changes the
  client forms. Attachments are never received here. References are clearly
  non-production DEMO codes.
*/
export type EnquiryResult =
  | { ok: true; referenceId: string }
  | { ok: false; kind: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; kind: "submission"; message: string }

const PREFIX: Record<EnquiryIntent, string> = {
  supply: "SUP",
  buying: "BUY",
  logistics: "LOG",
  general: "GEN",
}

function demoReference(intent: EnquiryIntent): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `DEMO-${PREFIX[intent]}-${code}`
}

export async function submitEnquiry(
  intent: EnquiryIntent,
  values: unknown
): Promise<EnquiryResult> {
  // Correlate this submission's log lines without any PII.
  const correlationId = newCorrelationId()

  // Defense-in-depth, application-level rate limit on the one write path. This is
  // NOT distributed protection (per-instance, in-memory) and its client identity
  // is best-effort unless a trusted proxy is asserted — the authoritative limit
  // lives at the edge (see lib/security/rate-limiter.ts).
  const requestHeaders = await headers()
  const client = deriveClientKey(
    (name) => requestHeaders.get(name),
    serverConfig.rateLimitTrustProxy
  )
  const decision = enquiryRateLimiter.check(`enquiry:${intent}:${client.key}`)
  if (!decision.allowed) {
    // No client identity / PII in the log — only that a limit tripped.
    logger.warn("enquiry.rate_limited", { correlationId, intent, trusted: client.trusted })
    return {
      ok: false,
      kind: "submission",
      message:
        "You've sent several enquiries in a short time. Please wait a few minutes and try again.",
    }
  }

  // Bot-verification seam (disabled by default → always passes; no UX change).
  const bot = await getBotVerifier().verify(null)
  if (!bot.ok) {
    return {
      ok: false,
      kind: "submission",
      message: "We couldn't verify your submission. Please try again.",
    }
  }

  // Server-side re-validation (Blueprint §7): never trust the client.
  const parsed = enquirySchemas[intent].safeParse(values)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key] = issue.message
      }
    }
    return { ok: false, kind: "validation", fieldErrors }
  }

  // Simulate just enough latency to exercise the pending UI (amendment 15).
  await new Promise((resolve) => setTimeout(resolve, 700))

  const referenceId = demoReference(intent)
  const delivery = await getEnquirySink().deliver({
    intent,
    referenceId,
    correlationId,
    values: parsed.data,
    submittedAt: new Date().toISOString(),
    hasAttachments: false, // attachments are never transmitted in this build
  })

  if (!delivery.ok) {
    // Never surface the raw sink error; give a safe, retryable message.
    return {
      ok: false,
      kind: "submission",
      message:
        "We couldn't submit your enquiry just now. Please try again in a moment.",
    }
  }

  return { ok: true, referenceId }
}

export type SubmitContactDeps = {
  /** Injected email sink (default: config/environment-selected). */
  sink?: ContactEnquiryEmailSink
  /** Injected production flag (default: NODE_ENV). Steers the not-configured path. */
  isProduction?: boolean
}

/*
  Unified Contact submission — CURRENT lead flow (email-only, NO database). Same
  server-side security as before (rate limit + bot seam + correlation IDs + redacted
  logging + bounded/strict Zod), all BEFORE any delivery. After validation the payload
  is normalized into a Lead-shaped object (in memory, NOT persisted) and delivered to
  the client inbox via the Resend email sink. Delivery success — Resend accepting the
  request — IS the submission success boundary (there is no persistent lead store in
  this phase; a DB/CRM sink can be added later behind the same seam).

  The submissionToken is CLIENT-generated and untrusted: validated (UUID-shaped,
  bounded), only ever logged as a fingerprint, and forwarded as the provider
  idempotency key so an accidental double-submit is de-duplicated by Resend. No DB
  idempotency is added in this phase.
*/
export async function submitContactEnquiry(
  values: unknown,
  submissionToken: unknown,
  deps: SubmitContactDeps = {}
): Promise<EnquiryResult> {
  const correlationId = newCorrelationId()

  // Defense-in-depth rate limit, keyed per client (not per enquiry type, so it
  // can't be bypassed by rotating the type). Best-effort identity; the edge owns
  // the authoritative limit.
  const requestHeaders = await headers()
  const client = deriveClientKey(
    (name) => requestHeaders.get(name),
    serverConfig.rateLimitTrustProxy
  )
  const decision = enquiryRateLimiter.check(`contact:${client.key}`)
  if (!decision.allowed) {
    logger.warn("enquiry.submission.rejected", {
      correlationId,
      reason: "rate_limit",
      trusted: client.trusted,
    })
    return {
      ok: false,
      kind: "submission",
      message:
        "You've sent several enquiries in a short time. Please wait a few minutes and try again.",
    }
  }

  const bot = await getBotVerifier().verify(null)
  if (!bot.ok) {
    logger.warn("enquiry.submission.rejected", { correlationId, reason: "bot" })
    return {
      ok: false,
      kind: "submission",
      message: "We couldn't verify your submission. Please try again.",
    }
  }

  // Server-side re-validation (authoritative): bounded, strict, conditional.
  const parsed = contactEnquirySchema.safeParse(values)
  if (!parsed.success) {
    logger.warn("enquiry.submission.rejected", { correlationId, reason: "validation" })
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key] = issue.message
      }
    }
    return { ok: false, kind: "validation", fieldErrors }
  }

  // Validate the untrusted idempotency token (UUID-shaped, bounded). Log only a
  // fingerprint, never the raw token.
  if (!isValidSubmissionToken(submissionToken)) {
    logger.warn("enquiry.submission.rejected", {
      correlationId,
      reason: "invalid_token",
      tokenFingerprint:
        typeof submissionToken === "string"
          ? tokenFingerprint(submissionToken)
          : undefined,
    })
    return {
      ok: false,
      kind: "submission",
      message:
        "We couldn't send your enquiry right now. Please try again.",
    }
  }

  // Normalize into a Lead-shaped object (NOT persisted) so the email content builder
  // and the future DB/CRM sinks share one shape. The public reference is the human
  // enquiry id shown to the user and in the email.
  const now = new Date()
  const lead = buildLead(parsed.data, {
    id: newInternalId(),
    reference: newPublicReference(now),
    now: now.toISOString(),
    submissionToken,
    source: "contact-form",
  })

  logger.info("enquiry.submission.started", {
    correlationId,
    enquiryType: lead.enquiryType,
    commodity: lead.commodity,
  })

  // Deliver to the client inbox. Success is shown ONLY after the provider accepts.
  const sink = deps.sink ?? getContactEnquiryEmailSink({ isProduction: deps.isProduction })
  const outcome = await sink.deliver(lead, {
    correlationId,
    idempotencyKey: submissionToken,
  })

  if (outcome.ok) {
    logger.info("enquiry.submitted", {
      correlationId,
      enquiryType: lead.enquiryType,
      reference: lead.reference,
      sink: sink.name,
    })
    return { ok: true, referenceId: lead.reference }
  }

  // Never surface the provider/config detail to the user; one safe generic message.
  return {
    ok: false,
    kind: "submission",
    message: "We couldn't send your enquiry right now. Please try again.",
  }
}
