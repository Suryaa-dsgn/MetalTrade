import type { MassUnit } from "@/lib/market/units"
import type { FreshnessPolicy } from "@/lib/market/freshness"
import { FRESHNESS_PRESETS, MOCK_FRESHNESS_POLICY } from "@/lib/market/freshness"

/*
  ============================================================================
  BENCHMARK REGISTRY — the single source of truth for how each catalogue
  commodity is sourced, mapped, unit-normalised, and attributed. Provider
  mapping lives HERE, never in pages/components, so adding or upgrading a
  provider is a registry change, not a UI change.
  ============================================================================

  VERIFIED PROVIDER CONTRACT (MetalpriceAPI, probed 2026-09-14, Free tier)
  ------------------------------------------------------------------------
  - Auth: `X-API-KEY` header (also accepts `?api_key=`). We use the header so the
    key never appears in a URL or log.
  - `GET /v1/latest?base=USD&currencies=XAU,...` returns `rates` with BOTH
    `XAU` (metal per USD) and `USDXAU` (USD per unit). We read `USD<symbol>` as
    the price in USD per the provider's native unit.
  - `timestamp` (UNIX seconds) is the provider as-of time. A live Gold probe
    returned 2026-09-13T23:59:59Z → an END-OF-DAY feed on the Free tier.
  - Units: precious metals are per TROY OUNCE (verified: XAU ≈ $4,348/oz, which
    matches spot). Our `units.ts` "oz" is the troy ounce (31.1034768 g), so Gold
    needs NO conversion.

  PLAN LIMITATIONS ON THE FREE TIER (probed, real API errors — NOT provider
  "does not support"; these unlock on a paid plan):
  - Base-metal quotes are paid-gated: `XCU query requires a paid plan` (416).
    Same for XSN/XPB/XLI/IRON. So Copper/Tin/Lead/Lithium/Iron-Ore CANNOT be
    fetched live yet; they stay on sample / in-preparation.
  - Timeframe history > 5 days is paid-gated (421). Single-date history works but
    would exhaust the 100 calls/month quota to build a chart. So live history is
    effectively unavailable on Free.
  - The `unit` override (troy_oz/gram/kilogram) is paid-only — no per-tonne unit
    from the API; base-metal per-ounce → per-tonne conversion is done locally via
    `convertMassPrice` once a paid plan lets us verify the returned magnitude.

  BASE-METAL UNIT NOTE (for the paid-tier upgrade): MetalpriceAPI's symbol list
  labels base metals as "Ounce" (docs are inconsistent about troy vs
  avoirdupois). Do NOT assume. When the paid tier is enabled, run the probe,
  confirm the returned magnitude against `sanityBand` below under BOTH ounce
  bases, set `providerUnit` to the confirmed unit, flip `unitVerified` to true,
  and normalise to `canonicalUnit` ("t") via the centralised `convertMassPrice`.
*/

export type ProviderId = "metalpriceapi"

/** How a commodity is sourced RIGHT NOW. */
export type BenchmarkRouting = "live" | "sample" | "none"

/** Why a commodity has no live benchmark (for internal docs/observability). */
export type UnavailableReason =
  | "paid-gated" // provider supports it, current plan does not
  | "no-symbol" // provider has no instrument for it
  | "proxy-only" // only a single-element/proxy instrument exists (not the basket)
  | "energy-decision-pending" // energy benchmark exists (WTI/BRENT) but choice unconfirmed
  | "structural-lead-zinc" // two separate benchmarks; must not collapse to one number

export type Attribution = {
  label: string
  url?: string
  disclaimer?: string
}

export type BenchmarkConfig = {
  slug: string
  routing: BenchmarkRouting
  /** Live provider (only when routing === "live"). */
  provider?: ProviderId
  /** Provider instrument code, e.g. "XAU". Recorded even when paid-gated so the
   *  upgrade path is a config flip, not new code. */
  providerSymbol?: string
  benchmarkName?: string
  /** Unit the provider value is denominated in. */
  providerUnit?: MassUnit
  /** Unit we display/store canonically. */
  canonicalUnit: MassUnit
  currency: string
  freshnessPolicy: FreshnessPolicy
  historyCapable: boolean
  /** True only after a live probe confirmed the provider unit AND magnitude. */
  unitVerified: boolean
  /** Plausible [min, max] in CANONICAL unit. A converted value outside this band
   *  is refused (rendered unavailable) rather than published — a guard against a
   *  troy/avoirdupois or scale mistake ever showing a wildly wrong public price. */
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

/** Live capability snapshot for the CURRENTLY configured plan. Flip these after
 *  a plan upgrade + re-verification (see docs/market-provider-readiness.md). */
export const PROVIDER_CAPABILITIES: Record<ProviderId, ProviderCapabilities> = {
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
  disclaimer:
    "Reference benchmark, delayed / end-of-day. Not a transaction price.",
}

export const SAMPLE_ATTRIBUTION: Attribution = {
  label: "Indicative sample data",
  disclaimer: "Development sample, not a live market feed.",
}

/*
  The registry for all 12 confirmed catalogue commodities. Keyed by catalogue
  slug (see data/mock/metals.ts). Only Gold is live on the Free tier; Copper and
  Lithium keep their existing labelled sample data; the rest have no live
  benchmark and remain "in preparation".
*/
export const BENCHMARKS: Record<string, BenchmarkConfig> = {
  // --- LIVE (Free tier verified) ---------------------------------------------
  gold: {
    slug: "gold",
    routing: "live",
    provider: "metalpriceapi",
    providerSymbol: "XAU",
    benchmarkName: "Gold benchmark (USD/oz)",
    providerUnit: "oz", // troy ounce — verified
    canonicalUnit: "oz",
    currency: "USD",
    freshnessPolicy: FRESHNESS_PRESETS.endOfDay,
    historyCapable: false, // paid-gated on Free
    unitVerified: true, // verified live: USDXAU ≈ 4348/oz
    sanityBand: [500, 20000], // USD per troy oz, wide plausibility
    attribution: METALPRICEAPI_ATTRIBUTION,
  },

  // --- SAMPLE (kept until paid access enables + verifies the live benchmark) --
  copper: {
    slug: "copper",
    routing: "sample",
    provider: "metalpriceapi",
    providerSymbol: "XCU",
    benchmarkName: "Copper benchmark (USD/t)",
    canonicalUnit: "t", // display per metric tonne (LME convention)
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: true, // sample history exists (data/mock)
    unitVerified: false, // provider "ounce" basis unconfirmed until paid probe
    sanityBand: [7000, 13000], // USD/t
    unavailableReason: "paid-gated",
    attribution: SAMPLE_ATTRIBUTION,
  },
  lithium: {
    slug: "lithium",
    routing: "sample",
    provider: "metalpriceapi",
    providerSymbol: "XLI",
    benchmarkName: "Lithium benchmark",
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: true,
    unitVerified: false,
    // XLI also needs SEMANTIC review (what physical lithium product it tracks)
    // before it is exposed, even once the paid tier returns a number.
    unavailableReason: "paid-gated",
    attribution: SAMPLE_ATTRIBUTION,
  },

  // --- NONE (no live benchmark; "in preparation") ----------------------------
  tin: {
    slug: "tin",
    routing: "none",
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
    routing: "none",
    // Lead (XPB) and Zinc (ZNC) are SEPARATE benchmarks. Must not be combined
    // into one number. If exposed later, represent as two distinct reference
    // benchmarks, not one blended price.
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
    routing: "none",
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
    routing: "none",
    provider: "metalpriceapi",
    providerSymbol: "IRON",
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    // "IRON" is quoted per ounce — a weak proxy for a bulk per-dmt commodity.
    // Needs an explicit semantic decision before exposure, not just a paid plan.
    unavailableReason: "proxy-only",
    attribution: SAMPLE_ATTRIBUTION,
  },
  coltan: {
    slug: "coltan",
    routing: "none",
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
    routing: "none",
    provider: "metalpriceapi",
    providerSymbol: "XND", // Neodymium — a single element, NOT the REE basket
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
    routing: "none",
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
    routing: "none",
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
    routing: "none",
    // WTI/BRENT exist under the provider's energy set (per barrel), but choosing
    // and labelling a specific crude benchmark is a product decision, and the
    // unit is volume (barrel), not mass — out of scope for this mass-metal pass.
    canonicalUnit: "t",
    currency: "USD",
    freshnessPolicy: MOCK_FRESHNESS_POLICY,
    historyCapable: false,
    unitVerified: false,
    unavailableReason: "energy-decision-pending",
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
