import type { MassUnit } from "@/lib/market/units"
import type { FreshnessPolicy } from "@/lib/market/freshness"
import { FRESHNESS_PRESETS, MOCK_FRESHNESS_POLICY } from "@/lib/market/freshness"

/*
  ============================================================================
  BENCHMARK REGISTRY — the single source of truth for how each catalogue
  commodity is sourced, mapped, unit-normalised, and attributed. Provider
  mapping lives HERE, never in pages/components or provider adapters, so adding
  or upgrading a provider is a registry change, not a UI change.

  Commodity identity (slug) and benchmark identity (benchmarkId) are SEPARATE:
  "Copper Cathode" (a commodity) is priced against "LME Copper 3M" (a benchmark).
  ============================================================================

  COMMERCIAL / LICENSING is deliberately NOT in this file. Vendor plan, pricing,
  redistribution terms, and attribution wording live in
  docs/market-provider-readiness.md and are reviewed whenever terms change. The
  only runtime commercial gate here is `publicDisplayApproved`.

  VERIFIED PROVIDER CONTRACTS
  - MetalpriceAPI (probed 2026-09-14, Free tier): header auth; /latest returns
    `rates["USD"+symbol]` = USD per native unit; `timestamp` (UNIX) is the as-of
    time; Gold verified at ~$4,348/troy oz (EOD). Base metals + timeframe history
    are PAID-GATED (real 416/421 errors — a plan limit, not "unsupported").
  - Metals.Dev, EIA: NOT yet integrated. Copper/Lead/Zinc are ASSIGNED to
    Metals.Dev and Brent Crude to EIA, but stay non-live until each provider is
    researched, its symbols/units/magnitudes verified, and enabled.
*/

export type ProviderId = "metalpriceapi" | "metalsdev" | "eia" | "mock"

/** How a commodity is sourced RIGHT NOW. */
export type BenchmarkRouting = "live" | "sample" | "none"

/** Semantic quality of the mapping — a matching symbol is NOT enough to go live. */
export type BenchmarkClassification =
  | "exact" // the instrument is the intended benchmark
  | "acceptable-proxy" // a reasonable stand-in, allowed with review
  | "rejected-proxy" // superficially similar but semantically wrong — never live
  | "unavailable" // no suitable public benchmark

/** Per-benchmark fallback when fresh real data is unavailable. */
export type FallbackPolicy =
  | "live-then-lastgood" // fresh → cached → last-known-good (stale) → unavailable
  | "sample-allowed-dev" // may show labelled sample data in dev/demo, else unavailable
  | "unavailable" // no data → unavailable, never sample

/** Why a commodity has no live benchmark (internal docs/observability). */
export type UnavailableReason =
  | "paid-gated"
  | "no-symbol"
  | "proxy-only"
  | "provider-not-integrated"
  | "structural-lead-zinc"

export type Attribution = {
  label: string
  url?: string
  disclaimer?: string
}

export type BenchmarkConfig = {
  /** Commodity identity. */
  slug: string
  /** Benchmark identity — stable, unique, provider-independent. */
  benchmarkId: string
  displayName: string
  routing: BenchmarkRouting
  classification: BenchmarkClassification
  fallbackPolicy: FallbackPolicy
  /** Whether the value may be shown publicly (commercial/licensing gate, kept
   *  simple; detail lives in the readiness doc). */
  publicDisplayApproved: boolean
  /** Quote provider (meaningful when routing === "live"; also records the planned
   *  provider for a not-yet-integrated benchmark). */
  provider?: ProviderId
  /** Provider instrument code, set only when verified for the active provider. */
  providerSymbol?: string
  /** Optional distinct history provider (only when semantics are compatible). */
  historyProvider?: ProviderId
  historySymbol?: string
  /** Unit the provider value is denominated in (set when verified). */
  providerUnit?: MassUnit
  /** Unit we display/store canonically. */
  canonicalUnit: MassUnit
  currency: string
  freshnessPolicy: FreshnessPolicy
  historyCapable: boolean
  /** True only after a live probe confirmed the provider unit AND magnitude. */
  unitVerified: boolean
  /** Plausible [min, max] in CANONICAL unit; a converted value outside it is
   *  refused (rendered unavailable) rather than published. */
  sanityBand?: readonly [number, number]
  unavailableReason?: UnavailableReason
  attribution: Attribution
}

export type ProviderCapabilities = {
  provider: ProviderId
  plan: string
  capabilities: {
    goldQuote: boolean
    baseMetalQuotes: boolean
    history: boolean
    unitOverride: boolean
  }
}

/** Capability snapshot for the CURRENTLY configured plan. */
export const PROVIDER_CAPABILITIES: Record<string, ProviderCapabilities> = {
  metalpriceapi: {
    provider: "metalpriceapi",
    plan: "free",
    capabilities: {
      goldQuote: true,
      baseMetalQuotes: false,
      history: false,
      unitOverride: false,
    },
  },
}

export const METALPRICEAPI_ATTRIBUTION: Attribution = {
  label: "Market benchmark via MetalpriceAPI",
  url: "https://metalpriceapi.com",
  disclaimer: "Reference benchmark, delayed / end of day. Not a transaction price.",
}
export const SAMPLE_ATTRIBUTION: Attribution = {
  label: "Indicative sample data",
  disclaimer: "Development sample, not a live market feed.",
}
export const UNAVAILABLE_ATTRIBUTION: Attribution = {
  label: "Market profile in preparation",
}

/*
  Registry for all 12 confirmed catalogue commodities, keyed by slug. Only Gold
  is live (MetalpriceAPI Free). Copper and Lithium keep labelled sample data;
  Copper is assigned to Metals.Dev and Brent to EIA but stay non-live until
  verified. The rest have no live benchmark and remain "in preparation".
*/
export const BENCHMARKS: Record<string, BenchmarkConfig> = {
  gold: {
    slug: "gold",
    benchmarkId: "gold-spot",
    displayName: "Gold benchmark (USD/oz)",
    routing: "live",
    classification: "exact",
    fallbackPolicy: "live-then-lastgood",
    publicDisplayApproved: true,
    provider: "metalpriceapi",
    providerSymbol: "XAU",
    providerUnit: "oz", // troy ounce — verified
    canonicalUnit: "oz",
    currency: "USD",
    freshnessPolicy: FRESHNESS_PRESETS.endOfDay,
    historyCapable: false, // paid-gated on Free
    unitVerified: true, // verified live: USDXAU ≈ 4348/oz
    sanityBand: [500, 20000],
    attribution: METALPRICEAPI_ATTRIBUTION,
  },

  copper: {
    slug: "copper",
    benchmarkId: "copper-lme-3m",
    displayName: "LME Copper 3M",
    routing: "sample", // → "live" once Metals.Dev is integrated + verified
    classification: "exact",
    fallbackPolicy: "sample-allowed-dev",
    publicDisplayApproved: false,
    provider: "metalsdev", // planned
    canonicalUnit: "MT", // metric tonne; matches the sample fixture's display label
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: true, // sample history exists (data/mock)
    unitVerified: false,
    sanityBand: [7000, 13000],
    unavailableReason: "provider-not-integrated",
    attribution: SAMPLE_ATTRIBUTION,
  },
  lithium: {
    slug: "lithium",
    benchmarkId: "lithium-proxy",
    displayName: "Lithium benchmark",
    routing: "sample",
    classification: "acceptable-proxy", // XLI needs semantic verification before live
    fallbackPolicy: "sample-allowed-dev",
    publicDisplayApproved: false,
    provider: "metalpriceapi", // planned, paid + semantic review
    canonicalUnit: "MT", // metric tonne; matches the sample fixture's display label
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: true,
    unitVerified: false,
    unavailableReason: "paid-gated",
    attribution: SAMPLE_ATTRIBUTION,
  },

  tin: {
    slug: "tin",
    benchmarkId: "tin-metalprice",
    displayName: "Tin benchmark",
    routing: "none",
    classification: "exact",
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    provider: "metalpriceapi",
    providerSymbol: "XSN",
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    sanityBand: [22000, 45000],
    unavailableReason: "paid-gated",
    attribution: SAMPLE_ATTRIBUTION,
  },
  "lead-zinc": {
    slug: "lead-zinc",
    benchmarkId: "lead-zinc-combined",
    displayName: "Lead-Zinc",
    routing: "none",
    // Lead (metalsdev) and Zinc (metalsdev) are SEPARATE exact benchmarks; the
    // combined catalogue slug must never become one blended number.
    classification: "unavailable",
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "structural-lead-zinc",
    attribution: SAMPLE_ATTRIBUTION,
  },
  manganese: {
    slug: "manganese",
    benchmarkId: "manganese",
    displayName: "Manganese",
    routing: "none",
    classification: "unavailable",
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "no-symbol",
    attribution: SAMPLE_ATTRIBUTION,
  },
  "iron-ore": {
    slug: "iron-ore",
    benchmarkId: "iron-ore-proxy",
    displayName: "Iron Ore",
    routing: "none",
    classification: "rejected-proxy", // "IRON" per-ounce ≠ per-dmt bulk benchmark
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    provider: "metalpriceapi",
    providerSymbol: "IRON",
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "proxy-only",
    attribution: SAMPLE_ATTRIBUTION,
  },
  coltan: {
    slug: "coltan",
    benchmarkId: "coltan",
    displayName: "Columbite-Tantalite (Coltan)",
    routing: "none",
    classification: "unavailable",
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "no-symbol",
    attribution: SAMPLE_ATTRIBUTION,
  },
  "rare-earth-elements": {
    slug: "rare-earth-elements",
    benchmarkId: "ree-nd-proxy",
    displayName: "Rare Earth Elements",
    routing: "none",
    classification: "rejected-proxy", // XND (Neodymium) ≠ the REE basket
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    provider: "metalpriceapi",
    providerSymbol: "XND",
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "proxy-only",
    attribution: SAMPLE_ATTRIBUTION,
  },
  barite: {
    slug: "barite",
    benchmarkId: "barite",
    displayName: "Barite",
    routing: "none",
    classification: "unavailable",
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "no-symbol",
    attribution: SAMPLE_ATTRIBUTION,
  },
  bitumen: {
    slug: "bitumen",
    benchmarkId: "bitumen",
    displayName: "Bitumen",
    routing: "none",
    classification: "unavailable",
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "no-symbol",
    attribution: SAMPLE_ATTRIBUTION,
  },
  "crude-oil": {
    slug: "crude-oil",
    benchmarkId: "brent-crude",
    displayName: "Brent Crude", // named explicitly; never generic "Crude Oil price"
    routing: "none", // → "live" once EIA is integrated (after Metals.Dev)
    classification: "exact",
    fallbackPolicy: "unavailable",
    publicDisplayApproved: false,
    provider: "eia", // planned
    // Crude is priced per barrel (volume), not mass — the mass-unit conversion
    // path does not apply; EIA integration handles its own unit.
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "provider-not-integrated",
    attribution: SAMPLE_ATTRIBUTION,
  },
}

export function getBenchmark(slug: string): BenchmarkConfig | undefined {
  return BENCHMARKS[slug]
}

/** Slugs currently routed live to a given provider. */
export function liveSlugs(provider: ProviderId): string[] {
  return Object.values(BENCHMARKS)
    .filter((b) => b.routing === "live" && b.provider === provider)
    .map((b) => b.slug)
}

/** Provider instrument codes to request for the live-routed slugs of a provider. */
export function liveSymbols(provider: ProviderId): string[] {
  return Object.values(BENCHMARKS)
    .filter(
      (b) => b.routing === "live" && b.provider === provider && b.providerSymbol
    )
    .map((b) => b.providerSymbol as string)
}
