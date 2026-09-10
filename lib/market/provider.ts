import type {
  ChartRange,
  HistoryPoint,
  MarketQuote,
  MarketRow,
} from "@/lib/market/types"
import type { FreshnessPolicy } from "@/lib/market/freshness"
import type { MarketSource } from "@/lib/market/meta"

/*
  Market data provider (Phase 10, amendment 6). Owns QUOTES and HISTORY only —
  never catalogue/editorial content (that is `ContentSource`). The market service
  composes a provider with the content source; a real feed implements this same
  interface and is selected via MARKET_PROVIDER.

  A provider declares its own `freshnessPolicy`, so staleness is evaluated per
  feed rather than against one global threshold (amendment 2).
*/
export type ExtendedChange = {
  change7d: number | null
  change30d: number | null
}

export interface MarketProvider {
  readonly name: string
  readonly source: MarketSource
  readonly freshnessPolicy: FreshnessPolicy
  /** Current quotes keyed by symbol. */
  getQuotes(): Promise<Record<string, MarketQuote>>
  /** 7d / 30d change keyed by symbol (overview table). */
  getExtendedChanges(): Promise<Record<string, ExtendedChange>>
  /** Standalone overview rows not tied to the editorial catalogue. */
  getPressureRows(): Promise<MarketRow[]>
  /** Historical series per range, anchored to a current price. */
  getHistorySet(
    slug: string,
    ranges: ChartRange[],
    anchorPrice: number
  ): Promise<Partial<Record<ChartRange, HistoryPoint[]>>>
}
