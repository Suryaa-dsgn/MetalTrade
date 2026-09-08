import type { ImageAsset } from "@/lib/assets/types"

/*
  Market data contract. Component-facing shape is the Design System §20
  `MarketQuote` (per CLAUDE.md). `change24h` is a percentage. Null values render
  as an em dash — never a fake zero (Design System §13.5).
*/
export type MarketStatus = "live" | "delayed" | "historical" | "unavailable"

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

/** Editorial metal record for "What we trade" cards and metal pages. */
export type Metal = {
  slug: string
  name: string
  symbol: string
  category: string
  forms: string[]
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
  symbol: string
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
