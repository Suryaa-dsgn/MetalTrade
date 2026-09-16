import "server-only"

import { serverConfig } from "@/lib/config/env"
import type { NotificationProvider } from "@/lib/leads/notification/types"
import { createEmailNotificationProvider } from "@/lib/leads/notification/email/provider"
import {
  createEmailTransport,
  EmailConfigError,
  UnsupportedEmailProviderError,
} from "@/lib/leads/notification/email/factory"

/*
  Wiring between validated config and the notification provider set (Backend Phase
  2D). Encodes the fail-closed / fail-LOUD registration policy:

    - EMAIL_PROVIDER=none        → email intentionally disabled. No email provider
                                   is registered (so no misleading per-lead failure
                                   events), and no sender/recipient config is
                                   required. The log provider keeps operating.
    - EMAIL_PROVIDER=ses|resend  → must be operational. The transport is built
                                   (throws UnsupportedEmailProviderError today — no
                                   adapter yet) and sender/recipient are validated
                                   (EmailConfigError if missing). Errors are surfaced
                                   LOUDLY by the caller, never silently downgraded to
                                   disabled and never treated as a delivery outcome.

  This module only THROWS on misconfiguration; the caller decides how to surface it
  (see the notification service). It never breaks lead capture.
*/

export type EmailSettings = {
  provider: "none" | "ses" | "resend"
  from?: string
  to?: string
  replyTo: "disabled" | "lead-email"
}

export function getEmailSettings(): EmailSettings {
  return {
    provider: serverConfig.emailProvider,
    from: serverConfig.emailFrom,
    to: serverConfig.emailTo,
    replyTo: serverConfig.emailReplyTo,
  }
}

/**
 * Resolve the email notification provider from settings.
 *   - returns `null` when email is intentionally disabled (provider="none");
 *   - returns a configured provider when a supported provider + config are present;
 *   - THROWS (UnsupportedEmailProviderError | EmailConfigError) on misconfiguration.
 */
export function resolveEmailNotificationProvider(
  settings: EmailSettings
): NotificationProvider | null {
  if (settings.provider === "none") return null

  // Non-"none" providers must be able to operate. Build the transport first: this
  // throws UnsupportedEmailProviderError when no adapter is implemented (Phase 2D).
  const transport = createEmailTransport(settings.provider)

  // A supported provider additionally requires a verified sender + recipient.
  if (!settings.from || !settings.to) {
    throw new EmailConfigError(
      `EMAIL_PROVIDER="${settings.provider}" requires EMAIL_FROM and EMAIL_TO`
    )
  }

  return createEmailNotificationProvider({
    transport,
    from: settings.from,
    to: settings.to,
    replyToLeadEmail: settings.replyTo === "lead-email",
  })
}

/** The reason class for a loud misconfiguration log (never PII, never addresses). */
export function emailMisconfigReason(err: unknown): string {
  if (err instanceof UnsupportedEmailProviderError) return "unsupported_provider"
  if (err instanceof EmailConfigError) return "missing_addresses"
  return "unknown"
}
