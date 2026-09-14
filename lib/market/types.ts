import type { ImageAsset } from "@/lib/assets/types"

/*
  Market data contract. Component-facing shape is the Design System §20
  `MarketQuote` (per CLAUDE.md). `change24h` is a percentage. Null values render
  as an em dash — never a fake zero (Design System §13.5).
*/
// Quote status (Blueprint §9) — distinct from feed `Freshness` and from
// historical-data `HistoryState`. A quote may be available while history is not
// (and vice versa).
export type MarketStatus =
  | "live"
  | "delayed"
  | "eod"
  | "stale"
  | "unavailable"

export type MarketQuote = {
  symbol: string
  name: string
  price: number | null
  currency: string // ISO 4217, e.g. "USD"
  unit: string // "MT" | "oz" | "kg"
  change24h: number | null // percent
  updatedAt: string | null // ISO 8601 UTC
  status: MarketStatus
}

/** Editorial commodity record for "What we trade" cards and detail pages. */
export type Metal = {
  slug: string
  name: string
  /** Market identifier, only for commodities with an approved/sample market
   *  identity (Cu, Au, Li). Omitted for commodities without one: no fabricated
   *  exchange-like codes. */
  symbol?: string
  category: string
  /** Client-confirmed physical forms only. Omitted where forms are confirmed
   *  per enquiry: no invented forms/grades/specifications. */
  forms?: string[]
  summary: string
  image: ImageAsset
}

/** A metal joined with its current (mock, in this phase) quote. */
export type MetalSummary = Metal & { quote: MarketQuote }

/*
  Markets overview table row — standalone (not tied to the editorial `Metal`)
  so pressure-test rows and, later, provider rows need no image/forms/summary.
  All change fields are percentages; null renders as an em dash, never zero.
*/
export type MarketRow = {
  slug: string
  name: string
  symbol?: string // omitted for commodities without an approved market identity
  category: string
  price: number | null
  currency: string // ISO 4217
  unit: string // native quote unit, e.g. "MT" | "oz"
  change24h: number | null
  change7d: number | null
  change30d: number | null
  updatedAt: string | null // ISO 8601 UTC
  status: MarketStatus
}

/*
  Feed freshness is distinct from a quote's `status`:
    - live    : real-time
    - delayed : intentionally delayed feed
    - stale   : exceeded the expected freshness threshold (attention, not alarm)
*/
export type Freshness = "live" | "delayed" | "stale"

/* ---- Metal detail (Phase 5) ---- */

export type ChartRange = "1D" | "7D" | "1M" | "3M" | "1Y" | "5Y"
export const CHART_RANGES: ChartRange[] = ["1D", "7D", "1M", "3M", "1Y", "5Y"]

/** A single historical point. `timestamp` is ISO 8601 UTC (explicit name). */
export type HistoryPoint = { timestamp: string; value: number }

/** Historical-data availability — separate from the quote status. */
export type HistoryState = "ready" | "loading" | "no-data" | "stale" | "error"

/** Coherent market summary metrics (null where not meaningful/licensed). */
export type MetalStatistics = {
  open: number | null
  previousClose: number | null
  dayLow: number | null
  dayHigh: number | null
  week52Low: number | null
  week52High: number | null
  currency: string
  unit: string // native unit these canonical values are expressed in
}

/** A physical specification field. Value null → shown as a placeholder. */
export type SpecField = { label: string; value: string | null; note?: string }

/** Editorial + physical detail for a metal (Copper only in this phase). */
export type MetalDetail = {
  slug: string
  provider: string // placeholder until a licensed feed is connected
  supportedRanges: ChartRange[] // range availability comes from config, not the chart
  statistics: MetalStatistics
  specifications: SpecField[]
  applications: string[]
  regionsNote: string
  pricingFactors: string[]
}
