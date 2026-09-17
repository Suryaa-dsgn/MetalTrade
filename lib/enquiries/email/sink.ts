import "server-only"

import type { Lead } from "@/lib/leads/types"
import type { EmailTransport } from "@/lib/leads/notification/email/types"
import { buildLeadEmail } from "@/lib/leads/notification/email/content"
import { sendWithTimeout } from "@/lib/leads/notification/email/send"
import { createResendTransport } from "@/lib/leads/notification/email/transports/resend"
import { serverConfig } from "@/lib/config/env"
import { logger } from "@/lib/observability/logger"

/*
  Enquiry email sink (current lead flow — email-only, NO database). Mirrors the
  EnquirySink pattern: pick an implementation by config/environment, deliver, return a
  typed outcome. The client inbox is the lead destination; delivery success (Resend
  accepting the request) IS the submission success boundary.

  Reuses the existing email stack — buildLeadEmail (content), createResendTransport
  (provider), sendWithTimeout (bounded send) — so there is ONE email pipeline. When a
  DB/CRM is added later it becomes another sink behind this same seam without touching
  the forms.

  Trust boundary (unchanged): From/To come ONLY from server configuration; the
  submitter's validated email may become Reply-To, never From/To. PII is never logged.
*/

const DEFAULT_TIMEOUT_MS = 10_000

export type EnquiryEmailOutcome =
  | { ok: true; providerMessageId?: string }
  | { ok: false; category: "not_configured" | "temporary" | "permanent" }

export type EnquiryDeliveryContext = {
  correlationId: string
  /** Stable per-form-lifecycle token → forwarded as the provider idempotency key so
   *  an accidental double-submit is de-duplicated by Resend (no DB idempotency). */
  idempotencyKey?: string
}

export interface ContactEnquiryEmailSink {
  readonly name: string
  deliver(lead: Lead, ctx: EnquiryDeliveryContext): Promise<EnquiryEmailOutcome>
}

export type ResendEnquirySinkConfig = {
  transport: EmailTransport
  from: string
  to: string
  replyToMode: "lead-email" | "none"
  timeoutMs?: number
}

/** Real delivery: Lead → EmailMessage (buildLeadEmail) → transport. */
export function resendEnquiryEmailSink(
  config: ResendEnquirySinkConfig
): ContactEnquiryEmailSink {
  return {
    name: "resend",
    async deliver(lead, ctx): Promise<EnquiryEmailOutcome> {
      const base = {
        correlationId: ctx.correlationId,
        reference: lead.reference,
        enquiryType: lead.enquiryType,
        provider: "resend",
      }
      const replyTo =
        config.replyToMode === "lead-email" && lead.contact.email
          ? lead.contact.email
          : undefined
      const message = buildLeadEmail(lead, {
        from: config.from,
        to: config.to,
        replyTo,
      })

      logger.info("enquiry.email.started", base)

      const result = await sendWithTimeout(config.transport, message, {
        timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        idempotencyKey: ctx.idempotencyKey,
      })

      switch (result.status) {
        case "sent":
          logger.info("enquiry.email.sent", {
            ...base,
            providerMessageId: result.providerMessageId,
          })
          return { ok: true, providerMessageId: result.providerMessageId }
        case "not_configured":
          logger.error("enquiry.email.not_configured", base)
          return { ok: false, category: "not_configured" }
        case "permanent_failure":
          logger.warn("enquiry.email.failed", { ...base, failureClass: result.code, category: "permanent" })
          return { ok: false, category: "permanent" }
        case "temporary_failure":
          logger.warn("enquiry.email.failed", { ...base, failureClass: result.code, category: "temporary" })
          return { ok: false, category: "temporary" }
      }
    },
  }
}

/** Development-only sink: records safe metadata and reports success WITHOUT sending.
 *  Used only when no Resend config is present outside production. */
export const logEnquiryEmailSink: ContactEnquiryEmailSink = {
  name: "log",
  async deliver(lead, ctx): Promise<EnquiryEmailOutcome> {
    logger.info("enquiry.email.logged", {
      correlationId: ctx.correlationId,
      reference: lead.reference,
      enquiryType: lead.enquiryType,
      provider: "log",
    })
    return { ok: true }
  },
}

/** Fail-closed sink for a PRODUCTION misconfiguration: never pretends an email was
 *  sent. Surfaces loudly and returns a not_configured failure. */
export const unavailableEnquiryEmailSink: ContactEnquiryEmailSink = {
  name: "unavailable",
  async deliver(lead, ctx): Promise<EnquiryEmailOutcome> {
    logger.error("enquiry.email.not_configured", {
      correlationId: ctx.correlationId,
      reference: lead.reference,
      enquiryType: lead.enquiryType,
    })
    return { ok: false, category: "not_configured" }
  },
}

/**
 * Select the sink from server config + environment:
 *   - fully configured (RESEND_API_KEY + ENQUIRY_EMAIL_FROM + ENQUIRY_EMAIL_TO)
 *     → real Resend sink;
 *   - not configured + production → unavailable (fail closed; NEVER a fake log success);
 *   - not configured + development/test → dev log sink.
 */
export function getContactEnquiryEmailSink(opts: { isProduction?: boolean } = {}): ContactEnquiryEmailSink {
  const isProduction = opts.isProduction ?? process.env.NODE_ENV === "production"
  const apiKey = serverConfig.resendApiKey
  const from = serverConfig.enquiryEmailFrom
  const to = serverConfig.enquiryEmailTo

  if (apiKey && from && to) {
    return resendEnquiryEmailSink({
      transport: createResendTransport(apiKey),
      from,
      to,
      replyToMode: serverConfig.enquiryReplyToMode,
    })
  }
  return isProduction ? unavailableEnquiryEmailSink : logEnquiryEmailSink
}
