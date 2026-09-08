import type { MarketRow, MetalSummary } from "@/lib/market/types"
import { metals } from "@/data/mock/metals"
import {
  marketExtended,
  marketPressureRows,
  marketQuotes,
} from "@/data/mock/market"

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

/** True mock flag so the UI can label data as sample rather than live. */
export const MARKET_DATA_IS_SAMPLE = true
