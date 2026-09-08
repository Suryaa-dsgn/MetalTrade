import type { MarketQuote } from "@/lib/market/types"

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
