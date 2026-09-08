import type { MetalSummary } from "@/lib/market/types"
import { metals } from "@/data/mock/metals"
import { marketQuotes } from "@/data/mock/market"

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

/** True mock flag so the UI can label data as sample rather than live. */
export const MARKET_DATA_IS_SAMPLE = true
