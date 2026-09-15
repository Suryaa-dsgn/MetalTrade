import { describe, it, expect } from "vitest"
import {
  BENCHMARKS,
  LEAD_ZINC_BENCHMARKS,
  PROVIDER_CAPABILITIES,
  liveSymbols,
  liveSlugs,
  getBenchmark,
} from "@/lib/market/benchmarks"
import { isProviderImplemented } from "@/lib/market/providers/router"
import { metals } from "@/data/mock/metals"
import { isMarketUnit } from "@/lib/market/units"

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

  it("uses only known market units (mass or volume) for canonical units", () => {
    for (const b of Object.values(BENCHMARKS)) {
      expect(isMarketUnit(b.canonicalUnit), `${b.slug} canonicalUnit`).toBe(true)
    }
  })

  it("routes Brent Crude live via EIA (public-domain, per barrel), publicly approved", () => {
    const crude = getBenchmark("crude-oil")!
    expect(crude.routing).toBe("live")
    expect(crude.provider).toBe("eia")
    expect(crude.providerSymbol).toBe("RBRTE")
    expect(crude.providerUnit).toBe("bbl")
    expect(crude.canonicalUnit).toBe("bbl")
    expect(crude.currency).toBe("USD")
    expect(crude.classification).toBe("exact")
    expect(crude.publicDisplayApproved).toBe(true)
    expect(crude.displayName).toBe("Brent Crude")
  })

  it("keeps Bitumen unavailable — never mapped to a crude proxy", () => {
    const bitumen = getBenchmark("bitumen")!
    expect(bitumen.routing).toBe("none")
    expect(bitumen.provider).toBeUndefined()
    expect(bitumen.classification).toBe("unavailable")
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

  it("only routes a benchmark live when public display is approved (commercial gate)", () => {
    for (const b of [...Object.values(BENCHMARKS), ...Object.values(LEAD_ZINC_BENCHMARKS)]) {
      if (b.routing === "live") {
        expect(b.publicDisplayApproved, `${b.benchmarkId} live requires display approval`).toBe(true)
      }
    }
  })

  it("carries the VERIFIED (but display-gated) Metals.Dev LME mapping for Copper", () => {
    const cu = getBenchmark("copper")!
    expect(cu.provider).toBe("metalsdev")
    expect(cu.providerSymbol).toBe("lme_copper")
    expect(cu.providerUnit).toBe("MT")
    expect(cu.unitVerified).toBe(true)
    expect(cu.publicDisplayApproved).toBe(false) // gated → still displayed as sample
    expect(cu.routing).toBe("sample")
    // broad defensive band admits the real live value (≈14233), correction 9
    expect(cu.sanityBand![1]).toBeGreaterThanOrEqual(14233)
  })

  it("defines Lead and Zinc as two SEPARATE verified LME benchmarks (never blended)", () => {
    const lead = LEAD_ZINC_BENCHMARKS["lead-lme-3m"]
    const zinc = LEAD_ZINC_BENCHMARKS["zinc-lme-3m"]
    expect(lead.providerSymbol).toBe("lme_lead")
    expect(zinc.providerSymbol).toBe("lme_zinc")
    expect(lead.providerUnit).toBe("MT")
    expect(zinc.providerUnit).toBe("MT")
    expect(lead.unitVerified && zinc.unitVerified).toBe(true)
    // the combined commodity references both and is never given one price
    const lz = getBenchmark("lead-zinc")!
    expect(lz.components).toEqual(["lead-lme-3m", "zinc-lme-3m"])
    expect(lz.routing).toBe("none")
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
