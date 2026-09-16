/*
  Backend Phase 2E-2 — pure retry backoff policy. Exponential with FULL jitter,
  bounded by a cap. Deterministic under an injected `random` (tests). This phase only
  COMPUTES next_attempt_at and persists it as data for a future drain slice — there is
  no scheduler here.

  Full jitter: delay ∈ [0, min(cap, base · factor^(attempt-1))). Jitter spreads
  re-attempts across instances so a recovered provider is not thundered.
*/

export const MAX_ATTEMPTS = 6

export type BackoffOptions = {
  baseMs?: number
  factor?: number
  capMs?: number
  /** Injectable RNG in [0,1); defaults to Math.random. */
  random?: () => number
}

const DEFAULTS = {
  baseMs: 60_000, // 1 minute
  factor: 2,
  capMs: 3_600_000, // 1 hour
} as const

/** The upper bound (pre-jitter) for a given attempt number (1-based). */
export function backoffCeilingMs(failedAttempt: number, opts: BackoffOptions = {}): number {
  const base = opts.baseMs ?? DEFAULTS.baseMs
  const factor = opts.factor ?? DEFAULTS.factor
  const cap = opts.capMs ?? DEFAULTS.capMs
  const exp = Math.max(0, failedAttempt - 1)
  return Math.min(cap, base * Math.pow(factor, exp))
}

/** Jittered delay in ms for the attempt that just failed (1-based). */
export function backoffDelayMs(failedAttempt: number, opts: BackoffOptions = {}): number {
  const rand = opts.random ?? Math.random
  return Math.floor(rand() * backoffCeilingMs(failedAttempt, opts))
}

/** ISO timestamp for the next attempt after `failedAttempt` failed, relative to `now`. */
export function nextAttemptAt(
  now: Date,
  failedAttempt: number,
  opts: BackoffOptions = {}
): string {
  return new Date(now.getTime() + backoffDelayMs(failedAttempt, opts)).toISOString()
}
