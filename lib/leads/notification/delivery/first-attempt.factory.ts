import "server-only"

import type { Lead } from "@/lib/leads/types"
import { getEmailSettings, emailMisconfigReason } from "@/lib/leads/notification/email/registration"
import { createEmailTransport } from "@/lib/leads/notification/email/factory"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import { getLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery"
import {
  runEmailFirstAttempt,
  type ResolvedEmailAttempt,
} from "@/lib/leads/notification/delivery/first-attempt"
import type { SendableResolution } from "@/lib/leads/notification/delivery/drain"
import { logger } from "@/lib/observability/logger"

/*
  Backend Phase 2E-2 — server-only wiring for the durable first attempt. Resolves the
  configured email transport (fail-loud: an unsupported/misconfigured provider yields
  a reason, never a silent disable) and runs the attempt against the durable delivery
  repository. Kept out of the pure `first-attempt.ts` so that module stays testable
  without config/`server-only`.
*/

/** Resolve the transport + trusted addresses, or a reason the provider cannot send. */
export function resolveEmailAttempt(): ResolvedEmailAttempt {
  const settings = getEmailSettings()
  if (settings.provider === "none") return { ok: false, reason: "disabled" }

  let transport
  try {
    transport = createEmailTransport(settings.provider)
  } catch (err) {
    return { ok: false, reason: emailMisconfigReason(err) }
  }
  if (!settings.from || !settings.to) {
    return { ok: false, reason: "missing_addresses" }
  }
  return {
    ok: true,
    config: {
      transport,
      from: settings.from,
      to: settings.to,
      replyToLeadEmail: settings.replyTo === "lead-email",
    },
  }
}

/**
 * Which email provider can currently send, for the drain. Reuses `resolveEmailAttempt`
 * (fail-loud). Disabled → empty (no work, no event). Misconfigured → empty + a loud
 * `lead.notification.email.misconfigured` event, so pending rows are PRESERVED (not
 * claimed, attempts untouched) until configuration is fixed.
 */
export function resolveSendableEmail(): SendableResolution {
  const settings = getEmailSettings()
  if (settings.provider === "none") {
    return { sendableProviders: [], configFor: () => undefined }
  }
  const attempt = resolveEmailAttempt()
  if (!attempt.ok) {
    logger.error("lead.notification.email.misconfigured", {
      provider: settings.provider,
      reason: attempt.reason,
    })
    return { sendableProviders: [], configFor: () => undefined }
  }
  const provider = settings.provider
  return {
    sendableProviders: [provider],
    configFor: (p) => (p === provider ? attempt.config : undefined),
  }
}

/** The default first-attempt used by the submission service. */
export async function runDefaultFirstAttempt(
  lead: Lead,
  delivery: LeadNotificationDelivery,
  ctx: { correlationId: string }
): Promise<void> {
  await runEmailFirstAttempt(
    lead,
    delivery,
    getLeadNotificationDeliveryRepository(),
    resolveEmailAttempt(),
    ctx
  )
}
