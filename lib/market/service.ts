import "server-only"

import type {
  ChartRange,
  HistoryPoint,
  MarketQuote,
  MarketRow,
  MetalDetail,
  MetalSummary,
  Metal,
  DataProvenance,
} from "@/lib/market/types"
import { mockMarketProvider } from "@/lib/market/providers/mock"
import { metalpriceApiProvider } from "@/lib/market/providers/metalpriceapi"
import type { RawQuote } from "@/lib/market/providers/types"
import { normalizeLiveQuote } from "@/lib/market/normalize"
import {
  getBenchmark,
  liveSymbols,
  SAMPLE_ATTRIBUTION,
  METALPRICEAPI_ATTRIBUTION,
  UNAVAILABLE_ATTRIBUTION,
} from "@/lib/market/benchmarks"
import { evaluateFreshness, MOCK_FRESHNESS_POLICY } from "@/lib/market/freshness"
import { okMeta, degradedMeta, type ReadMeta } from "@/lib/market/meta"
import { getContentSource } from "@/lib/content/source"
import { computeStatistics } from "@/lib/market/history"
import { serverConfig } from "@/lib/config/env"
import { logger } from "@/lib/observability/logger"

/*
  Market read service — registry-driven, MIXED-SOURCE orchestration.

  Each catalogue commodity is routed by the BenchmarkRegistry:
    - "live"   : fetched from a real provider (Gold/XAU on the current plan),
                 normalised, sanity-guarded, stamped source:"live".
    - "sample" : served from the labelled in-repo fixtures, stamped
                 source:"sample" (never presented as live).
    - "none"   : no benchmark, stamped source:"unavailable" ("in preparation").

  One page can therefore show a real Gold benchmark beside indicative sample
  Copper, with each value carrying honest provenance (see `DataProvenance`).

  Activation is by config, and reversible without code:
    MARKET_PROVIDER=metalpriceapi + METALPRICE_API_KEY set → live routing active.
    Otherwise → live-routed commodities fall back to their sample data (dev) or,
    in production with a live provider configured but no key, FAIL CLEARLY
    (rendered unavailable + logged) rather than silently showing mock as live.

  Failure handling (live only; sample is local and cannot fail): a success-only
  in-memory TTL cache plus a last-known-good store. On a live failure we serve
  the last good raw payload (its own timestamps make it read as EOD/stale) with
  `degraded` meta; if there is none, live commodities render unavailable. A
  transient failure is never cached and only a safe signal reaches callers.

  LIMITATION: the cache/last-known-good are per server instance and do not
  survive a cold start (no database, by design). The provider adapter's Next
  fetch revalidate softens this; durable last-known-good is a future step.
*/

const LIVE_CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3h; daily/EOD data + provider fetch-cache

function isLiveConfigured(): boolean {
  return serverConfig.marketProvider === "metalpriceapi"
}
function hasLiveKey(): boolean {
  return !!serverConfig.metalPriceApiKey
}
/** Live routing is actually active only when configured AND credentialed. */
export function isLiveActive(): boolean {
  return isLiveConfigured() && hasLiveKey()
}

export type MetalDetailData = {
  detail: MetalDetail
  historySet: Partial<Record<ChartRange, HistoryPoint[]>>
}

// --- helpers ---------------------------------------------------------------

function unavailableQuote(
  symbol: string | undefined,
  name: string,
  unit: string,
  source: DataProvenance = "unavailable"
): MarketQuote {
  return {
    symbol: symbol ?? "",
    name,
    price: null,
    currency: "USD",
    unit,
    change24h: null,
    updatedAt: null,
    status: "unavailable",
    source,
    retrievedAt: null,
  }
}

/** Apply the sample freshness policy and stamp sample provenance. */
function toSampleQuote(mock: MarketQuote): MarketQuote {
  const status =
    mock.price == null || mock.updatedAt == null
      ? "unavailable"
      : evaluateFreshness(mock.updatedAt, MOCK_FRESHNESS_POLICY)
  return { ...mock, status, source: "sample", retrievedAt: null }
}

function assertProviderHealthy() {
  if (serverConfig.marketSimulateFailure) {
    throw new Error("simulated market provider failure")
  }
}

// --- live fetch with success-only cache + last-known-good ------------------

type LivePayload = { quotes: Record<string, RawQuote>; retrievedAt: string }

const successCache = new Map<string, { data: unknown; at: number }>()
const lastGoodStore = new Map<string, unknown>()

/** Fetch live raw quotes; cache success only; on failure serve last-known-good
 *  (marked degraded) else empty. Returns raw quotes + whether degraded. */
async function getLiveQuotes(): Promise<{ data: LivePayload; degraded: boolean }> {
  const symbols = liveSymbols("metalpriceapi")
  if (symbols.length === 0) {
    return { data: { quotes: {}, retrievedAt: new Date().toISOString() }, degraded: false }
  }

  const key = "live:quotes"
  const now = Date.now()
  const cached = successCache.get(key)
  if (cached && now - cached.at < LIVE_CACHE_TTL_MS) {
    return { data: cached.data as LivePayload, degraded: false }
  }

  try {
    assertProviderHealthy()
    const r = await metalpriceApiProvider.fetchQuotes(symbols)
    const data: LivePayload = { quotes: r.quotes, retrievedAt: r.retrievedAt }
    successCache.set(key, { data, at: now })
    lastGoodStore.set(key, data)
    return { data, degraded: false }
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code
        : "unknown"
    logger.warn("market.live.fetch_failed", { provider: "metalpriceapi", code })
    const lastGood = lastGoodStore.get(key) as LivePayload | undefined
    if (lastGood) {
      return { data: lastGood, degraded: true }
    }
    return { data: { quotes: {}, retrievedAt: new Date().toISOString() }, degraded: true }
  }
}

// --- core resolution (mixed source) ----------------------------------------

type ResolvedQuotes = {
  bySlug: Record<string, MarketQuote>
  meta: ReadMeta
}

async function resolveQuotes(catalogue: Metal[]): Promise<ResolvedQuotes> {
  const liveActive = isLiveActive()
  const isProd = process.env.NODE_ENV === "production"
  const bySlug: Record<string, MarketQuote> = {}
  let degraded = false
  let anyLive = false

  // Misconfiguration: live provider selected but no key.
  if (isLiveConfigured() && !hasLiveKey()) {
    logger.error("market.live.misconfigured", {
      reason: "missing_api_key",
      env: isProd ? "production" : "development",
      // dev falls back to sample; prod fails clearly (unavailable)
      behaviour: isProd ? "unavailable" : "sample_fallback",
    })
  }

  let live: LivePayload | null = null
  if (liveActive) {
    const res = await getLiveQuotes()
    live = res.data
    degraded = res.degraded
  }

  const mockQuotes = await mockMarketProvider.getQuotes()

  for (const metal of catalogue) {
    const cfg = getBenchmark(metal.slug)
    const canonicalUnit = cfg?.canonicalUnit ?? "MT"

    // 1. Live-routed and active → real provider value.
    if (cfg?.routing === "live" && liveActive && live && cfg.providerSymbol) {
      const raw = live.quotes[cfg.providerSymbol]
      bySlug[metal.slug] = normalizeLiveQuote(
        raw,
        cfg,
        metal.name,
        live.retrievedAt
      ).quote
      anyLive = true
      continue
    }

    // 2. Live-routed but configured-without-key in PRODUCTION → fail clearly.
    if (cfg?.routing === "live" && isLiveConfigured() && !hasLiveKey() && isProd) {
      bySlug[metal.slug] = unavailableQuote(
        cfg.providerSymbol,
        metal.name,
        canonicalUnit
      )
      continue
    }

    // 3. Sample-eligible (explicit sample, or a live route falling back in
    //    dev/mock mode) with fixture data → labelled sample.
    const sampleEligible = cfg?.routing === "sample" || cfg?.routing === "live"
    const mq = metal.symbol ? mockQuotes[metal.symbol] : undefined
    if (sampleEligible && mq) {
      bySlug[metal.slug] = toSampleQuote(mq)
      continue
    }

    // 4. No benchmark → unavailable ("in preparation").
    bySlug[metal.slug] = unavailableQuote(cfg?.providerSymbol, metal.name, canonicalUnit)
  }

  const provider = anyLive ? "metalpriceapi" : "mock"
  const source = anyLive ? "live" : "mock"
  const meta = degraded ? degradedMeta(provider, source) : okMeta(provider, source)
  return { bySlug, meta }
}

// --- public reads ----------------------------------------------------------

/** Catalogue metals joined with current (mixed-source) quotes. */
export async function getMarketOverview(): Promise<{
  data: MetalSummary[]
  meta: ReadMeta
}> {
  const catalogue = await getContentSource().getMetals()
  const { bySlug, meta } = await resolveQuotes(catalogue)
  const data = catalogue.map((metal) => ({
    ...metal,
    quote:
      bySlug[metal.slug] ??
      unavailableQuote(metal.symbol, metal.name, getBenchmark(metal.slug)?.canonicalUnit ?? "MT"),
  }))
  return { data, meta }
}

/** Overview table rows (catalogue joined with mixed-source quotes). */
export async function getMarketTable(): Promise<{
  data: MarketRow[]
  meta: ReadMeta
}> {
  const catalogue = await getContentSource().getMetals()
  const { bySlug, meta } = await resolveQuotes(catalogue)

  // 7d/30d change is only available for sample commodities (mock fixtures); live
  // Gold has no multi-day change on the Free tier → honest null (em dash).
  const ext = await mockMarketProvider.getExtendedChanges()

  const rows: MarketRow[] = catalogue.map((metal) => {
    const q = bySlug[metal.slug]
    const isSample = q?.source === "sample"
    const e = isSample && metal.symbol ? ext[metal.symbol] : undefined
    return {
      slug: metal.slug,
      name: metal.name,
      symbol: metal.symbol,
      category: metal.category,
      price: q?.price ?? null,
      currency: q?.currency ?? "USD",
      unit: q?.unit ?? "MT",
      change24h: q?.change24h ?? null,
      change7d: e?.change7d ?? null,
      change30d: e?.change30d ?? null,
      updatedAt: q?.updatedAt ?? null,
      status: q?.status ?? "unavailable",
      source: q?.source ?? "unavailable",
      retrievedAt: q?.retrievedAt ?? null,
    }
  })
  return { data: rows, meta }
}

/** Resolve a catalogue metal (with its current quote) by slug. */
export async function getMetalBySlug(
  slug: string
): Promise<{ data: MetalSummary | null; meta: ReadMeta }> {
  const catalogue = await getContentSource().getMetals()
  const metal = catalogue.find((m) => m.slug === slug)
  if (!metal) return { data: null, meta: okMeta("mock", "mock") }
  const { bySlug, meta } = await resolveQuotes(catalogue)
  return {
    data: {
      ...metal,
      quote:
        bySlug[slug] ??
        unavailableQuote(metal.symbol, metal.name, getBenchmark(slug)?.canonicalUnit ?? "MT"),
    },
    meta,
  }
}

/** Attribution/source label for a slug, resolved from its quote provenance. */
function sourceLabel(source: DataProvenance | undefined): string {
  switch (source) {
    case "live":
      return METALPRICEAPI_ATTRIBUTION.label
    case "sample":
      return SAMPLE_ATTRIBUTION.label
    default:
      return UNAVAILABLE_ATTRIBUTION.label
  }
}

/** Full detail + history for a metal that has detail content (Copper). History
 *  is served from the sample fixtures for sample-routed benchmarks; a live
 *  history-capable benchmark (paid tier) would source real observations here. */
export async function getMetalDetail(
  slug: string
): Promise<{ data: MetalDetailData | null; meta: ReadMeta }> {
  const content = getContentSource()
  const [contentDetail, catalogue] = await Promise.all([
    content.getMetalDetailContent(slug),
    content.getMetals(),
  ])
  const metal = catalogue.find((m) => m.slug === slug)
  if (!contentDetail || !metal) {
    return { data: null, meta: okMeta("mock", "mock") }
  }

  const { bySlug, meta } = await resolveQuotes(catalogue)
  const quote = bySlug[slug]
  const cfg = getBenchmark(slug)
  const price = quote?.price
  if (price == null) {
    return { data: null, meta } // no anchor → no coherent history
  }

  // History source: sample benchmarks use the labelled mock history. (Live
  // history is paid-gated on the current plan; a live history-capable benchmark
  // would branch here to the provider's real observations.)
  const historySet =
    cfg?.routing !== "live" && cfg?.historyCapable
      ? await mockMarketProvider.getHistorySet(slug, contentDetail.supportedRanges, price)
      : {}

  const series1D = historySet["1D"] ?? []
  const series1Y = historySet["1Y"] ?? series1D
  const statistics = computeStatistics({
    currentPrice: price,
    change24h: quote?.change24h ?? null,
    series1D,
    series1Y,
    currency: quote?.currency ?? "USD",
    unit: quote?.unit ?? "MT",
  })

  const detail: MetalDetail = {
    slug: contentDetail.slug,
    provider: sourceLabel(quote?.source), // honest source label, not a fixed placeholder
    supportedRanges: contentDetail.supportedRanges,
    statistics,
    specifications: contentDetail.specifications,
    applications: contentDetail.applications,
    regionsNote: contentDetail.regionsNote,
    pricingFactors: contentDetail.pricingFactors,
  }
  return { data: { detail, historySet }, meta }
}
