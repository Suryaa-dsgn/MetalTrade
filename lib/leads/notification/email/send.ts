import type {
  EmailMessage,
  EmailSendResult,
  EmailTransport,
} from "@/lib/leads/notification/email/types"

/*
  Backend Phase 2E-2 — the single bounded-send primitive shared by the 2D
  EmailNotificationProvider and the durable delivery first-attempt. Races the
  transport's `send()` against a timer so a hanging transport can never hang the
  caller, and normalizes a thrown provider/network exception into a safe typed
  failure at this boundary (never leaks the raw error, never throws).

  NOTE (unchanged from 2D): a `Promise.race` timeout does NOT cancel the underlying
  request — a timed-out send may still complete server-side. The AbortSignal lets a
  cooperative transport cancel where its SDK supports it, and the caller applies the
  capability-based retry rule (an ambiguous "timeout"/"transport_exception" is only
  auto-retried when the transport declares idempotentSend). `idempotencyKey` is passed
  through as a structured option; the transport decides how to map it.
*/
export async function sendWithTimeout(
  transport: EmailTransport,
  message: EmailMessage,
  opts: { timeoutMs: number; idempotencyKey?: string }
): Promise<EmailSendResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
  const timeout = new Promise<EmailSendResult>((resolve) => {
    controller.signal.addEventListener(
      "abort",
      () => resolve({ status: "temporary_failure", code: "timeout" }),
      { once: true }
    )
  })
  try {
    return await Promise.race([
      transport.send(message, {
        signal: controller.signal,
        idempotencyKey: opts.idempotencyKey,
      }),
      timeout,
    ])
  } catch {
    return { status: "temporary_failure", code: "transport_exception" }
  } finally {
    clearTimeout(timer)
  }
}
