import { describe, it, expect } from "vitest"
import {
  backoffCeilingMs,
  backoffDelayMs,
  nextAttemptAt,
} from "@/lib/leads/notification/delivery/backoff"

/* Backend Phase 2E-2 — pure backoff policy (exponential, full jitter, capped). */

describe("backoffCeilingMs", () => {
  it("grows exponentially from the base", () => {
    const o = { baseMs: 1000, factor: 2, capMs: 1_000_000 }
    expect(backoffCeilingMs(1, o)).toBe(1000)
    expect(backoffCeilingMs(2, o)).toBe(2000)
    expect(backoffCeilingMs(3, o)).toBe(4000)
    expect(backoffCeilingMs(4, o)).toBe(8000)
  })

  it("is bounded by the cap", () => {
    const o = { baseMs: 1000, factor: 2, capMs: 3000 }
    expect(backoffCeilingMs(10, o)).toBe(3000)
  })
})

describe("backoffDelayMs — full jitter in [0, ceiling)", () => {
  const o = { baseMs: 1000, factor: 2, capMs: 100_000 }

  it("returns 0 when the RNG yields 0", () => {
    expect(backoffDelayMs(3, { ...o, random: () => 0 })).toBe(0)
  })

  it("stays strictly below the ceiling at the RNG maximum", () => {
    const ceiling = backoffCeilingMs(3, o)
    const delay = backoffDelayMs(3, { ...o, random: () => 0.999999 })
    expect(delay).toBeLessThan(ceiling)
    expect(delay).toBeGreaterThan(0)
  })

  it("scales with the injected RNG (deterministic)", () => {
    expect(backoffDelayMs(1, { ...o, random: () => 0.5 })).toBe(500) // 0.5 * 1000
  })
})

describe("nextAttemptAt", () => {
  it("adds the jittered delay to now (deterministic under injected RNG)", () => {
    const now = new Date("2026-09-16T10:00:00.000Z")
    const iso = nextAttemptAt(now, 1, { baseMs: 1000, factor: 2, random: () => 0.5 })
    expect(iso).toBe(new Date(now.getTime() + 500).toISOString())
  })
})
