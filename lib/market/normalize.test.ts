import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { normalizeQuote } from "@/lib/market/normalize"
import type { BenchmarkConfig } from "@/lib/market/benchmarks"
import { BENCHMARKS } from "@/lib/market/benchmarks"
import { FRESHNESS_PRESETS } from "@/lib/market/freshness"
import type { RawQuote } from "@/lib/market/providers/types"

const RETRIEVED = "2026-09-14T10:00:00.000Z"
const GOLD = BENCHMARKS.gold

// Synthetic base-metal config to exercise the oz → tonne conversion path.
const COPPER_LIKE: BenchmarkConfig = {
  slug: "copper-test",
  benchmarkId: "copper-test",
  displayName: "Copper test",
  routing: "live",
  classification: "exact",
  fallbackPolicy: "live-then-lastgood",
  publicDisplayApproved: true,
  provider: "metalpriceapi",
  providerSymbol: "XCU",
  canonicalUnit: "t",
  currency: "USD",
  freshnessPolicy: FRESHNESS_PRESETS.endOfDay,
  historyCapable: false,
  unitVerified: true,
  sanityBand: [7000, 13000],
  attribution: { label: "test" },
}

function raw(over: Partial<RawQuote>): RawQuote {
  return {
    benchmarkId: "gold-spot",
    providerSymbol: "XAU",
    value: 4348.21,
    providerUnit: "oz",
    sourceTimestamp: "2026-09-14T09:59:59.000Z",
    ...over,
  }
}

// Freshness is evaluated against the wall clock, so pin "now" to the retrieval time
// to keep these fixtures deterministic regardless of the real date.
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(RETRIEVED))
})
afterEach(() => {
  vi.useRealTimers()
})

describe("normalizeQuote", () => {
  it("passes gold through as live (troy oz canonical, retrieved stamped)", () => {
    const n = normalizeQuote(raw({}), GOLD, "Gold", RETRIEVED, "live")
    expect(n.quote.price).toBeCloseTo(4348.21, 2)
    expect(n.quote.unit).toBe("oz")
    expect(n.quote.source).toBe("live")
    expect(n.quote.status).toBe("eod")
    expect(n.quote.updatedAt).toBe("2026-09-14T09:59:59.000Z")
    expect(n.quote.retrievedAt).toBe(RETRIEVED)
    expect(n.native).toEqual({ providerValue: 4348.21, providerUnit: "oz" })
  })

  it("stamps sample provenance and null retrievedAt for the sample source", () => {
    const n = normalizeQuote(raw({}), GOLD, "Gold", RETRIEVED, "sample")
    expect(n.quote.source).toBe("sample")
    expect(n.quote.retrievedAt).toBeNull()
  })

  it("converts a per-ounce base metal to per-tonne and passes the sanity band", () => {
    const n = normalizeQuote(
      raw({ benchmarkId: "copper-test", providerSymbol: "XCU", value: 0.2954, providerUnit: "oz" }),
      COPPER_LIKE,
      "Copper",
      RETRIEVED,
      "live"
    )
    expect(n.quote.price).toBeCloseTo(9497.3, 0)
    expect(n.quote.unit).toBe("t")
    expect(n.quote.source).toBe("live")
    expect(n.native.providerValue).toBe(0.2954)
  })

  it("refuses an implausible magnitude (sanity guard → unavailable)", () => {
    const n = normalizeQuote(
      raw({ benchmarkId: "copper-test", providerSymbol: "XCU", value: 5, providerUnit: "oz" }),
      COPPER_LIKE,
      "Copper",
      RETRIEVED,
      "live"
    )
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
  })

  it("refuses an unknown provider unit rather than guessing", () => {
    const n = normalizeQuote(
      raw({ benchmarkId: "copper-test", providerSymbol: "XCU", value: 1, providerUnit: "barrel" }),
      COPPER_LIKE,
      "Copper",
      RETRIEVED,
      "live"
    )
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
  })

  it("refuses a provider/registry unit mismatch", () => {
    const n = normalizeQuote(raw({ providerUnit: "kg" }), GOLD, "Gold", RETRIEVED, "live")
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
  })

  it("passes a barrel-denominated benchmark through by identity (no mass conversion)", () => {
    const crude: BenchmarkConfig = {
      ...COPPER_LIKE,
      slug: "crude-oil",
      benchmarkId: "brent-crude",
      providerSymbol: "RBRTE",
      providerUnit: "bbl",
      canonicalUnit: "bbl",
      sanityBand: [20, 200],
    }
    const n = normalizeQuote(
      raw({ benchmarkId: "brent-crude", providerSymbol: "RBRTE", value: 109.51, providerUnit: "bbl" }),
      crude,
      "Brent Crude",
      RETRIEVED,
      "live"
    )
    expect(n.quote.price).toBeCloseTo(109.51, 2)
    expect(n.quote.unit).toBe("bbl")
    expect(n.quote.source).toBe("live")
  })

  it("refuses a barrel value against a mass canonical unit (no cross-kind conversion)", () => {
    const bad: BenchmarkConfig = {
      ...COPPER_LIKE,
      providerUnit: "bbl",
      canonicalUnit: "t", // mass — incompatible with a barrel value
      sanityBand: [20, 200],
    }
    const n = normalizeQuote(
      raw({ providerSymbol: "RBRTE", value: 109.51, providerUnit: "bbl" }),
      bad,
      "x",
      RETRIEVED,
      "live"
    )
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
  })

  it("returns unavailable when the provider omitted the benchmark", () => {
    const n = normalizeQuote(undefined, GOLD, "Gold", RETRIEVED, "live")
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
    expect(n.quote.retrievedAt).toBe(RETRIEVED)
  })
})
