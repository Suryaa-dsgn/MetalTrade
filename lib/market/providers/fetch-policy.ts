import type { ProviderId } from "@/lib/market/benchmarks"

/*
  Sec Phase 3 — provider-aware minimum fetch interval.

  The L1 cache TTL doubles as a MIN fetch interval: within it, repeated site
  requests are served from cache and never reach the provider, so an attacker
  reloading /markets cannot force upstream calls or exhaust quota. The interval is
  per-provider so it respects each feed's real cadence and never re-fetches data
  that cannot have changed:

    - eia          Brent RBRTE is a DAILY series → 6h is ample.
    - metalpriceapi Gold is EOD / delayed          → 3h.
    - metalsdev    near-real-time feed             → 1h (headroom for a future,
                                                    more frequent display use).
    - mock         sample data                     → 3h (arbitrary; no upstream).

  Intentionally never shorter than a feed's update frequency.
*/
const MIN_FETCH_INTERVAL_MS: Partial<Record<ProviderId, number>> = {
  metalpriceapi: 3 * 60 * 60 * 1000,
  eia: 6 * 60 * 60 * 1000,
  metalsdev: 60 * 60 * 1000,
  mock: 3 * 60 * 60 * 1000,
}

const DEFAULT_MIN_FETCH_INTERVAL_MS = 3 * 60 * 60 * 1000

export function minFetchIntervalMs(id: ProviderId): number {
  return MIN_FETCH_INTERVAL_MS[id] ?? DEFAULT_MIN_FETCH_INTERVAL_MS
}
