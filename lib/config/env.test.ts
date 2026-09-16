import { describe, it, expect, vi, afterEach } from "vitest"
import { applyProductionHardening, type ServerConfig } from "@/lib/config/env"

/*
  Sec Phase 1 — production hygiene. Dev/demo controls must not activate in
  production. `applyProductionHardening` is pure, so we test the gating directly
  without module-environment gymnastics.
*/

const base: ServerConfig = {
  marketMode: "registry",
  enquirySink: "log",
  uploadProvider: "disabled",
  contentSource: "static",
  marketSimulateFailure: false,
  botVerification: "disabled",
  rateLimitTrustProxy: false,
  leadStore: "memory",
  databaseUrl: undefined,
  databaseSsl: "require",
  emailProvider: "none",
  emailFrom: undefined,
  emailTo: undefined,
  emailReplyTo: "disabled",
  notificationDrainSecret: undefined,
  metalPriceApiKey: undefined,
  metalsDevApiKey: undefined,
  eiaApiKey: undefined,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("applyProductionHardening", () => {
  it("leaves configuration untouched outside production", () => {
    const cfg = { ...base, marketMode: "mock" as const, marketSimulateFailure: true }
    const out = applyProductionHardening(cfg, false)
    expect(out.marketMode).toBe("mock")
    expect(out.marketSimulateFailure).toBe(true)
  })

  it("forces MARKET_PROVIDER=mock back to registry in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const out = applyProductionHardening({ ...base, marketMode: "mock" }, true)
    expect(out.marketMode).toBe("registry")
    expect(warn).toHaveBeenCalledOnce()
  })

  it("disables MARKET_SIMULATE_FAILURE in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const out = applyProductionHardening({ ...base, marketSimulateFailure: true }, true)
    expect(out.marketSimulateFailure).toBe(false)
    expect(warn).toHaveBeenCalledOnce()
  })

  it("passes a clean production configuration through without warnings", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const out = applyProductionHardening(base, true)
    expect(out.marketMode).toBe("registry")
    expect(out.marketSimulateFailure).toBe(false)
    expect(warn).not.toHaveBeenCalled()
  })

  it("does not mutate the input configuration", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const cfg = { ...base, marketMode: "mock" as const }
    applyProductionHardening(cfg, true)
    expect(cfg.marketMode).toBe("mock")
  })
})
