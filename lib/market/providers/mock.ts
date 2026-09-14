import type {
  BenchmarkProvider,
  FetchLatestResult,
  ProviderBenchmarkRequest,
  RawQuote,
} from "@/lib/market/providers/types"
import type { ChartRange, HistoryPoint } from "@/lib/market/types"
import { marketExtended, marketQuotes } from "@/data/mock/market"
import { buildHistorySet } from "@/lib/market/history"

/*
  Sample provider. Implements the same `BenchmarkProvider` contract as the live
  providers, but `sourceType: "sample"` so its values are always labelled
  indicative sample data, never live. Serves the in-repo fixtures keyed by the
  provider symbol on each request (the mock's own symbols: Cu / Au / Li).

  Sample-only extras (7d/30d change, chart history) are exported separately —
  they are not part of the provider contract, only used by the service to
  preserve the current sample table + Copper chart experience.
*/
export const mockBenchmarkProvider: BenchmarkProvider = {
  id: "mock",
  sourceType: "sample",
  capabilities: { latest: true, history: true },
  isConfigured: () => true,

  async getLatest(
    requests: ProviderBenchmarkRequest[]
  ): Promise<FetchLatestResult> {
    const retrievedAt = new Date().toISOString()
    const quotes: Record<string, RawQuote> = {}
    for (const req of requests) {
      const q = marketQuotes[req.providerSymbol]
      if (!q || q.price == null) continue // missing → omitted (partial), never faked
      quotes[req.benchmarkId] = {
        benchmarkId: req.benchmarkId,
        providerSymbol: req.providerSymbol,
        value: q.price,
        providerUnit: q.unit,
        sourceTimestamp: q.updatedAt,
      }
    }
    return { quotes, retrievedAt }
  },
}

export type SampleExtendedChange = {
  change7d: number | null
  change30d: number | null
}

/** Sample 7d/30d change, keyed by mock symbol (Cu/Au/Li). */
export function getSampleExtendedChanges(): Record<string, SampleExtendedChange> {
  return marketExtended
}

/** Deterministic sample history for a slug, anchored to a price. */
export function getSampleHistory(
  slug: string,
  ranges: ChartRange[],
  anchorPrice: number
): Partial<Record<ChartRange, HistoryPoint[]>> {
  return buildHistorySet(slug, ranges, anchorPrice)
}
