import { describe, it, expect, vi, afterEach } from "vitest"
import { drainNotificationDeliveries, type SendableResolution } from "@/lib/leads/notification/delivery/drain"
import { InMemoryLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.memory"
import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import { FakeEmailTransport } from "@/lib/leads/notification/email/transports/fake"
import type { Lead } from "@/lib/leads/types"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import { logger, type LogFields } from "@/lib/observability/logger"

/* Backend Phase 2E-3 — drain dispatcher: recover + deliver claimed rows using the
   shared attempt core, count outcomes, and never leak PII. */

const NOW = new Date("2026-09-16T12:00:00.000Z")
const PAST = "2026-09-16T11:00:00.000Z"

let seq = 0
function makeLead(over: Partial<Lead> = {}): Lead {
  seq++
  return {
    id: `lead-${seq}`,
    reference: `OEML-2026-R${seq}`,
    submissionToken: `tok-${seq}`,
    createdAt: PAST,
    updatedAt: PAST,
    status: "new",
    enquiryType: "buy",
    contact: { name: "Ada Lovelace", email: "ada@example.com", phone: "+1 555 0100", country: "UK" },
    commodity: "copper",
    message: "Please quote copper cathode.",
    source: "contact-form",
    ...over,
  }
}
function makeIntent(leadId: string, over: Partial<LeadNotificationDelivery> = {}): LeadNotificationDelivery {
  seq++
  return {
    id: `delivery-${seq}`,
    leadId,
    channel: "email",
    purpose: "internal_lead_alert",
    provider: "resend",
    status: "pending",
    attempts: 0,
    nextAttemptAt: PAST,
    createdAt: PAST,
    updatedAt: PAST,
    ...over,
  }
}

function sendable(transport: FakeEmailTransport): SendableResolution {
  return {
    sendableProviders: ["resend"],
    configFor: (p) =>
      p === "resend"
        ? { transport, from: "desk@oeml.example", to: "leads@oeml.example", replyToLeadEmail: false }
        : undefined,
  }
}
const empty: SendableResolution = { sendableProviders: [], configFor: () => undefined }

async function setup(intentOver: Partial<LeadNotificationDelivery> = {}) {
  const leads = new InMemoryLeadRepository()
  const deliveries = new InMemoryLeadNotificationDeliveryRepository()
  const lead = makeLead()
  await leads.createOrGet(lead)
  const { delivery } = await deliveries.createIntent(makeIntent(lead.id, intentOver))
  return { leads, deliveries, lead, delivery }
}

const base = (transport: FakeEmailTransport, leads: InMemoryLeadRepository, deliveries: InMemoryLeadNotificationDeliveryRepository) => ({
  repository: deliveries,
  leadReader: leads,
  resolveSendable: () => sendable(transport),
  workerId: "worker-1",
  now: () => NOW,
  backoff: { random: () => 0.5 },
})

afterEach(() => vi.restoreAllMocks())

describe("drainNotificationDeliveries", () => {
  it("claims a due row, sends it, and reports counts", async () => {
    const { leads, deliveries, delivery } = await setup()
    const transport = new FakeEmailTransport({ result: { status: "sent", providerMessageId: "m1" } })
    const summary = await drainNotificationDeliveries(base(transport, leads, deliveries))

    expect(summary).toEqual({ claimed: 1, sent: 1, retryScheduled: 0, failed: 0 })
    const row = deliveries.all().find((d) => d.id === delivery.id)!
    expect(row.status).toBe("sent")
    expect(row.attempts).toBe(1)
    expect(row.lockedAt).toBeUndefined() // lease cleared by the outcome
  })

  it("reuses the delivery id as the provider idempotency key", async () => {
    const { leads, deliveries, delivery } = await setup()
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    await drainNotificationDeliveries(base(transport, leads, deliveries))
    expect(transport.idempotencyKeys).toEqual([delivery.id])
  })

  it("a retryable result returns the row to pending and counts a retry", async () => {
    const { leads, deliveries, delivery } = await setup()
    const transport = new FakeEmailTransport({ result: { status: "temporary_failure", code: "provider_5xx" } })
    const summary = await drainNotificationDeliveries(base(transport, leads, deliveries))
    expect(summary).toMatchObject({ claimed: 1, sent: 0, retryScheduled: 1, failed: 0 })
    const row = deliveries.all().find((d) => d.id === delivery.id)!
    expect(row.status).toBe("pending")
    expect(row.lockedAt).toBeUndefined()
  })

  it("does not send an already-exhausted delivery", async () => {
    const { leads, deliveries, delivery } = await setup({ attempts: 6, nextAttemptAt: PAST })
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    const summary = await drainNotificationDeliveries(base(transport, leads, deliveries))
    expect(transport.sent).toHaveLength(0) // never sent again
    expect(summary).toMatchObject({ claimed: 1, sent: 0, failed: 1 })
    expect(deliveries.all().find((d) => d.id === delivery.id)!.status).toBe("failed")
  })

  it("safely fails a claimed delivery whose lead is missing", async () => {
    const deliveries = new InMemoryLeadNotificationDeliveryRepository()
    const leads = new InMemoryLeadRepository() // no lead inserted
    await deliveries.createIntent(makeIntent("ghost-lead", { nextAttemptAt: PAST }))
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    const summary = await drainNotificationDeliveries(base(transport, leads, deliveries))

    expect(transport.sent).toHaveLength(0)
    expect(summary).toMatchObject({ claimed: 1, failed: 1 })
    expect(deliveries.all()[0].status).toBe("failed")
    expect(deliveries.all()[0].lastErrorClass).toBe("lead_not_found")
  })

  it("does no work and attempts nothing when no provider is sendable", async () => {
    const { leads, deliveries, delivery } = await setup()
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    const summary = await drainNotificationDeliveries({
      ...base(transport, leads, deliveries),
      resolveSendable: () => empty,
    })
    expect(summary).toEqual({ claimed: 0, sent: 0, retryScheduled: 0, failed: 0 })
    expect(transport.sent).toHaveLength(0)
    const row = deliveries.all().find((d) => d.id === delivery.id)!
    expect(row.status).toBe("pending") // preserved
    expect(row.attempts).toBe(0) // no attempt consumed
  })

  it("reclaims an expired-lease processing row and logs it as reclaimed", async () => {
    const events: string[] = []
    vi.spyOn(logger, "info").mockImplementation((event) => events.push(event))
    const { leads, deliveries } = await setup({
      status: "processing",
      lockedAt: "2026-09-16T11:58:00.000Z", // > 60s ago
      lockedBy: "dead",
    })
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    const summary = await drainNotificationDeliveries(base(transport, leads, deliveries))
    expect(summary.claimed).toBe(1)
    expect(events).toContain("lead.notification.reclaimed")
  })

  it("emits no PII in drain logs", async () => {
    const captured: { event: string; fields?: LogFields }[] = []
    for (const level of ["info", "warn", "error"] as const) {
      vi.spyOn(logger, level).mockImplementation((event: string, fields?: LogFields) => {
        captured.push({ event, fields })
      })
    }
    const { leads, deliveries } = await setup()
    const transport = new FakeEmailTransport({ result: { status: "sent", providerMessageId: "m" } })
    await drainNotificationDeliveries(base(transport, leads, deliveries))

    const serialized = JSON.stringify(captured)
    expect(serialized).not.toContain("Ada Lovelace")
    expect(serialized).not.toContain("ada@example.com")
    expect(serialized).not.toContain("+1 555 0100")
    expect(serialized).not.toContain("Please quote copper cathode")
    expect(serialized).toContain("lead.notification.drain.completed")
  })
})
