import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/*
  Backend Phase 2B — submitContactEnquiry integration: token-driven idempotency,
  production ephemeral-store safety, and protections preceding the lead pipeline.
*/

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
}))

import type { MockInstance } from "vitest"
import { submitContactEnquiry } from "@/lib/enquiries/actions"
import { getLeadRepository } from "@/lib/leads/repository"
import type { LeadRepository } from "@/lib/leads/repository/types"
import {
  getLeadNotificationService,
  type LeadNotificationService,
} from "@/lib/leads/notification/service"
import { enquiryRateLimiter } from "@/lib/security/rate-limiter"
import { disabledBotVerifier } from "@/lib/security/bot-verification"
import { createSubmissionToken } from "@/lib/leads/submission-token"

const values = {
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

function repoSize(): number {
  return (getLeadRepository() as unknown as { size(): number }).size()
}

let createSpy: MockInstance<LeadRepository["createOrGet"]>
let notifySpy: MockInstance<LeadNotificationService["notify"]>

beforeEach(() => {
  // Neutralize the shared rate-limiter counter for pipeline tests; the rate-limit
  // case overrides this explicitly.
  vi.spyOn(enquiryRateLimiter, "check").mockReturnValue({
    allowed: true,
    limit: 5,
    remaining: 5,
    resetAt: Date.now() + 1000,
  })
  createSpy = vi.spyOn(getLeadRepository(), "createOrGet")
  notifySpy = vi.spyOn(getLeadNotificationService(), "notify")
})
afterEach(() => vi.restoreAllMocks())

describe("submitContactEnquiry — protections precede the pipeline (K)", () => {
  it("rejects invalid input before touching the repository", async () => {
    const result = await submitContactEnquiry(
      { ...values, email: "not-an-email" },
      createSubmissionToken()
    )
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
    const result = await submitContactEnquiry(values, createSubmissionToken())
    expect(result.ok).toBe(false)
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("rejects a failed bot verification before touching the repository", async () => {
    vi.spyOn(disabledBotVerifier, "verify").mockResolvedValue({ ok: false })
    const result = await submitContactEnquiry(values, createSubmissionToken())
    expect(result.ok).toBe(false)
    expect(createSpy).not.toHaveBeenCalled()
  })
})

describe("submitContactEnquiry — token validation (H)", () => {
  it("rejects a malformed submission token server-side", async () => {
    const result = await submitContactEnquiry(values, "not-a-uuid")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe("submission")
    expect(createSpy).not.toHaveBeenCalled()
  })
})

describe("submitContactEnquiry — idempotency (E/F/G)", () => {
  it("(E) double submit with the same token → one lead, one notification, same reference", async () => {
    const token = createSubmissionToken()
    const before = repoSize()
    const first = await submitContactEnquiry(values, token)
    const second = await submitContactEnquiry(values, token)
    expect(first.ok && second.ok).toBe(true)
    if (first.ok && second.ok) {
      expect(first.referenceId).toBe(second.referenceId) // same public reference
    }
    expect(repoSize()).toBe(before + 1) // exactly one lead
    expect(notifySpy).toHaveBeenCalledTimes(1) // only the created lead notifies
  })

  it("(F) concurrent same-token requests → one lead, one notification, same reference", async () => {
    const token = createSubmissionToken()
    const before = repoSize()
    const [a, b] = await Promise.all([
      submitContactEnquiry(values, token),
      submitContactEnquiry(values, token),
    ])
    expect(a.ok && b.ok).toBe(true)
    if (a.ok && b.ok) expect(a.referenceId).toBe(b.referenceId)
    expect(repoSize()).toBe(before + 1)
    expect(notifySpy).toHaveBeenCalledTimes(1)
  })

  it("(G) different tokens → separate leads with distinct references", async () => {
    const before = repoSize()
    const first = await submitContactEnquiry(values, createSubmissionToken())
    const second = await submitContactEnquiry(values, createSubmissionToken())
    expect(first.ok && second.ok).toBe(true)
    if (first.ok && second.ok) {
      expect(first.referenceId).not.toBe(second.referenceId)
    }
    expect(repoSize()).toBe(before + 2)
  })
})

describe("submitContactEnquiry — reference shape + dev works (J)", () => {
  it("persists and returns an OEML reference in development/test", async () => {
    const result = await submitContactEnquiry(values, createSubmissionToken())
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.referenceId).toMatch(/^OEML-\d{4}-[A-Z0-9]{6}$/)
    expect(createSpy).toHaveBeenCalledTimes(1)
  })
})

describe("submitContactEnquiry — production ephemeral-store fails closed (I)", () => {
  it("returns a generic temporary-unavailable result and does not persist", async () => {
    const prev = process.env.NODE_ENV
    // @ts-expect-error test override
    process.env.NODE_ENV = "production"
    try {
      const before = repoSize()
      const result = await submitContactEnquiry(values, createSubmissionToken())
      expect(result.ok).toBe(false)
      if (!result.ok && result.kind === "submission") {
        expect(result.message).toMatch(/right now\. Please try again later/i)
      }
      expect(createSpy).not.toHaveBeenCalled() // fail closed before persistence
      expect(repoSize()).toBe(before)
    } finally {
      // @ts-expect-error restore
      process.env.NODE_ENV = prev
    }
  })
})
