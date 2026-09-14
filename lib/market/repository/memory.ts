import type { HistoryPoint, MarketQuote } from "@/lib/market/types"
import type { MarketObservationRepository } from "@/lib/market/repository/types"

/*
  In-memory MarketObservationRepository. Per server instance; last-known-good
  does NOT survive a cold start (documented limitation — no database by design).
  A durable implementation swaps in behind the same interface via the factory in
  ./index without service changes.
*/
export class InMemoryMarketObservationRepository
  implements MarketObservationRepository
{
  private latest = new Map<string, MarketQuote>()
  private lastGood = new Map<string, MarketQuote>()

  async saveObservation(benchmarkId: string, quote: MarketQuote): Promise<void> {
    this.latest.set(benchmarkId, quote)
    if (quote.price != null) this.lastGood.set(benchmarkId, quote)
  }

  async getLatest(benchmarkId: string): Promise<MarketQuote | null> {
    return this.latest.get(benchmarkId) ?? null
  }

  async getLastKnownGood(benchmarkId: string): Promise<MarketQuote | null> {
    return this.lastGood.get(benchmarkId) ?? null
  }

  async getHistory(benchmarkId: string): Promise<HistoryPoint[]> {
    void benchmarkId // not persisted yet; durable impl + history phase populate this
    return []
  }
}
