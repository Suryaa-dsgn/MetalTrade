import { describe, it, expect } from "vitest"
import {
  BENCHMARKS,
  PROVIDER_CAPABILITIES,
  liveSymbols,
  liveSlugs,
  getBenchmark,
} from "@/lib/market/benchmarks"
import { isProviderImplemented } from "@/lib/market/providers/router"
import { metals } from "@/data/mock/metals"
import { isMassUnit } from "@/lib/market/units"

describe("benchmark registry", () => {
  it("has an entry for every catalogue slug", () => {
    for (const m of metals) {
      expect(getBenchmark(m.slug), `missing benchmark for ${m.slug}`).toBeDefined()
    }
  })

  it("uses unique benchmarkIds (commodity identity ≠ benchmark identity)", () => {
    const ids = Object.values(BENCHMARKS).map((b) => b.benchmarkId)
    expect(new Set(ids).size).toBe(ids.length)
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

  it("every live benchmark routes to an IMPLEMENTED provider, verified + specified", () => {
    for (const b of Object.values(BENCHMARKS)) {
      if (b.routing !== "live") continue
      expect(b.provider, `${b.slug} provider`).toBeDefined()
      expect(isProviderImplemented(b.provider!), `${b.slug} provider implemented`).toBe(true)
      expect(b.providerSymbol, `${b.slug} providerSymbol`).toBeTruthy()
      expect(b.providerUnit, `${b.slug} providerUnit`).toBeTruthy()
      expect(b.unitVerified, `${b.slug} unit-verified`).toBe(true)
      expect(b.sanityBand, `${b.slug} sanityBand`).toBeDefined()
      expect(b.publicDisplayApproved, `${b.slug} public-display`).toBe(true)
    }
  })

  it("never routes a rejected-proxy live (semantic guard)", () => {
    for (const b of Object.values(BENCHMARKS)) {
      if (b.classification === "rejected-proxy") {
        expect(b.routing, `${b.slug} rejected-proxy must not be live`).not.toBe("live")
      }
    }
  })

  it("never routes a paid-gated benchmark live", () => {
    for (const b of Object.values(BENCHMARKS)) {
      if (b.unavailableReason === "paid-gated") {
        expect(b.routing).not.toBe("live")
      }
    }
  })

  it("keeps lead-zinc structurally separate (never a blended number)", () => {
    const lz = getBenchmark("lead-zinc")!
    expect(lz.routing).toBe("none")
    expect(lz.unavailableReason).toBe("structural-lead-zinc")
  })

  it("names Brent explicitly (never generic Crude Oil price)", () => {
    const crude = getBenchmark("crude-oil")!
    expect(crude.benchmarkId).toBe("brent-crude")
    expect(crude.displayName).toBe("Brent Crude")
    expect(crude.provider).toBe("eia")
  })

  it("every 'none' benchmark has an unavailable fallback policy", () => {
    for (const b of Object.values(BENCHMARKS)) {
      if (b.routing === "none") {
        expect(b.fallbackPolicy, `${b.slug} fallback`).toBe("unavailable")
      }
    }
  })

  it("capability flags reflect the free plan", () => {
    const caps = PROVIDER_CAPABILITIES.metalpriceapi.capabilities
    expect(caps.goldQuote).toBe(true)
    expect(caps.baseMetalQuotes).toBe(false)
    expect(caps.history).toBe(false)
    expect(caps.unitOverride).toBe(false)
  })
})
