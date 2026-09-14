import type { MarketStatus } from "@/lib/market/types"

/*
  Freshness policy (Phase 10, amendment 2). Staleness is NOT a single global
  constant — each provider/feed declares its own policy, so a real-time feed, an
  intentionally delayed feed, and an end-of-day feed each evaluate correctly.

  `evaluateFreshness` maps a quote's `updatedAt` against the policy:
    - no timestamp        -> "unavailable"
    - older than staleAfter -> "stale"      (attention, not alarm)
    - otherwise            -> the feed's own mode (live / delayed / eod)
*/

export type FeedMode = "live" | "delayed" | "eod"

export type FreshnessPolicy = {
  mode: FeedMode
  /** A quote older than this (from `updatedAt`) is downgraded to "stale". */
  staleAfterMs: number
  /** Intentional feed delay, informational (e.g. exchange-delayed feeds). */
  delayMs?: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Convenience presets; a provider may also supply an ad-hoc policy. */
export const FRESHNESS_PRESETS = {
  realtime: { mode: "live", staleAfterMs: 5 * MINUTE } satisfies FreshnessPolicy,
  delayed15m: {
    mode: "delayed",
    staleAfterMs: 90 * MINUTE,
    delayMs: 15 * MINUTE,
  } satisfies FreshnessPolicy,
  endOfDay: { mode: "eod", staleAfterMs: 36 * HOUR } satisfies FreshnessPolicy,
  // Daily official series (e.g. EIA Brent) that legitimately publishes a few days
  // behind — reads as a delayed daily benchmark, not stale, over normal lag.
  dailyBenchmark: {
    mode: "delayed",
    staleAfterMs: 14 * DAY,
  } satisfies FreshnessPolicy,
} as const

/**
 * Freshness for the fixed development sample. The mock fixture uses a pinned
 * `updatedAt`, so the window is deliberately wide (30 days) to keep it reading
 * as a delayed sample rather than flipping to stale as the wall clock advances.
 * This is a MOCK policy; a real feed uses minutes, not days.
 */
export const MOCK_FRESHNESS_POLICY: FreshnessPolicy = {
  mode: "delayed",
  staleAfterMs: 30 * DAY,
}

export function evaluateFreshness(
  updatedAt: string | null,
  policy: FreshnessPolicy,
  now: number = Date.now()
): MarketStatus {
  if (!updatedAt) return "unavailable"
  const ts = Date.parse(updatedAt)
  if (Number.isNaN(ts)) return "unavailable"
  if (now - ts > policy.staleAfterMs) return "stale"
  return policy.mode
}
