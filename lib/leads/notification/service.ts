import "server-only"

import type { Lead, NotificationDelivery } from "@/lib/leads/types"
import type { NotificationProvider } from "@/lib/leads/notification/types"
import { logNotificationProvider } from "@/lib/leads/notification/providers/log"
import { logger } from "@/lib/observability/logger"

/*
  LeadNotificationService (Backend Phase 2A). Dispatches a persisted lead to each
  configured provider, producing a NotificationDelivery record per channel and
  emitting PII-free events. It NEVER throws to the caller — a notification failure
  must not change submission success (the lead is already persisted). In 2A the only
  provider is the synchronous log provider (no fire-and-forget promises; real async
  retry is a later phase). Deliveries are returned for observability; they are not
  separately persisted yet.
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

      try {
        const result = await provider.notify(lead)
        if (result.ok) {
          deliveries.push({ ...base, status: "sent" })
          logger.info("lead.notification.sent", {
            correlationId: ctx.correlationId,
            leadId: lead.id,
            channel: provider.channel,
            provider: provider.name,
          })
        } else {
          deliveries.push({ ...base, status: "failed", lastErrorClass: result.code })
          logger.warn("lead.notification.failed", {
            correlationId: ctx.correlationId,
            leadId: lead.id,
            channel: provider.channel,
            provider: provider.name,
            code: result.code,
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
        })
      }
    }

    return deliveries
  }
}

// Per-instance singleton with the default provider set (log only in 2A).
let instance: LeadNotificationService | null = null

export function getLeadNotificationService(): LeadNotificationService {
  if (!instance) {
    instance = new DefaultLeadNotificationService([logNotificationProvider])
  }
  return instance
}

/** Construct a service with an explicit provider set (tests / future composition). */
export function createLeadNotificationService(
  providers: NotificationProvider[]
): LeadNotificationService {
  return new DefaultLeadNotificationService(providers)
}
