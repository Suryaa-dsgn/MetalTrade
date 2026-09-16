import { describe, it, expect, vi } from "vitest"
import { submitLead } from "@/lib/leads/service"
import { InMemoryLeadUnitOfWork } from "@/lib/leads/unit-of-work"
import type { LeadInput, LeadSubmissionContext } from "@/lib/leads/types"

/*
  Backend Phase 2E-2 — submitLead wiring of the durable first attempt: invoked exactly
  once for a newly created lead, never for a duplicate or when email is disabled, and
  a failing attempt never changes the (already durable) submission result.
*/

const input: LeadInput = {
  enquiryType: "buy",
  name: "Ada Lovelace",
  email: "ada@example.com",
  country: "United Kingdom",
  commodity: "copper",
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
const notifier = { notify: async () => [] }

describe("submitLead — durable first attempt wiring", () => {
  it("invokes the first attempt exactly once for a created lead, with the persisted delivery", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const firstAttempt = vi.fn().mockResolvedValue(undefined)
    const result = await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt })

    expect(result.ok).toBe(true)
    expect(firstAttempt).toHaveBeenCalledTimes(1)
    const [passedLead, passedDelivery] = firstAttempt.mock.calls[0]
    if (result.ok) expect(passedLead.id).toBe(result.lead.id)
    expect(passedDelivery.status).toBe("pending")
    expect(passedDelivery.channel).toBe("email")
  })

  it("does not attempt again for a duplicate submission", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const firstAttempt = vi.fn().mockResolvedValue(undefined)
    await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt })
    await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt })
    expect(firstAttempt).toHaveBeenCalledTimes(1) // only the created lead
  })

  it("does not attempt a send when email is disabled (no intent)", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const firstAttempt = vi.fn().mockResolvedValue(undefined)
    const result = await submitLead(input, ctx, {
      unitOfWork: uow,
      notifier,
      emailIntent: null,
      firstAttempt,
    })
    expect(result.ok).toBe(true)
    expect(firstAttempt).not.toHaveBeenCalled()
  })

  it("a failing first attempt never changes the successful lead result", async () => {
    const uow = new InMemoryLeadUnitOfWork()
    const firstAttempt = vi.fn().mockRejectedValue(new Error("smtp exploded"))
    const result = await submitLead(input, ctx, { unitOfWork: uow, notifier, emailIntent, firstAttempt })

    expect(result.ok).toBe(true)
    expect(uow.leads.size()).toBe(1) // lead remains persisted
    if (result.ok) expect(result.created).toBe(true)
  })
})
