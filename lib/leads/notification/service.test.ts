import { describe, it, expect } from "vitest"
import { createLeadNotificationService } from "@/lib/leads/notification/service"
import { logNotificationProvider } from "@/lib/leads/notification/providers/log"
import type { NotificationProvider } from "@/lib/leads/notification/types"
import type { Lead } from "@/lib/leads/types"

/*
  Backend Phase 2A — notification service. Produces a NotificationDelivery per
  provider and never throws (a failed/throwing provider must not break submission).
*/

const lead: Lead = {
  id: "lead-1",
  reference: "OEML-2026-ABC234",
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T10:00:00.000Z",
  status: "new",
  enquiryType: "general",
  contact: { name: "A", email: "a@b.com", country: "US" },
  message: "Hi",
  source: "contact-form",
  submissionToken: "tok-1",
}

describe("LeadNotificationService", () => {
  it("records a 'sent' delivery for the log provider", async () => {
    const service = createLeadNotificationService([logNotificationProvider])
    const deliveries = await service.notify(lead, { correlationId: "c1" })
    expect(deliveries).toHaveLength(1)
    expect(deliveries[0]).toMatchObject({
      leadId: "lead-1",
      channel: "log",
      provider: "log",
      status: "sent",
      attempts: 1,
    })
  })

  it("records a 'failed' delivery (and does not throw) for a failing provider", async () => {
    const failing: NotificationProvider = {
      name: "email",
      channel: "email",
      isConfigured: () => true,
      notify: async () => ({ ok: false, code: "provider_down", retryable: true }),
    }
    const service = createLeadNotificationService([failing])
    const deliveries = await service.notify(lead, { correlationId: "c1" })
    expect(deliveries[0]).toMatchObject({
      channel: "email",
      status: "failed",
      lastErrorClass: "provider_down",
    })
  })

  it("swallows a thrown provider error and marks the delivery failed", async () => {
    const throwing: NotificationProvider = {
      name: "email",
      channel: "email",
      isConfigured: () => true,
      notify: async () => {
        throw new Error("boom")
      },
    }
    const service = createLeadNotificationService([throwing])
    await expect(
      service.notify(lead, { correlationId: "c1" })
    ).resolves.toMatchObject([{ status: "failed" }])
  })

  it("skips unconfigured providers", async () => {
    const unconfigured: NotificationProvider = {
      name: "email",
      channel: "email",
      isConfigured: () => false,
      notify: async () => ({ ok: true }),
    }
    const service = createLeadNotificationService([unconfigured])
    const deliveries = await service.notify(lead, { correlationId: "c1" })
    expect(deliveries).toHaveLength(0)
  })
})
