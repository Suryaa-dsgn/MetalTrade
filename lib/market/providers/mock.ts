import type { MarketProvider } from "@/lib/market/provider"
import { MOCK_FRESHNESS_POLICY } from "@/lib/market/freshness"
import {
  marketExtended,
  marketPressureRows,
  marketQuotes,
} from "@/data/mock/market"
import { buildHistorySet } from "@/lib/market/history"

/*
  Mock market provider (Phase 10). Serves the in-repo sample fixtures behind the
  `MarketProvider` interface — quotes and history only, no catalogue/editorial.
  `source: "mock"` propagates into read metadata so every surface can keep
  labelling values as indicative sample data, never live (amendment 13).

  Async even though the fixtures are local, so the shape matches a real feed.
*/
export const mockMarketProvider: MarketProvider = {
  name: "mock",
  source: "mock",
  freshnessPolicy: MOCK_FRESHNESS_POLICY,

  async getQuotes() {
    return marketQuotes
  },

  async getExtendedChanges() {
    return marketExtended
  },

  async getPressureRows() {
    return marketPressureRows
  },

  async getHistorySet(slug, ranges, anchorPrice) {
    return buildHistorySet(slug, ranges, anchorPrice)
  },
}
