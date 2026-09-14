import { describe, it, expect } from "vitest"
import { normalizeLiveQuote } from "@/lib/market/normalize"
import type { BenchmarkConfig } from "@/lib/market/benchmarks"
import { BENCHMARKS } from "@/lib/market/benchmarks"
import { FRESHNESS_PRESETS } from "@/lib/market/freshness"
import type { RawQuote } from "@/lib/market/providers/types"

const RETRIEVED = "2026-09-14T10:00:00.000Z"
const GOLD = BENCHMARKS.gold

// A synthetic base-metal config to exercise the oz -> tonne conversion path
// (base metals are paid-gated in the registry, but the normaliser must be
// correct for the paid-tier upgrade).
const COPPER_LIKE: BenchmarkConfig = {
  slug: "copper-test",
  routing: "live",
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
    providerSymbol: "XAU",
    value: 4348.21,
    providerUnit: "oz",
    sourceTimestamp: "2026-09-14T09:59:59.000Z",
    ...over,
  }
}

describe("normalizeLiveQuote", () => {
  it("passes gold through with no conversion (troy oz canonical)", () => {
    const n = normalizeLiveQuote(raw({}), GOLD, "Gold", RETRIEVED)
    expect(n.quote.price).toBeCloseTo(4348.21, 2)
    expect(n.quote.unit).toBe("oz")
    expect(n.quote.currency).toBe("USD")
    expect(n.quote.source).toBe("live")
    expect(n.quote.status).toBe("eod")
    expect(n.quote.updatedAt).toBe("2026-09-14T09:59:59.000Z")
    expect(n.quote.retrievedAt).toBe(RETRIEVED)
    expect(n.native).toEqual({ providerValue: 4348.21, providerUnit: "oz" })
  })

  it("converts a per-ounce base metal to per-tonne and passes the sanity band", () => {
    // 0.2954 USD/oz * 32150.7466 ≈ 9497 USD/t, inside [7000, 13000]
    const n = normalizeLiveQuote(
      raw({ providerSymbol: "XCU", value: 0.2954, providerUnit: "oz" }),
      COPPER_LIKE,
      "Copper",
      RETRIEVED
    )
    expect(n.quote.price).toBeCloseTo(9497.3, 0)
    expect(n.quote.unit).toBe("t")
    expect(n.quote.source).toBe("live")
    expect(n.native.providerValue).toBe(0.2954)
    expect(n.native.providerUnit).toBe("oz")
  })

  it("refuses an implausible magnitude (sanity guard -> unavailable)", () => {
    // A troy/avoirdupois or scale mistake would blow past the band.
    const n = normalizeLiveQuote(
      raw({ providerSymbol: "XCU", value: 5, providerUnit: "oz" }), // ~160,750 USD/t
      COPPER_LIKE,
      "Copper",
      RETRIEVED
    )
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
    expect(n.quote.status).toBe("unavailable")
  })

  it("refuses an unknown provider unit rather than guessing", () => {
    const n = normalizeLiveQuote(
      raw({ providerSymbol: "XCU", value: 1, providerUnit: "barrel" }),
      COPPER_LIKE,
      "Copper",
      RETRIEVED
    )
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
  })

  it("refuses a provider/registry unit mismatch", () => {
    // GOLD declares providerUnit "oz"; a "kg" reading must not be silently used.
    const n = normalizeLiveQuote(raw({ providerUnit: "kg" }), GOLD, "Gold", RETRIEVED)
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
  })

  it("returns unavailable when the provider omitted the symbol", () => {
    const n = normalizeLiveQuote(undefined, GOLD, "Gold", RETRIEVED)
    expect(n.quote.price).toBeNull()
    expect(n.quote.source).toBe("unavailable")
    expect(n.quote.retrievedAt).toBe(RETRIEVED)
  })
})
