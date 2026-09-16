import { describe, it, expect, vi } from "vitest"
import {
  authorizeDrainRequest,
  handleDrainRequest,
} from "@/lib/leads/notification/delivery/drain-route"
import type { DrainSummary } from "@/lib/leads/notification/delivery/drain"

/* Backend Phase 2E-3 — protected drain entry point: bearer-secret auth + minimal,
   PII-free operational response. */

const SECRET = "s3cret-drain-token"
const summary: DrainSummary = { claimed: 4, sent: 3, retryScheduled: 1, failed: 0 }

function req(auth?: string): Request {
  return new Request("http://internal/api/internal/notifications/drain", {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  })
}

const deps = (over: Partial<Parameters<typeof handleDrainRequest>[1]> = {}) => ({
  expectedSecret: SECRET,
  runDrain: vi.fn().mockResolvedValue(summary),
  makeWorkerId: () => "worker-1",
  ...over,
})

describe("authorizeDrainRequest", () => {
  it("rejects when no secret is configured (fail closed)", () => {
    expect(authorizeDrainRequest(req(`Bearer ${SECRET}`), undefined)).toBe(false)
  })
  it("rejects a missing Authorization header", () => {
    expect(authorizeDrainRequest(req(), SECRET)).toBe(false)
  })
  it("rejects a wrong secret", () => {
    expect(authorizeDrainRequest(req("Bearer nope"), SECRET)).toBe(false)
  })
  it("rejects a non-bearer scheme", () => {
    expect(authorizeDrainRequest(req(`Basic ${SECRET}`), SECRET)).toBe(false)
  })
  it("accepts the exact bearer secret", () => {
    expect(authorizeDrainRequest(req(`Bearer ${SECRET}`), SECRET)).toBe(true)
  })
})

describe("handleDrainRequest", () => {
  it("401s a missing/invalid secret and does NOT run the drain", async () => {
    const d = deps()
    const res = await handleDrainRequest(req(), d)
    expect(res.status).toBe(401)
    expect(d.runDrain).not.toHaveBeenCalled()
  })

  it("401s a wrong secret", async () => {
    const d = deps()
    const res = await handleDrainRequest(req("Bearer wrong"), d)
    expect(res.status).toBe(401)
    expect(d.runDrain).not.toHaveBeenCalled()
  })

  it("runs the drain on the correct secret and returns only operational counts", async () => {
    const d = deps()
    const res = await handleDrainRequest(req(`Bearer ${SECRET}`), d)
    expect(res.status).toBe(200)
    expect(d.runDrain).toHaveBeenCalledWith("worker-1")
    const body = await res.json()
    expect(body).toEqual({ claimed: 4, sent: 3, retryScheduled: 1, failed: 0 })
  })

  it("never echoes the secret or any lead data in the response", async () => {
    const d = deps()
    const res = await handleDrainRequest(req(`Bearer ${SECRET}`), d)
    const text = await res.text()
    expect(text).not.toContain(SECRET)
    expect(text).not.toContain("email")
    expect(text).not.toContain("lead")
    expect(text).not.toMatch(/name|message|@/i)
  })
})
