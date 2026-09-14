/*
  Read metadata (Phase 10, amendment 3). A small, formal object returned
  alongside every market read instead of scattering an ad-hoc `providerError`
  boolean onto data shapes. Only a SAFE, enumerated error code is exposed — raw
  provider errors never reach the client.
*/

/** Safe, client-exposable error codes (never a raw provider message). */
export type MarketErrorCode = "provider_unavailable"

export type MarketSource = "mock" | "live"

/** Compact attribution shown in the UI (label + optional link). Populated from
 *  the registry attribution of the live benchmarks in a read — so provider/
 *  source acknowledgment (e.g. EIA) lives in the data layer, not in components. */
export type SourceAttribution = { label: string; url?: string }

export type ReadMeta = {
  /** Selected provider name (e.g. "mock"). */
  provider: string
  /** Whether values are sample/mock or a live feed — drives sample labelling. */
  source: MarketSource
  /** When the read resolved (ISO 8601 UTC). */
  fetchedAt: string
  /** True when serving degraded/last-known data after a provider failure. */
  degraded: boolean
  /** Present only when degraded; a safe enum, not a raw error. */
  errorCode?: MarketErrorCode
  /** Distinct attributions of the live benchmarks in this read (for a compact
   *  "Source: …" line). Empty when nothing live is displayed. */
  sources?: SourceAttribution[]
}

export function okMeta(provider: string, source: MarketSource): ReadMeta {
  return { provider, source, fetchedAt: new Date().toISOString(), degraded: false }
}

export function degradedMeta(
  provider: string,
  source: MarketSource,
  errorCode: MarketErrorCode = "provider_unavailable"
): ReadMeta {
  return {
    provider,
    source,
    fetchedAt: new Date().toISOString(),
    degraded: true,
    errorCode,
  }
}
