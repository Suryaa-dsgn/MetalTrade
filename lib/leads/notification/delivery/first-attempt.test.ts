import { describe, it, expect, vi, afterEach } from "vitest"
import {
  attemptEmailDelivery,
  runEmailFirstAttempt,
  type EmailAttemptConfig,
} from "@/lib/leads/notification/delivery/first-attempt"
import { InMemoryLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.memory"
import { FakeEmailTransport } from "@/lib/leads/notification/email/transports/fake"
import type { Lead } from "@/lib/leads/types"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import { logger, type LogFields } from "@/lib/observability/logger"

/*
  Backend Phase 2E-2 — durable first attempt: persists the outcome onto the delivery
  row, counts attempts only for genuine sends, and applies the capability-based
  ambiguity rule. Deterministic clock + backoff injection.
*/

const lead: Lead = {
  id: "lead-1",
  reference: "OEML-2026-ABC234",
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T10:00:00.000Z",
  status: "new",
  enquiryType: "buy",
  contact: { name: "Ada Lovelace", email: "ada@example.com", phone: "+1 555 0100", country: "UK" },
  commodity: "copper",
  message: "Please quote copper cathode.",
  source: "contact-form",
  submissionToken: "tok-1",
}

const ctx = { correlationId: "corr-1" }
const AT = new Date("2026-09-16T10:05:00.000Z")

async function withIntent() {
  const repo = new InMemoryLeadNotificationDeliveryRepository()
  const delivery: LeadNotificationDelivery = {
    id: "delivery-1",
    leadId: lead.id,
    channel: "email",
    purpose: "internal_lead_alert",
    provider: "resend",
    status: "pending",
    attempts: 0,
    nextAttemptAt: "2026-09-16T10:00:00.000Z",
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
  }
  await repo.createIntent(delivery)
  return { repo, delivery }
}

function config(transport: FakeEmailTransport, over: Partial<EmailAttemptConfig> = {}): EmailAttemptConfig {
  return {
    transport,
    from: "desk@oeml.example",
    to: "leads@oeml.example",
    replyToLeadEmail: false,
    now: () => AT,
    backoff: { random: () => 0.5 },
    ...over,
  }
}

afterEach(() => vi.restoreAllMocks())

describe("attemptEmailDelivery — outcomes", () => {
  it("SENT: persists sent, increments attempts once, stores provider message id", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({ result: { status: "sent", providerMessageId: "msg-99" } })
    await attemptEmailDelivery(lead, delivery, repo, config(transport), ctx)

    const row = repo.all()[0]
    expect(row.status).toBe("sent")
    expect(row.attempts).toBe(1)
    expect(row.providerMessageId).toBe("msg-99")
    expect(row.lastAttemptAt).toBe(AT.toISOString())
    expect(row.lastErrorClass).toBeUndefined()
  })

  it("uses the stable delivery id as the provider idempotency key", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    await attemptEmailDelivery(lead, delivery, repo, config(transport), ctx)
    expect(transport.idempotencyKeys).toEqual(["delivery-1"])
  })

  it("TEMPORARY: persists pending + next_attempt_at from backoff", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({
      result: { status: "temporary_failure", code: "provider_5xx" },
    })
    await attemptEmailDelivery(lead, delivery, repo, config(transport), ctx)

    const row = repo.all()[0]
    expect(row.status).toBe("pending")
    expect(row.attempts).toBe(1)
    expect(row.lastErrorClass).toBe("provider_5xx")
    expect(new Date(row.nextAttemptAt).getTime()).toBeGreaterThan(AT.getTime())
  })

  it("PERMANENT: persists failed, no retry scheduled", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({
      result: { status: "permanent_failure", code: "rejected" },
    })
    await attemptEmailDelivery(lead, delivery, repo, config(transport), ctx)

    const row = repo.all()[0]
    expect(row.status).toBe("failed")
    expect(row.attempts).toBe(1)
    expect(row.lastErrorClass).toBe("rejected")
  })

  it("TIMEOUT + idempotent transport: schedules a retry (pending)", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({ hangUntilAborted: true, idempotentSend: true })
    await attemptEmailDelivery(lead, delivery, repo, config(transport, { timeoutMs: 5 }), ctx)

    const row = repo.all()[0]
    expect(row.status).toBe("pending")
    expect(row.attempts).toBe(1)
    expect(row.lastErrorClass).toBe("timeout")
    expect(transport.sent).toHaveLength(1) // single send, no in-request retry
  })

  it("TIMEOUT + non-idempotent transport: does NOT retry, marks failed for recovery", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({ hangUntilAborted: true, idempotentSend: false })
    await attemptEmailDelivery(lead, delivery, repo, config(transport, { timeoutMs: 5 }), ctx)

    const row = repo.all()[0]
    expect(row.status).toBe("failed")
    expect(row.attempts).toBe(1)
    expect(row.lastErrorClass).toBe("ambiguous_timeout")
  })

  it("does not log PII", async () => {
    const captured: { event: string; fields?: LogFields }[] = []
    for (const level of ["info", "warn", "error"] as const) {
      vi.spyOn(logger, level).mockImplementation((event: string, fields?: LogFields) => {
        captured.push({ event, fields })
      })
    }
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({ result: { status: "sent", providerMessageId: "msg-1" } })
    await attemptEmailDelivery(lead, delivery, repo, config(transport), ctx)

    const serialized = JSON.stringify(captured)
    expect(serialized).not.toContain("Ada Lovelace")
    expect(serialized).not.toContain("ada@example.com")
    expect(serialized).not.toContain("+1 555 0100")
    expect(serialized).not.toContain("Please quote copper cathode")
    expect(serialized).toContain("lead.notification.sent")
  })

  it("sets reply-to to the lead email only when enabled", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({ result: { status: "sent" } })
    await attemptEmailDelivery(lead, delivery, repo, config(transport, { replyToLeadEmail: true }), ctx)
    expect(transport.sent[0].replyTo).toBe("ada@example.com")
    expect(transport.sent[0].from).toBe("desk@oeml.example")
    expect(transport.sent[0].to).toBe("leads@oeml.example")
  })
})

describe("runEmailFirstAttempt — misconfiguration/disabled", () => {
  it("misconfiguration: no attempt, no attempts increment, loud event, intent preserved", async () => {
    const captured: { event: string; fields?: LogFields }[] = []
    vi.spyOn(logger, "error").mockImplementation((event, fields) => {
      captured.push({ event, fields })
    })
    const { repo, delivery } = await withIntent()

    await runEmailFirstAttempt(
      lead,
      delivery,
      repo,
      { ok: false, reason: "unsupported_provider" },
      ctx
    )

    const row = repo.all()[0]
    expect(row.status).toBe("pending") // preserved
    expect(row.attempts).toBe(0) // config problem is NOT an attempt
    const event = captured.find((e) => e.event === "lead.notification.email.misconfigured")
    expect(event).toBeTruthy()
    expect(event?.fields).toMatchObject({ reason: "unsupported_provider" })
  })

  it("disabled: no attempt and no misconfiguration event", async () => {
    const captured: string[] = []
    vi.spyOn(logger, "error").mockImplementation((event) => {
      captured.push(event)
    })
    const { repo, delivery } = await withIntent()
    await runEmailFirstAttempt(lead, delivery, repo, { ok: false, reason: "disabled" }, ctx)
    expect(repo.all()[0].attempts).toBe(0)
    expect(captured).not.toContain("lead.notification.email.misconfigured")
  })

  it("configured: performs the attempt and persists the outcome", async () => {
    const { repo, delivery } = await withIntent()
    const transport = new FakeEmailTransport({ result: { status: "sent", providerMessageId: "ok" } })
    await runEmailFirstAttempt(
      lead,
      delivery,
      repo,
      { ok: true, config: config(transport) },
      ctx
    )
    expect(repo.all()[0].status).toBe("sent")
  })
})
