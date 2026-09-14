import "server-only"

import type {
  ChartRange,
  HistoryPoint,
  MarketQuote,
  MarketRow,
  MetalDetail,
  MetalSummary,
} from "@/lib/market/types"
import type { MarketProvider } from "@/lib/market/provider"
import { mockMarketProvider } from "@/lib/market/providers/mock"
import { evaluateFreshness } from "@/lib/market/freshness"
import { okMeta, degradedMeta, type ReadMeta } from "@/lib/market/meta"
import { getContentSource } from "@/lib/content/source"
import { computeStatistics } from "@/lib/market/history"
import { serverConfig } from "@/lib/config/env"

/*
  Market read service (Phase 10, amendment 12). This is the orchestration layer:
  it selects the provider, composes it with the ContentSource, caches SUCCESSFUL
  provider payloads, evaluates freshness per the provider's policy, and fails over
  safely. Pages consume these functions instead of importing fixtures.

  Failure handling (amendment 1): a small in-memory TTL cache stores ONLY
  successful reads. On a provider failure we serve the last-known-good payload
  marked stale (preserving its original `updatedAt`) when we have one; otherwise
  an UNCACHED degraded/unavailable result. A transient failure is never written to
  the cache, and only a safe error code reaches callers (amendment 3).

  We deliberately do NOT use `unstable_cache` here: its opaque stale-on-error
  serving would resolve a failed revalidation as a silent success, which prevents
  the explicit degraded/stale marking these amendments require. This explicit
  cache is the seam a shared/distributed cache would later replace.
*/

const CACHE_TTL_MS = 60_000

function getMarketProvider(): MarketProvider {
  switch (serverConfig.marketProvider) {
    case "mock":
    default:
      return mockMarketProvider
  }
}

const provider = getMarketProvider()

/** True when the selected feed is sample/mock — keeps sample labelling honest. */
export const MARKET_DATA_IS_SAMPLE = provider.source === "mock"

export type MetalDetailData = {
  detail: MetalDetail
  historySet: Partial<Record<ChartRange, HistoryPoint[]>>
}

// --- helpers ---------------------------------------------------------------

function unavailableQuote(symbol: string | undefined, name: string): MarketQuote {
  return {
    symbol: symbol ?? "",
    name,
    price: null,
    currency: "USD",
    unit: "MT",
    change24h: null,
    updatedAt: null,
    status: "unavailable",
  }
}

/** Apply the provider's freshness policy to a quote's status. */
function withFreshness(q: MarketQuote): MarketQuote {
  const status =
    q.price == null || q.updatedAt == null
      ? "unavailable"
      : evaluateFreshness(q.updatedAt, provider.freshnessPolicy)
  return { ...q, status }
}

/** Simulated failure hook (dev/QA). Thrown INSIDE the cached fn so the failure
 *  is never cached. */
function assertProviderHealthy() {
  if (serverConfig.marketSimulateFailure) {
    throw new Error("simulated market provider failure")
  }
}

// Success-only TTL cache and last-known-good store (per server instance).
type CacheEntry = { data: unknown; at: number }
const successCache = new Map<string, CacheEntry>()
const lastGoodStore = new Map<string, unknown>()

/**
 * Serve a fresh cached success when available; otherwise run `compute` (the
 * provider work). Cache SUCCESS only. On failure serve last-known-good marked
 * stale, else an uncached degraded value (amendment 1).
 */
async function withFailover<T>(
  key: string,
  compute: () => Promise<T>,
  staleFromLastGood: (lastGood: T) => T,
  emptyDegraded: () => T
): Promise<{ data: T; meta: ReadMeta }> {
  const now = Date.now()
  const cached = successCache.get(key)
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return { data: cached.data as T, meta: okMeta(provider.name, provider.source) }
  }
  try {
    assertProviderHealthy()
    const data = await compute()
    successCache.set(key, { data, at: now }) // cache SUCCESS only
    lastGoodStore.set(key, data)
    return { data, meta: okMeta(provider.name, provider.source) }
  } catch {
    const lastGood = lastGoodStore.get(key) as T | undefined
    if (lastGood !== undefined) {
      // Uncached: degraded, last-known values marked stale (original timestamps kept).
      return {
        data: staleFromLastGood(lastGood),
        meta: degradedMeta(provider.name, provider.source),
      }
    }
    return { data: emptyDegraded(), meta: degradedMeta(provider.name, provider.source) }
  }
}

// --- public reads ----------------------------------------------------------

/** Catalogue metals joined with current quotes. */
export async function getMarketOverview(): Promise<{
  data: MetalSummary[]
  meta: ReadMeta
}> {
  const catalogue = await getContentSource().getMetals()

  const { data: quotesBySymbol, meta } = await withFailover<
    Record<string, MarketQuote>
  >(
    "quotes",
    async () => {
      const quotes = await provider.getQuotes()
      const out: Record<string, MarketQuote> = {}
      for (const [symbol, q] of Object.entries(quotes)) {
        out[symbol] = withFreshness(q)
      }
      return out
    },
    (lastGood) => {
      const out: Record<string, MarketQuote> = {}
      for (const [symbol, q] of Object.entries(lastGood)) {
        out[symbol] = q.updatedAt ? { ...q, status: "stale" } : q
      }
      return out
    },
    () => ({})
  )

  const data = catalogue.map((metal) => ({
    ...metal,
    quote:
      (metal.symbol ? quotesBySymbol[metal.symbol] : undefined) ??
      unavailableQuote(metal.symbol, metal.name),
  }))
  return { data, meta }
}

/** Overview table rows (catalogue joined + standalone pressure rows). */
export async function getMarketTable(): Promise<{
  data: MarketRow[]
  meta: ReadMeta
}> {
  const catalogue = await getContentSource().getMetals()

  const unavailableRows = (): MarketRow[] =>
    catalogue.map((m) => ({
      slug: m.slug,
      name: m.name,
      symbol: m.symbol,
      category: m.category,
      price: null,
      currency: "USD",
      unit: "MT",
      change24h: null,
      change7d: null,
      change30d: null,
      updatedAt: null,
      status: "unavailable",
    }))

  return withFailover<MarketRow[]>(
    "table",
    async () => {
      const [quotes, ext, pressure] = await Promise.all([
        provider.getQuotes(),
        provider.getExtendedChanges(),
        provider.getPressureRows(),
      ])
      const rows: MarketRow[] = catalogue.map((m) => {
        const raw = m.symbol ? quotes[m.symbol] : undefined
        const q = raw ? withFreshness(raw) : undefined
        const e = m.symbol ? ext[m.symbol] : undefined
        return {
          slug: m.slug,
          name: m.name,
          symbol: m.symbol,
          category: m.category,
          price: q?.price ?? null,
          currency: q?.currency ?? "USD",
          unit: q?.unit ?? "MT",
          change24h: q?.change24h ?? null,
          change7d: e?.change7d ?? null,
          change30d: e?.change30d ?? null,
          updatedAt: q?.updatedAt ?? null,
          status: q?.status ?? "unavailable",
        }
      })
      return [...rows, ...pressure]
    },
    (lastGood) => lastGood.map((r) => (r.updatedAt ? { ...r, status: "stale" } : r)),
    unavailableRows
  )
}

/** Resolve a catalogue metal (with its current quote) by slug. */
export async function getMetalBySlug(
  slug: string
): Promise<{ data: MetalSummary | null; meta: ReadMeta }> {
  const metal = await getContentSource().getMetalBySlug(slug)
  if (!metal) return { data: null, meta: okMeta(provider.name, provider.source) }

  return withFailover<MetalSummary>(
    `quote:${slug}`,
    async () => {
      const quotes = await provider.getQuotes()
      const q = metal.symbol ? quotes[metal.symbol] : undefined
      return { ...metal, quote: q ? withFreshness(q) : unavailableQuote(metal.symbol, metal.name) }
    },
    (lastGood) => ({
      ...lastGood,
      quote: lastGood.quote.updatedAt
        ? { ...lastGood.quote, status: "stale" }
        : lastGood.quote,
    }),
    () => ({ ...metal, quote: unavailableQuote(metal.symbol, metal.name) })
  )
}

/** Full detail + historical fixture for a metal that has detail content. */
export async function getMetalDetail(
  slug: string
): Promise<{ data: MetalDetailData | null; meta: ReadMeta }> {
  const content = getContentSource()
  const [contentDetail, metal] = await Promise.all([
    content.getMetalDetailContent(slug),
    content.getMetalBySlug(slug),
  ])
  if (!contentDetail || !metal) {
    return { data: null, meta: okMeta(provider.name, provider.source) }
  }

  return withFailover<MetalDetailData | null>(
    `detail:${slug}`,
    async () => {
      const quotes = await provider.getQuotes()
      const quote = metal.symbol ? quotes[metal.symbol] : undefined
      const price = quote?.price
      if (price == null) return null // no anchor → no coherent history

      const historySet = await provider.getHistorySet(
        slug,
        contentDetail.supportedRanges,
        price
      )
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
        provider: contentDetail.provider,
        supportedRanges: contentDetail.supportedRanges,
        statistics,
        specifications: contentDetail.specifications,
        applications: contentDetail.applications,
        regionsNote: contentDetail.regionsNote,
        pricingFactors: contentDetail.pricingFactors,
      }
      return { detail, historySet }
    },
    (lastGood) => lastGood, // detail has no per-field status; meta.degraded signals it
    () => null
  )
}
