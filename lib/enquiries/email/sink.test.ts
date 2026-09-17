import { describe, it, expect, vi, afterEach } from "vitest"
import {
  resendEnquiryEmailSink,
  logEnquiryEmailSink,
  unavailableEnquiryEmailSink,
  getContactEnquiryEmailSink,
} from "@/lib/enquiries/email/sink"
import { FakeEmailTransport } from "@/lib/leads/notification/email/transports/fake"
import type { Lead } from "@/lib/leads/types"
import { logger, type LogFields } from "@/lib/observability/logger"

/*
  Enquiry email sink (email-only lead flow). The Resend SDK is never touched — a fake
  transport is injected. From/To come only from config; the submitter email may be
  Reply-To; failures map to safe categories; production without config fails closed.
*/

const lead: Lead = {
  id: "lead-1",
  reference: "OEML-2026-ABC234",
  createdAt: "2026-09-17T10:00:00.000Z",
  updatedAt: "2026-09-17T10:00:00.000Z",
  status: "new",
  enquiryType: "supply",
  contact: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+44 20 7946 0000",
    company: "Analytical Engines",
    country: "United Kingdom",
  },
  commodity: "copper",
  quantity: "500 MT",
  origin: "Chile",
  message: "Please quote copper cathode.",
  source: "contact-form",
  submissionToken: "tok-1",
}

const ctx = { correlationId: "corr-1", idempotencyKey: "tok-1" }
const base = { from: "OEML Enquiries <enquiries@oeml.example>", to: "sales@oeml.example" }

afterEach(() => vi.restoreAllMocks())

describe("resendEnquiryEmailSink", () => {
  it("sends one email with From/To from config and reports the provider message id", async () => {
    const transport = new FakeEmailTransport({ result: { status: "sent", providerMessageId: "re_1" } })
    const sink = resendEnquiryEmailSink({ ...base, transport, replyToMode: "lead-email" })
    const outcome = await sink.deliver(lead, ctx)

    expect(outcome).toEqual({ ok: true, providerMessageId: "re_1" })
    expect(transport.sent).toHaveLength(1)
    const msg = transport.sent[0]
    expect(msg.from).toBe(base.from)
    expect(msg.to).toBe(base.to)
    // The submitter's email is NEVER the sender or recipient.
    expect(msg.from).not.toBe(lead.contact.email)
    expect(msg.to).not.toBe(lead.contact.email)
  })

  it("uses the submitter email as Reply-To only when the mode enables it", async () => {
    const t1 = new FakeEmailTransport({ result: { status: "sent" } })
    await resendEnquiryEmailSink({ ...base, transport: t1, replyToMode: "lead-email" }).deliver(lead, ctx)
    expect(t1.sent[0].replyTo).toBe("ada@example.com")

    const t2 = new FakeEmailTransport({ result: { status: "sent" } })
    await resendEnquiryEmailSink({ ...base, transport: t2, replyToMode: "none" }).deliver(lead, ctx)
    expect(t2.sent[0].replyTo).toBeUndefined()
  })

  it("carries the enquiry-type subject", async () => {
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    await resendEnquiryEmailSink({ ...base, transport, replyToMode: "none" }).deliver(lead, ctx)
    expect(transport.sent[0].subject).toBe("New OEML Supply Enquiry — Copper")
  })

  it("forwards the idempotency key to the transport", async () => {
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    await resendEnquiryEmailSink({ ...base, transport, replyToMode: "none" }).deliver(lead, ctx)
    expect(transport.idempotencyKeys).toEqual(["tok-1"])
  })

  it("handles a lead with only required fields (optional fields omitted)", async () => {
    const minimal: Lead = {
      ...lead,
      enquiryType: "general",
      contact: { name: "Grace", email: "grace@example.com", country: "US" },
      commodity: undefined,
      quantity: undefined,
      origin: undefined,
    }
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    const outcome = await resendEnquiryEmailSink({ ...base, transport, replyToMode: "none" }).deliver(minimal, ctx)
    expect(outcome.ok).toBe(true)
    expect(transport.sent[0].text).not.toContain("undefined")
  })

  it("maps a permanent provider error to a permanent failure", async () => {
    const transport = new FakeEmailTransport({ result: { status: "permanent_failure", code: "validation_error" } })
    const outcome = await resendEnquiryEmailSink({ ...base, transport, replyToMode: "none" }).deliver(lead, ctx)
    expect(outcome).toEqual({ ok: false, category: "permanent" })
  })

  it("maps a temporary provider error to a temporary failure", async () => {
    const transport = new FakeEmailTransport({ result: { status: "temporary_failure", code: "rate_limit_exceeded" } })
    const outcome = await resendEnquiryEmailSink({ ...base, transport, replyToMode: "none" }).deliver(lead, ctx)
    expect(outcome).toEqual({ ok: false, category: "temporary" })
  })

  it("never logs PII in structured events (success or failure)", async () => {
    const captured: { event: string; fields?: LogFields }[] = []
    for (const level of ["info", "warn", "error"] as const) {
      vi.spyOn(logger, level).mockImplementation((event: string, fields?: LogFields) => {
        captured.push({ event, fields })
      })
    }
    const transport = new FakeEmailTransport({ result: { status: "temporary_failure", code: "internal_server_error" } })
    await resendEnquiryEmailSink({ ...base, transport, replyToMode: "lead-email" }).deliver(lead, ctx)

    const serialized = JSON.stringify(captured)
    expect(serialized).not.toContain("Ada Lovelace")
    expect(serialized).not.toContain("ada@example.com")
    expect(serialized).not.toContain("+44 20 7946 0000")
    expect(serialized).not.toContain("Please quote copper cathode")
    expect(serialized).not.toContain("sales@oeml.example") // recipient not logged
  })
})

describe("dev + unavailable sinks", () => {
  it("the dev log sink reports success without sending", async () => {
    const outcome = await logEnquiryEmailSink.deliver(lead, ctx)
    expect(outcome).toEqual({ ok: true })
  })

  it("the unavailable sink fails closed (never a fake success)", async () => {
    const outcome = await unavailableEnquiryEmailSink.deliver(lead, ctx)
    expect(outcome).toEqual({ ok: false, category: "not_configured" })
  })
})

describe("getContactEnquiryEmailSink", () => {
  it("selects the fail-closed unavailable sink in production when unconfigured", () => {
    // RESEND_API_KEY / ENQUIRY_EMAIL_* are unset in the test env.
    expect(getContactEnquiryEmailSink({ isProduction: true }).name).toBe("unavailable")
  })

  it("selects the dev log sink outside production when unconfigured", () => {
    expect(getContactEnquiryEmailSink({ isProduction: false }).name).toBe("log")
  })
})
