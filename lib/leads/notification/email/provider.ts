import type { Lead } from "@/lib/leads/types"
import type {
  NotificationProvider,
  NotificationResult,
} from "@/lib/leads/notification/types"
import type {
  EmailSendResult,
  EmailTransport,
} from "@/lib/leads/notification/email/types"
import { buildLeadEmail } from "@/lib/leads/notification/email/content"

/*
  EmailNotificationProvider (Backend Phase 2D). The layer that KNOWS the Lead:

    Lead → (content.ts) EmailMessage → EmailTransport.send()

  The transport only ever sees an EmailMessage, so provider adapters stay isolated
  from the lead domain (point 10). from/to come from server configuration passed in
  at construction; the lead never influences them (point 6). reply-to is included
  only when the caller enabled it, and is always the lead's already-validated email
  passed as a structured field (never a hand-built header).

  Resilience: transport results are mapped to typed NotificationResults, and any
  thrown provider/network error is translated into a safe `temporary_failure` at
  this boundary (the service also guarantees no-throw, this is defence in depth).

  Bounded timeout: send() is raced against a timer so a hanging transport can never
  hang a submission. NOTE: Promise.race alone does NOT cancel the underlying
  request — a timed-out send may still complete server-side (and, once a real
  transport exists, could still deliver). We therefore ALSO pass an AbortSignal so a
  future SDK transport can cooperatively cancel where supported. No automatic retry
  exists in this phase, so a timeout cannot trigger a second send attempt.
*/

const DEFAULT_TIMEOUT_MS = 10_000

export type EmailNotificationDeps = {
  transport: EmailTransport
  /** Verified sender — server configuration only. */
  from: string
  /** Configured trade-desk recipient — server configuration only. */
  to: string
  /** When true, reply-to is set to the lead's validated email. */
  replyToLeadEmail?: boolean
  /** Bounded send timeout (ms). */
  timeoutMs?: number
}

function toNotificationResult(result: EmailSendResult): NotificationResult {
  switch (result.status) {
    case "sent":
      return { ok: true }
    case "temporary_failure":
      return { ok: false, code: result.code, retryable: true }
    case "permanent_failure":
      return { ok: false, code: result.code, retryable: false }
    case "not_configured":
      return { ok: false, code: "not_configured", retryable: false }
  }
}

export function createEmailNotificationProvider(
  deps: EmailNotificationDeps
): NotificationProvider {
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return {
    name: deps.transport.name,
    channel: "email",
    // A provider is only registered when it can operate; this defensively confirms
    // the trust-boundary inputs are present.
    isConfigured: () => Boolean(deps.transport && deps.from && deps.to),

    async notify(lead: Lead): Promise<NotificationResult> {
      const replyTo =
        deps.replyToLeadEmail && lead.contact.email
          ? lead.contact.email
          : undefined
      const message = buildLeadEmail(lead, {
        from: deps.from,
        to: deps.to,
        replyTo,
      })

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      // A bounded race: whichever settles first wins. The timeout path returns a
      // typed temporary_failure and aborts the signal (best-effort cancellation).
      const timeout = new Promise<EmailSendResult>((resolve) => {
        controller.signal.addEventListener(
          "abort",
          () => resolve({ status: "temporary_failure", code: "timeout" }),
          { once: true }
        )
      })

      try {
        const result = await Promise.race([
          deps.transport.send(message, { signal: controller.signal }),
          timeout,
        ])
        return toNotificationResult(result)
      } catch {
        // Translate any thrown provider/network exception into a safe typed
        // failure at the adapter boundary — never leak the raw error (it may
        // carry PII or endpoint detail) and never throw to the service.
        return { ok: false, code: "transport_exception", retryable: true }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
