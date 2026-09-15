import type { ProviderBenchmarkRequest } from "@/lib/market/providers/types"

/*
  Sec Phase 3 — request coalescing (single-flight).

  Provider amplification protection: when many site requests miss the cache at the
  same instant, they must collapse into ONE upstream provider call whose result is
  shared, instead of N calls that burn quota. Concurrent callers with the same key
  await the same in-flight promise; once it settles the key is released, so a later
  (non-overlapping) call starts a fresh flight.

  The key must capture the provider request IDENTITY precisely so two semantically
  different benchmark sets never share a result. `flightKey` canonicalizes the set
  (sorted benchmarkId:providerSymbol pairs) — order-independent, but sensitive to
  which benchmarks are requested.
*/

const inFlight = new Map<string, Promise<unknown>>()

/** Canonical key for a provider + its requested benchmark set (order-independent). */
export function flightKey(
  providerId: string,
  requests: ProviderBenchmarkRequest[]
): string {
  const signature = requests
    .map((r) => `${r.benchmarkId}:${r.providerSymbol}`)
    .sort()
    .join(",")
  return `${providerId}|${signature}`
}

/**
 * Run `fn` under `key`, coalescing concurrent callers onto a single execution.
 * The in-flight entry is cleared when the promise settles (success or failure),
 * so this de-duplicates concurrency without caching results itself.
 */
export function coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const run = (async () => {
    try {
      return await fn()
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, run)
  return run
}

/** Number of in-flight entries (tests/observability). */
export function inFlightCount(): number {
  return inFlight.size
}
