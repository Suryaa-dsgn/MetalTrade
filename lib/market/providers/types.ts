import type { ProviderId } from "@/lib/market/benchmarks"

/*
  Contract for a LIVE benchmark provider. Deliberately narrow and provider-
  agnostic: a provider returns RAW values (as the vendor denominates them) plus
  the source timestamp; unit conversion, sanity checks, provenance, and mapping
  to the app's MarketQuote all happen in the registry-aware normalization layer.
  That keeps vendor specifics (endpoints, symbols, auth, parsing, error mapping)
  inside the adapter and lets a second provider be added without touching pages.

  This is separate from the existing `MarketProvider` (the mock/sample contract),
  because live sourcing is registry-routed per commodity rather than "one
  provider returns everything".
*/

/** A single raw quote exactly as the provider denominates it. */
export type RawQuote = {
  providerSymbol: string
  /** Price in USD per `providerUnit`, as returned by the vendor. */
  value: number
  /** The unit the vendor value is in (e.g. "oz"). Never inferred downstream. */
  providerUnit: string
  /** Provider as-of time (ISO 8601 UTC), or null if the vendor omitted it. */
  sourceTimestamp: string | null
}

/** Safe, enumerated provider failure categories (no raw vendor strings leak). */
export type ProviderErrorCode =
  | "auth" // bad/missing key
  | "rate_limit" // too many requests
  | "quota" // monthly quota exhausted
  | "paid_gated" // instrument requires a higher plan
  | "bad_request" // invalid parameters
  | "not_found" // no data for the request
  | "timeout" // request exceeded our deadline
  | "network" // transport failure
  | "malformed" // unparseable/unexpected response
  | "unknown"

export class ProviderError extends Error {
  readonly code: ProviderErrorCode
  /** Vendor numeric status, kept for server logs only (never shown to clients). */
  readonly providerStatus?: number
  constructor(
    code: ProviderErrorCode,
    message: string,
    providerStatus?: number
  ) {
    super(message)
    this.name = "ProviderError"
    this.code = code
    this.providerStatus = providerStatus
  }
}

export type FetchQuotesResult = {
  quotes: Record<string, RawQuote> // keyed by providerSymbol
  /** When our server fetched (ISO 8601 UTC). */
  retrievedAt: string
  /** Quota headers when the vendor exposes them (for observability). */
  quota?: { limit?: number; used?: number }
}

export interface BenchmarkProvider {
  readonly id: ProviderId
  /**
   * Fetch raw quotes for the given provider symbols. Throws `ProviderError`
   * (typed) on failure; never returns fabricated or zero values. Symbols the
   * vendor omits are simply absent from the result map.
   */
  fetchQuotes(symbols: string[]): Promise<FetchQuotesResult>
}
