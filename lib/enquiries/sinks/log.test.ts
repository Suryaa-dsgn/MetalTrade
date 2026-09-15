import { describe, it, expect, vi, afterEach } from "vitest"
import { logEnquirySink } from "@/lib/enquiries/sinks/log"
import { logger } from "@/lib/observability/logger"

/*
  Sec Phase 1 — the enquiry log sink emits through the structured logger (so it
  shares the secret-redaction backstop) and records ONLY non-PII metadata: never
  the enquiry payload (name/email/phone/message/commercial fields).
*/

afterEach(() => {
  vi.restoreAllMocks()
})

describe("logEnquirySink", () => {
  it("logs via the structured logger, not raw console", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => {})
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {})

    await logEnquirySink.deliver({
      intent: "buying",
      referenceId: "DEMO-BUY-ABC123",
      values: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "sensitive commercial detail",
      },
      submittedAt: "2026-09-15T10:00:00.000Z",
      hasAttachments: false,
    })

    expect(info).toHaveBeenCalledOnce()
    expect(consoleInfo).not.toHaveBeenCalled()
  })

  it("records only non-PII metadata (no payload fields reach the log)", async () => {
    let loggedFields: Record<string, unknown> = {}
    vi.spyOn(logger, "info").mockImplementation((_event, fields) => {
      loggedFields = { ...(fields ?? {}) }
    })

    await logEnquirySink.deliver({
      intent: "supply",
      referenceId: "DEMO-SUP-XYZ789",
      values: {
        name: "Grace Hopper",
        email: "grace@example.com",
        phone: "+1 555 0100",
        message: "do not log me",
      },
      submittedAt: "2026-09-15T10:00:00.000Z",
      hasAttachments: true,
    })

    expect(Object.keys(loggedFields).sort()).toEqual(
      ["hasAttachments", "intent", "referenceId", "result", "submittedAt"].sort()
    )
    const serialized = JSON.stringify(loggedFields)
    expect(serialized).not.toContain("Grace Hopper")
    expect(serialized).not.toContain("grace@example.com")
    expect(serialized).not.toContain("do not log me")
    expect(serialized).not.toContain("555")
  })

  it("returns a successful delivery result", async () => {
    vi.spyOn(logger, "info").mockImplementation(() => {})
    const result = await logEnquirySink.deliver({
      intent: "general",
      referenceId: "DEMO-GEN-000000",
      values: {},
      submittedAt: "2026-09-15T10:00:00.000Z",
      hasAttachments: false,
    })
    expect(result.ok).toBe(true)
  })
})
