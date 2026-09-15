import { describe, it, expect, vi, afterEach } from "vitest"
import { submitLead } from "@/lib/leads/service"
import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import {
  LeadReferenceCollisionError,
  type CreateOrGetResult,
  type LeadRepository,
} from "@/lib/leads/repository/types"
import {
  createLeadNotificationService,
  type LeadNotificationService,
} from "@/lib/leads/notification/service"
import type { NotificationProvider } from "@/lib/leads/notification/types"
import type { Lead, LeadInput, LeadSubmissionContext } from "@/lib/leads/types"
import { logger, type LogFields } from "@/lib/observability/logger"

/*
  Backend Phase 2A — LeadSubmissionService orchestration + guarantees.
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

afterEach(() => vi.restoreAllMocks())

describe("submitLead — persistence success boundary", () => {
  it("persists the lead and returns its public reference", async () => {
    const repository = new InMemoryLeadRepository()
    const result = await submitLead(input, ctx, {
      repository,
      newReference: () => "OEML-2026-AAA111",
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.created).toBe(true)
      expect(result.lead.reference).toBe("OEML-2026-AAA111")
      expect(result.lead.status).toBe("new")
    }
    expect(repository.size()).toBe(1)
  })

  it("is idempotent on the same submission token — no duplicate, no second notification", async () => {
    const repository = new InMemoryLeadRepository()
    const notify = vi.fn().mockResolvedValue([])
    const notifier: LeadNotificationService = { notify }

    const first = await submitLead(input, ctx, { repository, notifier })
    const second = await submitLead(input, ctx, { repository, notifier })

    expect(first.ok && first.created).toBe(true)
    expect(second.ok && second.created).toBe(false) // duplicate
    expect(repository.size()).toBe(1)
    expect(notify).toHaveBeenCalledTimes(1) // only the first created lead notifies
  })

  it("returns a persistence error when the repository fails", async () => {
    const repository: LeadRepository = {
      createOrGet: async () => {
        throw new Error("db down")
      },
    }
    const result = await submitLead(input, ctx, { repository })
    expect(result).toEqual({ ok: false, reason: "persistence" })
  })

  it("regenerates the reference and retries on a collision, then succeeds", async () => {
    const real = new InMemoryLeadRepository()
    let calls = 0
    const repository: LeadRepository = {
      createOrGet: async (lead: Lead): Promise<CreateOrGetResult> => {
        calls++
        if (calls === 1) throw new LeadReferenceCollisionError()
        return real.createOrGet(lead)
      },
    }
    const references = ["OEML-2026-DUP000", "OEML-2026-NEW111"]
    const result = await submitLead(input, ctx, {
      repository,
      newReference: () => references.shift() ?? "OEML-2026-ZZZ999",
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.lead.reference).toBe("OEML-2026-NEW111")
    expect(calls).toBe(2) // one collision, one success
  })
})

describe("submitLead — notification never fails submission", () => {
  it("succeeds even when the notifier throws", async () => {
    const repository = new InMemoryLeadRepository()
    const throwingProvider: NotificationProvider = {
      name: "boom",
      channel: "email",
      isConfigured: () => true,
      notify: async () => {
        throw new Error("smtp exploded")
      },
    }
    const notifier = createLeadNotificationService([throwingProvider])
    const result = await submitLead(input, ctx, { repository, notifier })
    expect(result.ok).toBe(true)
    expect(repository.size()).toBe(1) // lead is persisted regardless
  })
})

describe("submitLead — no PII in structured logs", () => {
  it("never logs name, email, phone or message", async () => {
    const captured: unknown[] = []
    for (const level of ["info", "warn", "error"] as const) {
      vi.spyOn(logger, level).mockImplementation(
        (event: string, fields?: LogFields) => {
          captured.push({ event, fields })
        }
      )
    }
    const repository = new InMemoryLeadRepository()
    await submitLead(input, ctx, { repository })

    const serialized = JSON.stringify(captured)
    expect(serialized).not.toContain("Ada Lovelace")
    expect(serialized).not.toContain("ada@example.com")
    expect(serialized).not.toContain("+44 20 7946 0000")
    expect(serialized).not.toContain("Please quote copper cathode")
    // Non-PII operational fields are fine (commodity slug, enquiry type).
    expect(serialized).toContain("lead.created")
  })
})
