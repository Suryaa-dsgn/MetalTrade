import { describe, it, expect, beforeEach } from "vitest"
import { providerHealth } from "@/lib/market/providers/health"

describe("provider health store", () => {
  beforeEach(() => {
    // fresh-ish: overwrite fields via a failure then success cycle per test id
  })

  it("starts blank for an unseen provider", () => {
    const h = providerHealth.get("eia")
    expect(h.lastAttemptAt).toBeNull()
    expect(h.lastSuccessAt).toBeNull()
    expect(h.rateLimited).toBe(false)
  })

  it("records attempt, success and quota", () => {
    providerHealth.recordAttempt("metalpriceapi", "2026-09-14T10:00:00.000Z")
    providerHealth.recordSuccess(
      "metalpriceapi",
      { limit: 100, used: 5 },
      "2026-09-14T10:00:01.000Z"
    )
    const h = providerHealth.get("metalpriceapi")
    expect(h.lastAttemptAt).toBe("2026-09-14T10:00:00.000Z")
    expect(h.lastSuccessAt).toBe("2026-09-14T10:00:01.000Z")
    expect(h.quota).toEqual({ limit: 100, used: 5 })
    expect(h.rateLimited).toBe(false)
  })

  it("flags rate-limited on quota/rate_limit failures and clears on success", () => {
    providerHealth.recordFailure("metalsdev", "quota", "2026-09-14T11:00:00.000Z")
    let h = providerHealth.get("metalsdev")
    expect(h.lastFailureCode).toBe("quota")
    expect(h.rateLimited).toBe(true)

    providerHealth.recordSuccess("metalsdev", undefined, "2026-09-14T12:00:00.000Z")
    h = providerHealth.get("metalsdev")
    expect(h.rateLimited).toBe(false)
    expect(h.lastFailureCode).toBe("quota") // history retained, but no longer rate-limited
  })

  it("does not flag rate-limited for a network failure", () => {
    providerHealth.recordFailure("mock", "network")
    expect(providerHealth.get("mock").rateLimited).toBe(false)
  })
})
