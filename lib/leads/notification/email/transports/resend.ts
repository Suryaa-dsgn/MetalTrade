import { Resend } from "resend"

import type {
  EmailMessage,
  EmailSendOptions,
  EmailSendResult,
  EmailTransport,
} from "@/lib/leads/notification/email/types"

/*
  Backend — Resend concrete EmailTransport (real email activation). Knows only an
  EmailMessage (never a Lead), so it stays isolated from the lead domain and behind the
  same seam every other transport uses. It maps Resend's SDK outcome into the
  provider-neutral EmailSendResult and NEVER leaks raw provider bodies (only a short,
  safe error-code classification).

  Idempotency: Resend supports a client-supplied idempotency key (sent as the
  `Idempotency-Key` header). We forward EmailSendOptions.idempotencyKey (the stable
  delivery id), so an ambiguous retry within Resend's window is de-duplicated — hence
  capabilities.idempotentSend = true.

  Cancellation: the Resend SDK does not currently accept an AbortSignal, so
  options.signal cannot cancel an in-flight request. The bounded timeout in
  `sendWithTimeout` still caps how long a submission waits, and provider idempotency
  keeps a later retry safe. This limitation is documented, not worked around.
*/

/** Minimal shape of `resend.emails` we depend on — lets tests inject a fake client
 *  without the network or the real SDK. */
export interface ResendEmailsClient {
  send(
    payload: {
      from: string
      to: string
      subject: string
      text: string
      html?: string
      replyTo?: string
    },
    options?: { idempotencyKey?: string }
  ): Promise<{
    data: { id: string } | null
    error: { name?: string; message?: string; statusCode?: number | null } | null
  }>
}

/** Resend error-code keys that are worth retrying (transient / capacity). Everything
 *  else (validation, auth, bad address, not found, …) is permanent — retry won't fix
 *  it. A 5xx or 429 status is also treated as retryable as a fallback. */
const RETRYABLE_ERROR_NAMES = new Set([
  "rate_limit_exceeded",
  "daily_quota_exceeded",
  "monthly_quota_exceeded",
  "application_error",
  "internal_server_error",
  "concurrent_idempotent_requests",
])

function classifyError(error: {
  name?: string
  statusCode?: number | null
}): EmailSendResult {
  // Use ONLY the short error-code name as the classification — never the raw message
  // (it may echo request detail). Fall back to a generic code.
  const code = error.name && error.name.length > 0 ? error.name : "provider_error"
  const status = error.statusCode ?? undefined
  const retryable =
    RETRYABLE_ERROR_NAMES.has(code) ||
    (typeof status === "number" && (status >= 500 || status === 429))
  return retryable
    ? { status: "temporary_failure", code }
    : { status: "permanent_failure", code }
}

export function createResendTransport(
  apiKey: string,
  client?: ResendEmailsClient
): EmailTransport {
  const emails: ResendEmailsClient =
    client ?? (new Resend(apiKey).emails as unknown as ResendEmailsClient)

  return {
    name: "resend",
    capabilities: { idempotentSend: true },

    async send(
      message: EmailMessage,
      options?: EmailSendOptions
    ): Promise<EmailSendResult> {
      const payload = {
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      }
      const requestOptions = options?.idempotencyKey
        ? { idempotencyKey: options.idempotencyKey }
        : undefined

      const result = await emails.send(payload, requestOptions)

      if (result.error) return classifyError(result.error)
      if (result.data?.id) {
        return { status: "sent", providerMessageId: result.data.id }
      }
      // Neither data nor error — an unexpected/malformed response. Treat as transient.
      return { status: "temporary_failure", code: "malformed_response" }
    },
  }
}
