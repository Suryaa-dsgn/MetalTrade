import { describe, it, expect } from "vitest"
import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import { LeadReferenceCollisionError } from "@/lib/leads/repository/types"
import type { Lead } from "@/lib/leads/types"

/*
  Backend Phase 2A — in-memory repository create-or-get semantics (the same atomic
  contract Postgres will enforce with UNIQUE(submission_token)).
*/

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "id-" + Math.random().toString(36).slice(2),
    reference: "OEML-2026-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    status: "new",
    enquiryType: "general",
    contact: { name: "A", email: "a@b.com", country: "US" },
    message: "Hi",
    source: "contact-form",
    submissionToken: "tok-" + Math.random().toString(36).slice(2),
    ...overrides,
  }
}

describe("InMemoryLeadRepository.createOrGet", () => {
  it("creates a new lead", async () => {
    const repo = new InMemoryLeadRepository()
    const result = await repo.createOrGet(lead({ submissionToken: "t1" }))
    expect(result.created).toBe(true)
    expect(repo.size()).toBe(1)
  })

  it("returns the existing lead for the same submission token (idempotent)", async () => {
    const repo = new InMemoryLeadRepository()
    const first = await repo.createOrGet(lead({ submissionToken: "t1", id: "first" }))
    const second = await repo.createOrGet(lead({ submissionToken: "t1", id: "second" }))
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.lead.id).toBe("first") // original returned, not the retry's
    expect(repo.size()).toBe(1)
  })

  it("keeps separate leads for different submission tokens", async () => {
    const repo = new InMemoryLeadRepository()
    await repo.createOrGet(lead({ submissionToken: "t1" }))
    await repo.createOrGet(lead({ submissionToken: "t2" }))
    expect(repo.size()).toBe(2)
  })

  it("throws on a public-reference collision with a different lead", async () => {
    const repo = new InMemoryLeadRepository()
    await repo.createOrGet(lead({ submissionToken: "t1", reference: "OEML-2026-AAAAAA" }))
    await expect(
      repo.createOrGet(lead({ submissionToken: "t2", reference: "OEML-2026-AAAAAA" }))
    ).rejects.toBeInstanceOf(LeadReferenceCollisionError)
    expect(repo.size()).toBe(1)
  })

  it("collapses concurrent duplicate submissions to a single lead", async () => {
    const repo = new InMemoryLeadRepository()
    const a = lead({ submissionToken: "same", id: "A", reference: "OEML-2026-AAA111" })
    const b = lead({ submissionToken: "same", id: "B", reference: "OEML-2026-BBB222" })
    const [r1, r2] = await Promise.all([repo.createOrGet(a), repo.createOrGet(b)])
    const createdCount = [r1, r2].filter((r) => r.created).length
    expect(createdCount).toBe(1) // exactly one insert
    expect(repo.size()).toBe(1)
  })
})
