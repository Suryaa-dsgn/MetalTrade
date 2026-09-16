import "server-only"

import type { Lead, NotificationDelivery } from "@/lib/leads/types"
import type { NotificationProvider } from "@/lib/leads/notification/types"
import { logNotificationProvider } from "@/lib/leads/notification/providers/log"
import {
  getEmailSettings,
  resolveEmailNotificationProvider,
  emailMisconfigReason,
} from "@/lib/leads/notification/email/registration"
import { logger } from "@/lib/observability/logger"

/*
  LeadNotificationService (Backend Phase 2A; email seam added 2D). Dispatches a
  persisted lead to each CONFIGURED provider, producing a NotificationDelivery record
  per channel and emitting PII-free events. It NEVER throws to the caller — a
  notification failure must not change submission success (the lead is already
  persisted). Providers whose isConfigured() is false are skipped cleanly (no
  misleading failure event). Delivery is synchronous on the request path with a
  bounded per-provider timeout (in the email provider); there are no fire-and-forget
  promises and no automatic retry yet — durable delivery/retry is Phase 2E.
  Deliveries are returned for observability; they are NOT separately persisted yet.
*/

export interface LeadNotificationService {
  notify(
    lead: Lead,
    ctx: { correlationId: string }
  ): Promise<NotificationDelivery[]>
}

class DefaultLeadNotificationService implements LeadNotificationService {
  constructor(private readonly providers: NotificationProvider[]) {}

  async notify(
    lead: Lead,
    ctx: { correlationId: string }
  ): Promise<NotificationDelivery[]> {
    const deliveries: NotificationDelivery[] = []

    for (const provider of this.providers) {
      if (!provider.isConfigured()) continue
      const lastAttemptAt = new Date().toISOString()
      const base = {
        leadId: lead.id,
        channel: provider.channel,
        provider: provider.name,
        attempts: 1,
        lastAttemptAt,
      }

      logger.info("lead.notification.started", {
        correlationId: ctx.correlationId,
        leadId: lead.id,
        channel: provider.channel,
        provider: provider.name,
        attempt: 1,
      })

      try {
        const result = await provider.notify(lead)
        if (result.ok) {
          deliveries.push({ ...base, status: "sent" })
          logger.info("lead.notification.sent", {
            correlationId: ctx.correlationId,
            leadId: lead.id,
            channel: provider.channel,
            provider: provider.name,
            attempt: 1,
          })
        } else {
          deliveries.push({ ...base, status: "failed", lastErrorClass: result.code })
          logger.warn("lead.notification.failed", {
            correlationId: ctx.correlationId,
            leadId: lead.id,
            channel: provider.channel,
            provider: provider.name,
            code: result.code,
            attempt: 1,
          })
        }
      } catch (err) {
        // A thrown provider error must never break the submission.
        const errorClass = err instanceof Error ? err.name : "unknown"
        deliveries.push({ ...base, status: "failed", lastErrorClass: errorClass })
        logger.error("lead.notification.failed", {
          correlationId: ctx.correlationId,
          leadId: lead.id,
          channel: provider.channel,
          provider: provider.name,
          errorClass,
          attempt: 1,
        })
      }
    }

    return deliveries
  }
}

/*
  Build the default provider set. The log provider always runs. The email provider
  is registered ONLY when it can operate (EMAIL_PROVIDER != none and a supported,
  configured adapter). A misconfiguration (e.g. EMAIL_PROVIDER=ses with no adapter,
  or missing sender/recipient) is surfaced LOUDLY at error level and the email
  provider is left unregistered — this never silently behaves like "none" and never
  breaks lead capture (the caller must not throw on the persist path).
*/
export function buildDefaultNotificationProviders(): NotificationProvider[] {
  const providers: NotificationProvider[] = [logNotificationProvider]
  const settings = getEmailSettings()
  try {
    const email = resolveEmailNotificationProvider(settings)
    if (email) providers.push(email)
  } catch (err) {
    logger.error("lead.notification.email.misconfigured", {
      provider: settings.provider,
      reason: emailMisconfigReason(err),
    })
  }
  return providers
}

// Per-instance singleton with the default provider set.
let instance: LeadNotificationService | null = null

export function getLeadNotificationService(): LeadNotificationService {
  if (!instance) {
    instance = new DefaultLeadNotificationService(buildDefaultNotificationProviders())
  }
  return instance
}

/** Construct a service with an explicit provider set (tests / future composition). */
export function createLeadNotificationService(
  providers: NotificationProvider[]
): LeadNotificationService {
  return new DefaultLeadNotificationService(providers)
}
