import { describe, it, expect } from "vitest"
import { createEmailNotificationProvider } from "@/lib/leads/notification/email/provider"
import { FakeEmailTransport } from "@/lib/leads/notification/email/transports/fake"
import type { Lead } from "@/lib/leads/types"

/* Backend Phase 2D — EmailNotificationProvider: Lead → EmailMessage → transport,
   typed outcomes, bounded timeout, exception normalization, trust boundary. */

const lead: Lead = {
  id: "lead-1",
  reference: "OEML-2026-ABC234",
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T10:00:00.000Z",
  status: "new",
  enquiryType: "buy",
  contact: { name: "Ada Lovelace", email: "ada@example.com", country: "UK" },
  commodity: "copper",
  message: "Please quote copper cathode.",
  source: "contact-form",
  submissionToken: "tok-1",
}

const base = { from: "desk@oeml.example", to: "leads@oeml.example" }

describe("EmailNotificationProvider — channel + config", () => {
  it("is an email-channel provider named after its transport", () => {
    const provider = createEmailNotificationProvider({
      transport: new FakeEmailTransport(),
      ...base,
    })
    expect(provider.channel).toBe("email")
    expect(provider.name).toBe("fake")
    expect(provider.isConfigured()).toBe(true)
  })

  it("is not configured when sender/recipient are missing", () => {
    const provider = createEmailNotificationProvider({
      transport: new FakeEmailTransport(),
      from: "",
      to: "",
    })
    expect(provider.isConfigured()).toBe(false)
  })
})

describe("EmailNotificationProvider — outcome mapping", () => {
  it("maps a 'sent' transport result to ok:true", async () => {
    const provider = createEmailNotificationProvider({
      transport: new FakeEmailTransport({ result: { status: "sent" } }),
      ...base,
    })
    expect(await provider.notify(lead)).toEqual({ ok: true })
  })

  it("maps a temporary failure to a retryable NotificationResult", async () => {
    const provider = createEmailNotificationProvider({
      transport: new FakeEmailTransport({
        result: { status: "temporary_failure", code: "provider_5xx" },
      }),
      ...base,
    })
    expect(await provider.notify(lead)).toEqual({
      ok: false,
      code: "provider_5xx",
      retryable: true,
    })
  })

  it("maps a permanent failure to a non-retryable NotificationResult", async () => {
    const provider = createEmailNotificationProvider({
      transport: new FakeEmailTransport({
        result: { status: "permanent_failure", code: "rejected" },
      }),
      ...base,
    })
    expect(await provider.notify(lead)).toEqual({
      ok: false,
      code: "rejected",
      retryable: false,
    })
  })

  it("maps a transport 'not_configured' result to a non-retryable failure", async () => {
    const provider = createEmailNotificationProvider({
      transport: new FakeEmailTransport({ result: { status: "not_configured" } }),
      ...base,
    })
    expect(await provider.notify(lead)).toEqual({
      ok: false,
      code: "not_configured",
      retryable: false,
    })
  })

  it("normalizes a thrown transport exception into a safe temporary failure", async () => {
    const provider = createEmailNotificationProvider({
      transport: new FakeEmailTransport({ throwError: new Error("SDK exploded @ endpoint") }),
      ...base,
    })
    const result = await provider.notify(lead)
    expect(result).toEqual({ ok: false, code: "transport_exception", retryable: true })
    // The raw error (which could carry endpoint/PII detail) is not surfaced.
    if (!result.ok) expect(result.code).not.toContain("endpoint")
  })
})

describe("EmailNotificationProvider — bounded timeout", () => {
  it("returns a temporary failure when the transport hangs past the timeout", async () => {
    const transport = new FakeEmailTransport({ hangUntilAborted: true })
    const provider = createEmailNotificationProvider({
      transport,
      ...base,
      timeoutMs: 5, // deterministic: the hanging send resolves only on abort
    })
    const result = await provider.notify(lead)
    expect(result).toEqual({ ok: false, code: "timeout", retryable: true })
    // The transport was invoked exactly once — a timeout must not retry.
    expect(transport.sent).toHaveLength(1)
  })
})

describe("EmailNotificationProvider — trust boundary + reply-to", () => {
  it("sends from/to from config and never from the lead", async () => {
    const transport = new FakeEmailTransport()
    const provider = createEmailNotificationProvider({ transport, ...base })
    await provider.notify(lead)
    const sent = transport.sent[0]
    expect(sent.from).toBe("desk@oeml.example")
    expect(sent.to).toBe("leads@oeml.example")
    expect(sent.from).not.toBe(lead.contact.email)
    expect(sent.to).not.toBe(lead.contact.email)
  })

  it("omits reply-to by default", async () => {
    const transport = new FakeEmailTransport()
    const provider = createEmailNotificationProvider({ transport, ...base })
    await provider.notify(lead)
    expect(transport.sent[0].replyTo).toBeUndefined()
  })

  it("sets reply-to to the lead's validated email only when enabled", async () => {
    const transport = new FakeEmailTransport()
    const provider = createEmailNotificationProvider({
      transport,
      ...base,
      replyToLeadEmail: true,
    })
    await provider.notify(lead)
    expect(transport.sent[0].replyTo).toBe("ada@example.com")
    // Reply-to must never leak into from/to.
    expect(transport.sent[0].from).toBe("desk@oeml.example")
  })
})
