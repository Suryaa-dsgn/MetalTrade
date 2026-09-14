import { describe, it, expect } from "vitest"
import {
  BENCHMARKS,
  PROVIDER_CAPABILITIES,
  liveSymbols,
  liveSlugs,
  getBenchmark,
} from "@/lib/market/benchmarks"
import { metals } from "@/data/mock/metals"
import { isMassUnit } from "@/lib/market/units"

describe("benchmark registry", () => {
  it("has an entry for every catalogue slug", () => {
    for (const m of metals) {
      expect(getBenchmark(m.slug), `missing benchmark for ${m.slug}`).toBeDefined()
    }
  })

  it("uses only known mass units for canonical units", () => {
    for (const b of Object.values(BENCHMARKS)) {
      expect(isMassUnit(b.canonicalUnit), `${b.slug} canonicalUnit`).toBe(true)
    }
  })

  it("only routes gold live on the current (free) plan", () => {
    expect(liveSlugs("metalpriceapi")).toEqual(["gold"])
    expect(liveSymbols("metalpriceapi")).toEqual(["XAU"])
  })

  it("live benchmarks are fully specified and unit-verified", () => {
    for (const b of Object.values(BENCHMARKS)) {
      if (b.routing !== "live") continue
      expect(b.provider, `${b.slug} provider`).toBeDefined()
      expect(b.providerSymbol, `${b.slug} providerSymbol`).toBeTruthy()
      expect(b.providerUnit, `${b.slug} providerUnit`).toBeTruthy()
      expect(b.unitVerified, `${b.slug} must be unit-verified to go live`).toBe(true)
      expect(b.sanityBand, `${b.slug} sanityBand`).toBeDefined()
    }
  })

  it("never routes a paid-gated benchmark live (correctness guard)", () => {
    for (const b of Object.values(BENCHMARKS)) {
      if (b.unavailableReason === "paid-gated") {
        expect(b.routing, `${b.slug} is paid-gated and must not be live`).not.toBe(
          "live"
        )
      }
    }
  })

  it("keeps lead-zinc structurally separate (never a blended number)", () => {
    const lz = getBenchmark("lead-zinc")!
    expect(lz.routing).toBe("none")
    expect(lz.unavailableReason).toBe("structural-lead-zinc")
  })

  it("capability flags reflect the free plan", () => {
    const caps = PROVIDER_CAPABILITIES.metalpriceapi.capabilities
    expect(caps.goldQuote).toBe(true)
    expect(caps.baseMetalQuotes).toBe(false)
    expect(caps.history).toBe(false)
    expect(caps.unitOverride).toBe(false)
  })
})
