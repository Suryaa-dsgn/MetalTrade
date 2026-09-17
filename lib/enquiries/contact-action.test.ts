import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/*
  submitContactEnquiry — email-only lead flow (no database). Security precedes
  delivery; success is returned ONLY when the email sink accepts; a sink failure is a
  generic submission error; production without email config fails closed (never a fake
  success), while development falls back to the dev log sink.
*/

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
}))

import { submitContactEnquiry } from "@/lib/enquiries/actions"
import type { ContactEnquiryEmailSink } from "@/lib/enquiries/email/sink"
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

function fakeSink(outcome = { ok: true as const }) {
  const deliver = vi.fn().mockResolvedValue(outcome)
  const sink: ContactEnquiryEmailSink = { name: "fake", deliver }
  return { sink, deliver }
}

beforeEach(() => {
  vi.spyOn(enquiryRateLimiter, "check").mockReturnValue({
    allowed: true,
    limit: 5,
    remaining: 5,
    resetAt: Date.now() + 1000,
  })
})
afterEach(() => vi.restoreAllMocks())

describe("submitContactEnquiry — protections precede delivery", () => {
  it("rejects invalid input before delivering", async () => {
    const { sink, deliver } = fakeSink()
    const result = await submitContactEnquiry(
      { ...values, email: "not-an-email" },
      createSubmissionToken(),
      { sink }
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe("validation")
    expect(deliver).not.toHaveBeenCalled()
  })

  it("rejects a rate-limited request before delivering", async () => {
    vi.spyOn(enquiryRateLimiter, "check").mockReturnValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: Date.now() + 1000,
    })
    const { sink, deliver } = fakeSink()
    const result = await submitContactEnquiry(values, createSubmissionToken(), { sink })
    expect(result.ok).toBe(false)
    expect(deliver).not.toHaveBeenCalled()
  })

  it("rejects a failed bot verification before delivering", async () => {
    vi.spyOn(disabledBotVerifier, "verify").mockResolvedValue({ ok: false })
    const { sink, deliver } = fakeSink()
    const result = await submitContactEnquiry(values, createSubmissionToken(), { sink })
    expect(result.ok).toBe(false)
    expect(deliver).not.toHaveBeenCalled()
  })

  it("rejects a malformed submission token before delivering", async () => {
    const { sink, deliver } = fakeSink()
    const result = await submitContactEnquiry(values, "not-a-uuid", { sink })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe("submission")
    expect(deliver).not.toHaveBeenCalled()
  })
})

describe("submitContactEnquiry — delivery outcome", () => {
  it("returns an OEML reference and calls the sink once on success", async () => {
    const { sink, deliver } = fakeSink({ ok: true })
    const result = await submitContactEnquiry(values, createSubmissionToken(), { sink })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.referenceId).toMatch(/^OEML-\d{4}-[A-Z0-9]{6}$/)
    expect(deliver).toHaveBeenCalledTimes(1)
  })

  it("forwards the submission token as the provider idempotency key", async () => {
    const { sink, deliver } = fakeSink({ ok: true })
    const token = createSubmissionToken()
    await submitContactEnquiry(values, token, { sink })
    const ctx = deliver.mock.calls[0][1]
    expect(ctx.idempotencyKey).toBe(token)
    expect(typeof ctx.correlationId).toBe("string")
  })

  it("returns a generic submission error when delivery fails", async () => {
    const { sink } = fakeSink({ ok: false, category: "temporary" } as never)
    const result = await submitContactEnquiry(values, createSubmissionToken(), { sink })
    expect(result.ok).toBe(false)
    if (!result.ok && result.kind === "submission") {
      expect(result.message).toMatch(/couldn't send your enquiry right now/i)
    }
  })
})

describe("submitContactEnquiry — configuration selection", () => {
  it("production without email config fails closed (no fake success)", async () => {
    // No injected sink → getContactEnquiryEmailSink({isProduction:true}); RESEND_API_KEY
    // / ENQUIRY_EMAIL_* are unset in the test env → the unavailable sink.
    const result = await submitContactEnquiry(values, createSubmissionToken(), {
      isProduction: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok && result.kind === "submission") {
      expect(result.message).toMatch(/couldn't send your enquiry right now/i)
    }
  })

  it("development without email config uses the dev log sink and succeeds", async () => {
    const result = await submitContactEnquiry(values, createSubmissionToken(), {
      isProduction: false,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.referenceId).toMatch(/^OEML-\d{4}-[A-Z0-9]{6}$/)
  })
})
