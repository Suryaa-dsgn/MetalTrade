import { describe, it, expect, vi, afterEach } from "vitest"
import { submitLead } from "@/lib/leads/service"
import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import { InMemoryLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.memory"
import {
  InMemoryLeadUnitOfWork,
  SingleRepositoryUnitOfWork,
} from "@/lib/leads/unit-of-work"
import type { LeadRepository } from "@/lib/leads/repository/types"
import type { LeadInput, LeadSubmissionContext } from "@/lib/leads/types"
import { logger, type LogFields } from "@/lib/observability/logger"

/*
  Backend Phase 2E-1 — transactional outbox: lead + notification intent persist
  atomically; intent idempotency; email disabled vs configured; PII-free delivery row.
*/

const input: LeadInput = {
  enquiryType: "buy",
  name: "Ada Lovelace",
  email: "ada@example.com",
  country: "United Kingdom",
  company: "Analytical Engines",
  phone: "+44 20 7946 0000",
  commodity: "copper",
  quantity: "500 MT",
  origin: "",
  destination: "Rotterdam",
  message: "Please quote copper cathode.",
}

const ctx: LeadSubmissionContext = {
  submissionToken: "tok-1",
  correlationId: "corr-1",
  source: "contact-form",
}

const emailIntent = {
  channel: "email" as const,
  purpose: "internal_lead_alert" as const,
  provider: "resend",
}

// Notifier stub so the log-channel dispatch does nothing in these persistence tests.
const notifier = { notify: async () => [] }
// No-op first attempt: these tests assert PERSISTENCE (intent creation/rollback), not
// the send outcome, so we isolate them from config-resolved delivery.
const noAttempt = async () => {}

afterEach(() => vi.restoreAllMocks())

describe("submitLead — atomic lead + intent (2E-1)", () => {
  it("(1) commits the lead and a pending intent together", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const result = await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })

    expect(result.ok).toBe(true)
    expect(uow.leads.size()).toBe(1)
    expect(uow.deliveries.size()).toBe(1)

    const delivery = uow.deliveries.all()[0]
    expect(delivery).toMatchObject({
      channel: "email",
      purpose: "internal_lead_alert",
      provider: "resend",
      status: "pending",
      attempts: 0,
    })
    if (result.ok) expect(delivery.leadId).toBe(result.lead.id)
    expect(delivery.nextAttemptAt).toBeTruthy()
    expect(delivery.id).toBeTruthy()
  })

  it("(2) rolls back the newly created lead when the intent write fails", async () => {
    class ThrowingDeliveries extends InMemoryLeadNotificationDeliveryRepository {
      override async createIntent(): Promise<never> {
        throw new Error("intent write failed")
      }
    }
    const leads = new InMemoryLeadRepository()
    const uow = new InMemoryLeadUnitOfWork(leads, new ThrowingDeliveries())

    const result = await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })

    expect(result).toEqual({ ok: false, reason: "persistence" })
    expect(leads.size()).toBe(0) // lead rolled back with the failed intent
  })

  it("(3) creates no intent when the lead write fails", async () => {
    const deliveries = new InMemoryLeadNotificationDeliveryRepository()
    const createIntent = vi.spyOn(deliveries, "createIntent")
    const throwingLeads: LeadRepository = {
      durability: "durable",
      createOrGet: async () => {
        throw new Error("db down")
      },
    }
    const uow = new SingleRepositoryUnitOfWork(throwingLeads, deliveries)

    const result = await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })

    expect(result).toEqual({ ok: false, reason: "persistence" })
    expect(createIntent).not.toHaveBeenCalled()
  })

  it("(4) a duplicate submission creates no duplicate intent", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })
    await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })

    expect(uow.leads.size()).toBe(1)
    expect(uow.deliveries.size()).toBe(1)
  })

  it("(5) concurrent same-token submissions leave one lead and one intent", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    await Promise.all([
      submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt }),
      submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt }),
    ])
    expect(uow.leads.size()).toBe(1)
    expect(uow.deliveries.size()).toBe(1)
  })

  it("(8) creates NO email intent when email is disabled (emailIntent=null)", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const result = await submitLead(input, ctx, {
      unitOfWork: uow,
      notifier,
      emailIntent: null,
      firstAttempt: noAttempt,
    })
    expect(result.ok).toBe(true)
    expect(uow.leads.size()).toBe(1)
    expect(uow.deliveries.size()).toBe(0)
  })

  it("(8b) default resolution (EMAIL_PROVIDER=none in test env) creates no intent", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    // No emailIntent dep → derived from config, which defaults to "none".
    const result = await submitLead(input, ctx, { unitOfWork: uow, notifier, firstAttempt: noAttempt })
    expect(result.ok).toBe(true)
    expect(uow.deliveries.size()).toBe(0)
  })

  it("(9) a configured email purpose creates exactly one pending intent", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })
    const rows = uow.deliveries.all()
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe("pending")
    expect(rows[0].purpose).toBe("internal_lead_alert")
    expect(rows[0].attempts).toBe(0)
  })

  it("(10) the delivery row contains no PII", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })
    const serialized = JSON.stringify(uow.deliveries.all())
    expect(serialized).not.toContain("Ada Lovelace")
    expect(serialized).not.toContain("ada@example.com")
    expect(serialized).not.toContain("+44 20 7946 0000")
    expect(serialized).not.toContain("Please quote copper cathode")
    expect(serialized).not.toContain("Analytical Engines")
  })

  it("(12) existing lead idempotency behavior remains intact (same reference on retry)", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const first = await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })
    const second = await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })
    expect(first.ok && first.created).toBe(true)
    expect(second.ok && second.created).toBe(false)
    if (first.ok && second.ok) {
      expect(first.lead.reference).toBe(second.lead.reference)
    }
  })

  it("still notifies exactly once for a created lead, never for a duplicate", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const notify = vi.fn().mockResolvedValue([])
    await submitLead(input, ctx, { unitOfWork: uow, notifier: { notify }, emailIntent, firstAttempt: noAttempt })
    await submitLead(input, ctx, { unitOfWork: uow, notifier: { notify }, emailIntent, firstAttempt: noAttempt })
    expect(notify).toHaveBeenCalledTimes(1)
  })

  it("logs a PII-free lead.notification.intent.persisted event", async () => {
    const captured: { event: string; fields?: LogFields }[] = []
    vi.spyOn(logger, "info").mockImplementation((event, fields) => {
      captured.push({ event, fields })
    })
    const uow = new InMemoryLeadUnitOfWork()
    await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt: noAttempt })

    const persisted = captured.find((e) => e.event === "lead.notification.intent.persisted")
    expect(persisted).toBeTruthy()
    expect(persisted?.fields).toMatchObject({
      channel: "email",
      purpose: "internal_lead_alert",
      provider: "resend",
    })
    const serialized = JSON.stringify(captured)
    expect(serialized).not.toContain("ada@example.com")
    expect(serialized).not.toContain("Ada Lovelace")
  })
})
