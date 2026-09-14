import type { MarketQuote, MarketRow } from "@/lib/market/types"

/*
  MOCK sample quotes for development ONLY. These are NOT live and NOT real
  prices. Every surface that renders them must label them as indicative sample
  data. A licensed provider replaces this fixture in a later phase.

  Phase 9B: sample quotes are kept only for the commodities that already had an
  approved sample market identity (Copper, Gold, Lithium). Every other confirmed
  commodity has NO fabricated price/symbol and resolves to "unavailable" via the
  service, so its market profile reads as "in preparation".
*/
const SAMPLE_ASOF = "2026-09-08T14:30:00Z"

export const marketQuotes: Record<string, MarketQuote> = {
  Cu: {
    symbol: "Cu",
    name: "Copper",
    price: 8420,
    currency: "USD",
    unit: "MT",
    change24h: 1.21,
    updatedAt: SAMPLE_ASOF,
    status: "delayed",
  },
  Au: {
    symbol: "Au",
    name: "Gold",
    price: 1932.4,
    currency: "USD",
    unit: "oz",
    change24h: 0,
    updatedAt: SAMPLE_ASOF,
    status: "delayed",
  },
  Li: {
    symbol: "Li",
    name: "Lithium",
    price: 13750,
    currency: "USD",
    unit: "MT",
    change24h: -2.1,
    updatedAt: SAMPLE_ASOF,
    status: "delayed",
  },
}

/* 7-day and 30-day sample changes for the overview table. */
export const marketExtended: Record<
  string,
  { change7d: number | null; change30d: number | null }
> = {
  Cu: { change7d: 2.4, change30d: -1.1 },
  Au: { change7d: 0.5, change30d: 2.1 },
  Li: { change7d: -3.4, change30d: -8.7 },
}

/*
  No standalone pressure-test rows. Earlier fixtures included commodities the
  client does not trade (Rhodium, ferro-silico-manganese); those are removed so
  the table shows only the confirmed commodity catalogue.
*/
export const marketPressureRows: MarketRow[] = []
