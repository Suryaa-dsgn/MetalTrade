import { describe, it, expect, vi, afterEach } from "vitest"
import { logger } from "@/lib/observability/logger"

/*
  Sec Phase 5 — logger redaction backstop. Fields whose KEY looks secret must be
  redacted before emission, regardless of value. This is a safety net, not a
  licence to pass secrets to the logger.
*/

afterEach(() => vi.restoreAllMocks())

function captureLine(fn: () => void): Record<string, unknown> {
  let line = "{}"
  const log = vi.spyOn(console, "log").mockImplementation((l: string) => (line = l))
  const err = vi.spyOn(console, "error").mockImplementation((l: string) => (line = l))
  fn()
  log.mockRestore()
  err.mockRestore()
  return JSON.parse(line)
}

describe("logger redaction", () => {
  it("redacts secret-looking keys (apiKey, token, authorization, secret, password)", () => {
    const out = captureLine(() =>
      logger.info("evt", {
        apiKey: "super-secret-value",
        api_key: "another",
        token: "t",
        authorization: "Bearer x",
        secret: "s",
        password: "p",
        provider: "eia",
      })
    )
    expect(out.apiKey).toBe("[redacted]")
    expect(out.api_key).toBe("[redacted]")
    expect(out.token).toBe("[redacted]")
    expect(out.authorization).toBe("[redacted]")
    expect(out.secret).toBe("[redacted]")
    expect(out.password).toBe("[redacted]")
    // Non-secret fields pass through untouched.
    expect(out.provider).toBe("eia")
  })

  it("never emits the redacted values themselves", () => {
    const out = captureLine(() => logger.warn("evt", { apiKey: "LEAKME12345" }))
    expect(JSON.stringify(out)).not.toContain("LEAKME12345")
  })

  it("emits structured fields (level, event, ts)", () => {
    const out = captureLine(() => logger.info("market.fetch.ok", { provider: "eia" }))
    expect(out.level).toBe("info")
    expect(out.event).toBe("market.fetch.ok")
    expect(typeof out.ts).toBe("string")
  })
})
