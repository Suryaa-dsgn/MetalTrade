import "server-only"

import type { EmailTransport } from "@/lib/leads/notification/email/types"

/*
  Email transport factory (Backend Phase 2D). Fail-closed, and LOUD about
  misconfiguration — the same principle as lead persistence (no silent fallback).

  No production email SDK is implemented in this phase (vendor not yet approved), so
  no real transport exists. Selecting a provider that cannot operate is therefore an
  explicit configuration error, NOT an ordinary "disabled" or "not configured"
  state:

    - EMAIL_PROVIDER=none   → handled upstream; this factory is never called.
    - EMAIL_PROVIDER=ses    → UnsupportedEmailProviderError (adapter not implemented)
    - EMAIL_PROVIDER=resend → UnsupportedEmailProviderError (adapter not implemented)

  This prevents the dangerous state where an operator sets EMAIL_PROVIDER=ses,
  believes email is enabled, and the app silently sends nothing. When a real adapter
  lands (a future phase, with its SDK + credentials), it is registered in
  IMPLEMENTED_TRANSPORTS and this factory returns it.
*/

/** Thrown when a provider is selected whose transport adapter does not exist yet.
 *  Surfaced loudly at construction; never returned as a per-lead delivery outcome. */
export class UnsupportedEmailProviderError extends Error {
  constructor(readonly provider: string) {
    super(`Email provider "${provider}" is selected but no transport adapter is implemented`)
    this.name = "UnsupportedEmailProviderError"
  }
}

/** Thrown when a supported provider is selected but required sender/recipient
 *  configuration is missing. (Unreachable in Phase 2D — no provider is supported
 *  yet — but the check exists so config is validated the moment an adapter lands.) */
export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EmailConfigError"
  }
}

/** Transport adapters that actually exist. Empty in Phase 2D by design. A future
 *  SES/Resend adapter registers a builder here. */
const IMPLEMENTED_TRANSPORTS: Record<string, () => EmailTransport> = {}

/**
 * Build the transport for a NON-"none" provider. Throws UnsupportedEmailProviderError
 * when the adapter is not implemented (fail loudly, never downgrade to disabled).
 */
export function createEmailTransport(provider: string): EmailTransport {
  const builder = IMPLEMENTED_TRANSPORTS[provider]
  if (!builder) throw new UnsupportedEmailProviderError(provider)
  return builder()
}
