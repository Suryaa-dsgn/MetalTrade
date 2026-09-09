import type {
  ChartRange,
  HistoryPoint,
  MarketRow,
  MetalDetail,
  MetalSummary,
} from "@/lib/market/types"
import { metals } from "@/data/mock/metals"
import {
  marketExtended,
  marketPressureRows,
  marketQuotes,
} from "@/data/mock/market"
import { metalDetailContent } from "@/data/mock/metal-details"
import { buildHistorySet, computeStatistics } from "@/lib/market/history"

/*
  Mock market adapter — the single seam a licensed provider replaces in Phase 10.
  Async by design so the call site (a server component) already treats market
  data as a fetch boundary. Returns MOCK sample data; callers must present it as
  indicative, never live.
*/

/** Metals joined with their current sample quotes, in catalogue order. */
export async function getMarketOverview(): Promise<MetalSummary[]> {
  return metals.map((metal) => ({
    ...metal,
    quote: marketQuotes[metal.symbol] ?? {
      symbol: metal.symbol,
      name: metal.name,
      price: null,
      currency: "USD",
      unit: "MT",
      change24h: null,
      updatedAt: null,
      status: "unavailable" as const,
    },
  }))
}

/** Overview table rows: the editorial metals joined with 24h/7d/30d sample
 *  changes, plus standalone pressure-test rows. */
export async function getMarketTable(): Promise<MarketRow[]> {
  const rows: MarketRow[] = metals.map((metal) => {
    const quote = marketQuotes[metal.symbol]
    const ext = marketExtended[metal.symbol]
    return {
      slug: metal.slug,
      name: metal.name,
      symbol: metal.symbol,
      category: metal.category,
      price: quote?.price ?? null,
      currency: quote?.currency ?? "USD",
      unit: quote?.unit ?? "MT",
      change24h: quote?.change24h ?? null,
      change7d: ext?.change7d ?? null,
      change30d: ext?.change30d ?? null,
      updatedAt: quote?.updatedAt ?? null,
      status: quote?.status ?? "unavailable",
    }
  })
  return [...rows, ...marketPressureRows]
}

/** Resolve a catalogue metal (with its current sample quote) by slug. */
export async function getMetalBySlug(
  slug: string
): Promise<MetalSummary | null> {
  const metal = metals.find((m) => m.slug === slug)
  if (!metal) return null
  const quote = marketQuotes[metal.symbol] ?? {
    symbol: metal.symbol,
    name: metal.name,
    price: null,
    currency: "USD",
    unit: "MT",
    change24h: null,
    updatedAt: null,
    status: "unavailable" as const,
  }
  return { ...metal, quote }
}

export type MetalDetailData = {
  detail: MetalDetail
  historySet: Partial<Record<ChartRange, HistoryPoint[]>>
}

/** Full detail + historical fixture for a metal that has detail content
 *  (Copper only in this phase). Returns null otherwise. */
export async function getMetalDetail(
  slug: string
): Promise<MetalDetailData | null> {
  const content = metalDetailContent[slug]
  const metal = metals.find((m) => m.slug === slug)
  if (!content || !metal) return null

  const quote = marketQuotes[metal.symbol]
  const price = quote?.price
  if (price == null) return null // no anchor → no coherent history

  const historySet = buildHistorySet(slug, content.supportedRanges, price)
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
    slug: content.slug,
    provider: content.provider,
    supportedRanges: content.supportedRanges,
    statistics,
    specifications: content.specifications,
    applications: content.applications,
    regionsNote: content.regionsNote,
    pricingFactors: content.pricingFactors,
  }

  return { detail, historySet }
}

/** True mock flag so the UI can label data as sample rather than live. */
export const MARKET_DATA_IS_SAMPLE = true
