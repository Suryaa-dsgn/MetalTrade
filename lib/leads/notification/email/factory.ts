import "server-only"

import { serverConfig } from "@/lib/config/env"
import type { EmailTransport } from "@/lib/leads/notification/email/types"
import { createResendTransport } from "@/lib/leads/notification/email/transports/resend"

/*
  Email transport factory. Fail-closed, and LOUD about misconfiguration — the same
  principle as lead persistence (no silent fallback).

  Selecting a provider that cannot operate is an explicit configuration error, NOT an
  ordinary "disabled" or "not configured" state:

    - EMAIL_PROVIDER=none   → handled upstream; this factory is never called.
    - EMAIL_PROVIDER=resend → ResendEmailTransport (real). Requires RESEND_API_KEY,
                              else EmailConfigError (fail loudly, no silent fallback).
    - EMAIL_PROVIDER=ses    → UnsupportedEmailProviderError (adapter not implemented).

  This prevents the dangerous state where an operator selects a provider, believes
  email is enabled, and the app silently sends nothing.
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

/** Transport adapters that actually exist. Each reads its OWN required secret and
 *  throws EmailConfigError (fail loud) when it is missing. */
const IMPLEMENTED_TRANSPORTS: Record<string, () => EmailTransport> = {
  resend: () => {
    const apiKey = serverConfig.resendApiKey
    if (!apiKey) {
      throw new EmailConfigError('EMAIL_PROVIDER="resend" requires RESEND_API_KEY')
    }
    return createResendTransport(apiKey)
  },
}

/**
 * Build the transport for a NON-"none" provider. Throws UnsupportedEmailProviderError
 * when no adapter exists for the provider, or EmailConfigError when the adapter exists
 * but its required secret is missing (both fail loudly, never downgrade to disabled).
 */
export function createEmailTransport(provider: string): EmailTransport {
  const builder = IMPLEMENTED_TRANSPORTS[provider]
  if (!builder) throw new UnsupportedEmailProviderError(provider)
  return builder()
}
