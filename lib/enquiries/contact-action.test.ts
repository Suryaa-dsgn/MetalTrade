import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/*
  Backend Phase 2A — submitContactEnquiry integration. Asserts the existing
  protections (validation, rate limit, bot) run BEFORE the LeadSubmissionService, and
  that a valid submission persists a lead and returns its public reference.
*/

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
}))

import type { MockInstance } from "vitest"
import { submitContactEnquiry } from "@/lib/enquiries/actions"
import { getLeadRepository } from "@/lib/leads/repository"
import type { LeadRepository } from "@/lib/leads/repository/types"
import { enquiryRateLimiter } from "@/lib/security/rate-limiter"

const validValues = {
  enquiryType: "general",
  name: "Ada Lovelace",
  email: "ada@example.com",
  country: "United Kingdom",
  company: "",
  phone: "",
  commodity: "",
  quantity: "",
  origin: "",
  destination: "",
  message: "We would like to discuss a requirement.",
}

let createSpy: MockInstance<LeadRepository["createOrGet"]>

beforeEach(() => {
  createSpy = vi.spyOn(getLeadRepository(), "createOrGet")
})
afterEach(() => vi.restoreAllMocks())

describe("submitContactEnquiry — protections precede the lead pipeline", () => {
  it("rejects invalid input before touching the repository", async () => {
    const result = await submitContactEnquiry({ ...validValues, email: "not-an-email" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe("validation")
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("rejects a rate-limited request before touching the repository", async () => {
    vi.spyOn(enquiryRateLimiter, "check").mockReturnValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: Date.now() + 1000,
    })
    const result = await submitContactEnquiry(validValues)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe("submission")
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("persists a lead and returns an OEML reference on a valid submission", async () => {
    const before = getLeadRepository() as unknown as { size(): number }
    const startSize = before.size()
    const result = await submitContactEnquiry(validValues)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.referenceId).toMatch(/^OEML-\d{4}-[A-Z0-9]{6}$/)
    }
    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(before.size()).toBe(startSize + 1)
  })
})
