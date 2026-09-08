import type { MarketQuote, MarketRow } from "@/lib/market/types"

/*
  MOCK sample quotes for development ONLY. These are NOT live and NOT real
  prices. Every surface that renders them must label them as indicative sample
  data. A licensed provider replaces this fixture in Phase 10.

  States are deliberately varied to exercise the UI: positive / negative / flat
  movement and one `unavailable` value (null price → em dash, never a fake zero).
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
  Al: {
    symbol: "Al",
    name: "Aluminium",
    price: 2360,
    currency: "USD",
    unit: "MT",
    change24h: -0.42,
    updatedAt: SAMPLE_ASOF,
    status: "delayed",
  },
  Ni: {
    symbol: "Ni",
    name: "Nickel",
    price: 15980,
    currency: "USD",
    unit: "MT",
    change24h: 0.35,
    updatedAt: SAMPLE_ASOF,
    status: "delayed",
  },
  Zn: {
    symbol: "Zn",
    name: "Zinc",
    price: null,
    currency: "USD",
    unit: "MT",
    change24h: null,
    updatedAt: null,
    status: "unavailable",
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

/* 7-day and 30-day sample changes for the overview table (Zn unavailable). */
export const marketExtended: Record<
  string,
  { change7d: number | null; change30d: number | null }
> = {
  Cu: { change7d: 2.4, change30d: -1.1 },
  Al: { change7d: -0.9, change30d: 3.2 },
  Ni: { change7d: 1.0, change30d: -6.8 },
  Zn: { change7d: null, change30d: null },
  Au: { change7d: 0.5, change30d: 2.1 },
  Li: { change7d: -3.4, change30d: -8.7 },
}

/*
  Pressure-test sample rows (amendment 14): long label, high price, and a
  double-digit negative move. Clearly indicative sample data, not live.
*/
export const marketPressureRows: MarketRow[] = [
  {
    slug: "rhodium",
    name: "Rhodium",
    symbol: "Rh",
    category: "Precious metals",
    price: 4650,
    currency: "USD",
    unit: "oz",
    change24h: -12.4,
    change7d: -5.1,
    change30d: 18.6,
    updatedAt: SAMPLE_ASOF,
    status: "delayed",
  },
  {
    slug: "ferro-silico-manganese",
    name: "Ferro-silico-manganese (bulk alloy)",
    symbol: "FeSiMn",
    category: "Ferroalloys",
    price: 1180,
    currency: "USD",
    unit: "MT",
    change24h: 0.2,
    change7d: -0.4,
    change30d: 1.1,
    updatedAt: SAMPLE_ASOF,
    status: "delayed",
  },
]
