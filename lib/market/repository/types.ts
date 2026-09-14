import type { HistoryPoint, MarketQuote } from "@/lib/market/types"

/*
  Persistence seam for market observations, keyed by benchmarkId. The market
  service depends on THIS interface, never on a concrete store, so durable
  storage (Postgres, Redis, …) can replace the in-memory implementation without
  touching the service or the UI. No database is introduced now — the default
  implementation is in-memory.

  Deliberately storage-agnostic: no SQL, no client types leak here.
*/
export interface MarketObservationRepository {
  /** Record a normalized observation for a benchmark. Implementations keep the
   *  most recent observation and the most recent GOOD (non-null) one. */
  saveObservation(benchmarkId: string, quote: MarketQuote): Promise<void>
  /** The most recent observation (good or not), or null if none. */
  getLatest(benchmarkId: string): Promise<MarketQuote | null>
  /** The most recent observation with a usable price — the fallback source when
   *  a fresh fetch fails. Null if we have never seen a good value. */
  getLastKnownGood(benchmarkId: string): Promise<MarketQuote | null>
  /** Historical observations for a benchmark. Not persisted yet (returns []);
   *  the durable implementation + history-routing phase populate this. */
  getHistory(benchmarkId: string): Promise<HistoryPoint[]>
}
