import type { ProviderId } from "@/lib/market/benchmarks"

/*
  Contract for a benchmark provider (live OR sample). Deliberately narrow and
  provider-agnostic: a provider is handed REQUESTS ({benchmarkId, providerSymbol})
  and returns RAW values keyed by benchmarkId. It never sees the BenchmarkConfig
  or any application/business semantics — the registry owns those. benchmarkId is
  the safe correlation key for partial-response handling and debugging.

  Unit conversion, sanity checks, provenance, and mapping to MarketQuote all
  happen in the registry-aware normalization layer, so vendor specifics
  (endpoints, symbols, auth, parsing, error mapping) stay inside the adapter and a
  second provider can be added without touching pages or the service's shape.
*/

/** What the service asks a provider for: a stable id + the provider's own symbol. */
export type ProviderBenchmarkRequest = {
  benchmarkId: string
  providerSymbol: string
}

/** A single raw quote exactly as the provider denominates it, tagged with the
 *  benchmarkId it answers (never inferred downstream). */
export type RawQuote = {
  benchmarkId: string
  providerSymbol: string
  /** Price in the provider's native currency per `providerUnit`. */
  value: number
  /** The unit the vendor value is in (e.g. "oz", "t"). */
  providerUnit: string
  /** Provider as-of time (ISO 8601 UTC), or null if the vendor omitted it. */
  sourceTimestamp: string | null
}

/** Safe, enumerated provider failure categories (no raw vendor strings leak). */
export type ProviderErrorCode =
  | "auth"
  | "rate_limit"
  | "quota"
  | "paid_gated"
  | "bad_request"
  | "not_found"
  | "timeout"
  | "network"
  | "malformed"
  // 5xx from the vendor: a transient server-side failure, distinct from an
  // unmapped "unknown", so the retry policy can target it precisely.
  | "server_error"
  | "unknown"

export class ProviderError extends Error {
  readonly code: ProviderErrorCode
  /** Vendor numeric status, kept for server logs only (never shown to clients). */
  readonly providerStatus?: number
  constructor(code: ProviderErrorCode, message: string, providerStatus?: number) {
    super(message)
    this.name = "ProviderError"
    this.code = code
    this.providerStatus = providerStatus
  }
}

export type FetchLatestResult = {
  /** Raw quotes keyed by benchmarkId. A benchmark the vendor omitted is simply
   *  absent — the caller resolves it per its own fallback policy (partial
   *  responses are first-class, never a whole-batch failure). */
  quotes: Record<string, RawQuote>
  /** When our server fetched (ISO 8601 UTC). */
  retrievedAt: string
  /** Quota headers when the vendor exposes them (for observability/health). */
  quota?: { limit?: number; used?: number }
}

/** Declared capabilities — checked before use, so we never call an unsupported
 *  method or rely on a thrown "not supported". */
export type ProviderCapabilityFlags = {
  latest: boolean
  history: boolean
}

export interface BenchmarkProvider {
  readonly id: ProviderId
  /** Whether values from this provider are real or indicative sample data. */
  readonly sourceType: "live" | "sample"
  readonly capabilities: ProviderCapabilityFlags
  /** True when the provider has everything it needs to run (e.g. an API key).
   *  The service skips an unconfigured provider and falls back, rather than
   *  making a doomed call. */
  isConfigured(): boolean
  /** Fetch raw quotes for the given requests. Throws `ProviderError` (typed) on a
   *  whole-request failure; never returns fabricated or zero values. */
  getLatest(requests: ProviderBenchmarkRequest[]): Promise<FetchLatestResult>
  // getHistory is added with the history-routing phase (registry historyProvider).
}
