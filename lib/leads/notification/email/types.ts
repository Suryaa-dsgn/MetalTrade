/*
  Email domain model (Backend Phase 2D). Provider-neutral: no SES/Resend/SMTP
  concepts leak in here. Two layers meet at this file:

    - EmailNotificationProvider (knows Lead)  →  builds an EmailMessage
    - EmailTransport (knows EmailMessage ONLY) →  sends it

  A transport NEVER receives a Lead, so future SES/Resend adapters stay isolated
  from the lead domain and remain reusable. `from`/`to` are ALWAYS supplied by
  validated server configuration (never by lead-controlled input); the lead only
  contributes body content and, optionally, a validated reply-to address.
*/

/** A ready-to-send message. Recipients/sender are structured fields — a transport
 *  must pass them to its SDK as structured API fields, NEVER concatenate them into
 *  raw mail headers (prevents header injection). `text` is always present; `html`
 *  is optional and, when present, has every lead-controlled value HTML-escaped. */
export type EmailMessage = {
  to: string
  from: string
  replyTo?: string
  subject: string
  text: string
  html?: string
}

/*
  Typed send outcomes — never thrown strings. The adapter boundary translates all
  provider/network exceptions into one of these before returning.

    - "sent"               delivery accepted by the provider
    - "temporary_failure"  transient (network, 5xx, timeout) — retryable LATER
                           (no retry exists in this phase)
    - "permanent_failure"  non-retryable (rejected address, 4xx, policy)
    - "not_configured"     a REGISTERED transport determined at send time it lacks
                           what it needs to operate. Distinct from an intentionally
                           DISABLED provider (EMAIL_PROVIDER=none never registers a
                           transport) and from an UNSUPPORTED/misconfigured provider
                           (surfaced loudly at construction — see factory.ts).
*/
export type EmailSendResult =
  | { status: "sent"; providerMessageId?: string }
  | { status: "temporary_failure"; code: string }
  | { status: "permanent_failure"; code: string }
  | { status: "not_configured" }

/** Optional per-send controls. `signal` lets a future real transport cooperate with
 *  cancellation where its SDK supports an AbortSignal; a plain Promise.race timeout
 *  around send() does NOT cancel the underlying request (see sendWithTimeout).
 *  `idempotencyKey` (the stable delivery id) lets a provider that supports it suppress
 *  a duplicate on an ambiguous retry — passed as a STRUCTURED option only; the
 *  transport decides how/whether to map it (never a hand-built header). Kept minimal
 *  deliberately — not overengineered. */
export type EmailSendOptions = {
  signal?: AbortSignal
  idempotencyKey?: string
}

/** What a transport can guarantee. `idempotentSend` = the provider enforces
 *  idempotency on the client-supplied key, so an ambiguous (timeout) send is safe to
 *  retry with the same key. Never assumed true — each transport declares its own
 *  (e.g. a Resend-style key-enforcing API = true; plain AWS SES SendEmail = false). */
export type EmailTransportCapabilities = {
  idempotentSend: boolean
}

/** Lowest-level abstraction: turn an EmailMessage into a delivery attempt. Knows
 *  nothing about leads. Must not throw for expected failures — return a typed
 *  EmailSendResult instead. */
export interface EmailTransport {
  readonly name: string
  readonly capabilities: EmailTransportCapabilities
  send(message: EmailMessage, options?: EmailSendOptions): Promise<EmailSendResult>
}
