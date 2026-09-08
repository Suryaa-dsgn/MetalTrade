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
