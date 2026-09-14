import { describe, it, expect } from "vitest"
import {
  evaluateFreshness,
  FRESHNESS_PRESETS,
  type FreshnessPolicy,
} from "@/lib/market/freshness"

const eod = FRESHNESS_PRESETS.endOfDay

describe("evaluateFreshness", () => {
  it("returns unavailable for a null timestamp", () => {
    expect(evaluateFreshness(null, eod)).toBe("unavailable")
  })

  it("returns unavailable for an unparseable timestamp", () => {
    expect(evaluateFreshness("not-a-date", eod)).toBe("unavailable")
  })

  it("returns the feed mode when within the stale window", () => {
    const now = Date.parse("2026-09-14T12:00:00Z")
    const oneHourAgo = "2026-09-14T11:00:00Z"
    expect(evaluateFreshness(oneHourAgo, eod, now)).toBe("eod")
  })

  it("downgrades to stale beyond staleAfterMs", () => {
    const now = Date.parse("2026-09-14T12:00:00Z")
    const threeDaysAgo = "2026-09-11T12:00:00Z" // > 36h
    expect(evaluateFreshness(threeDaysAgo, eod, now)).toBe("stale")
  })

  it("honours a delayed policy's own mode", () => {
    const delayed: FreshnessPolicy = { mode: "delayed", staleAfterMs: 90 * 60_000 }
    const now = Date.parse("2026-09-14T12:00:00Z")
    expect(evaluateFreshness("2026-09-14T11:30:00Z", delayed, now)).toBe("delayed")
  })
})
