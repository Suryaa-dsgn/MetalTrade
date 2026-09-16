import type {
  EmailMessage,
  EmailSendOptions,
  EmailSendResult,
  EmailTransport,
} from "@/lib/leads/notification/email/types"

/*
  In-memory fake transport (Backend Phase 2D). Test-only: it performs NO network I/O
  and is never selected by the production factory. It records every message it is
  asked to send and returns a scripted outcome, so the EmailNotificationProvider's
  success / temporary_failure / permanent_failure / not_configured / exception /
  timeout paths are all exercised deterministically.

  Timeout behaviour is made deterministic via `delayMs` + an injectable timer: the
  send resolves only after the caller's abort signal fires (or the delay elapses),
  letting a test assert that a bounded timeout wrapper returns before the transport
  does — without any real waiting.
*/

export type FakeTransportOptions = {
  /** What a completed send resolves to (default: sent). */
  result?: EmailSendResult
  /** If set, `send` throws this instead of resolving (exception-normalization test). */
  throwError?: unknown
  /** If set, `send` never resolves on its own — it resolves only when the provided
   *  AbortSignal aborts. Used to test the timeout boundary deterministically. */
  hangUntilAborted?: boolean
}

export class FakeEmailTransport implements EmailTransport {
  readonly name = "fake"
  readonly sent: EmailMessage[] = []

  constructor(private readonly options: FakeTransportOptions = {}) {}

  async send(
    message: EmailMessage,
    options?: EmailSendOptions
  ): Promise<EmailSendResult> {
    this.sent.push(message)

    if (this.options.throwError !== undefined) throw this.options.throwError

    if (this.options.hangUntilAborted) {
      // Resolve only once the caller's signal aborts (never on its own), so a
      // bounded timeout wrapper is guaranteed to win the race first.
      return new Promise<EmailSendResult>((resolve) => {
        const signal = options?.signal
        if (!signal) return // intentionally never resolves without a signal
        if (signal.aborted) return resolve({ status: "temporary_failure", code: "aborted" })
        signal.addEventListener(
          "abort",
          () => resolve({ status: "temporary_failure", code: "aborted" }),
          { once: true }
        )
      })
    }

    return this.options.result ?? { status: "sent" }
  }
}
