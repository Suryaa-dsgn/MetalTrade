import type { ProviderId } from "@/lib/market/benchmarks"

/*
  Sec Phase 3 — lightweight per-provider circuit breaker.

  Purpose: once a provider is clearly failing (repeated transient errors) or is
  rate-limited / out of quota, stop hammering it. While OPEN we skip the upstream
  call entirely and let the caller serve cached / last-known-good / unavailable.
  After a cooldown a single HALF-OPEN probe is allowed; success closes the breaker,
  failure re-opens it.

  States: closed → open → half-open → (closed | open).

  LIMITATION (documented): state is per process / instance and is NOT shared across
  multiple production instances. Each instance protects the provider independently.
  That is acceptable at this stage; a shared/distributed breaker can be introduced
  later if operational need justifies it.

  Half-open concurrency: only ONE probe is admitted per breaker (a `probing` latch),
  so when the cooldown ends concurrent traffic does not burst the provider — the
  rest are treated as open until the probe resolves.
*/

export type BreakerState = "closed" | "open" | "half-open"

export type CircuitBreakerOptions = {
  /** Consecutive failures that trip a CLOSED breaker OPEN. */
  failureThreshold?: number
  /** How long the breaker stays OPEN before admitting a half-open probe. */
  cooldownMs?: number
  /** Injectable clock for deterministic tests. */
  now?: () => number
}

export class CircuitBreaker {
  private state: BreakerState = "closed"
  private consecutiveFailures = 0
  private openedAt = 0
  private probing = false
  private readonly failureThreshold: number
  private readonly cooldownMs: number
  private readonly now: () => number

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 3
    this.cooldownMs = opts.cooldownMs ?? 60_000
    this.now = opts.now ?? Date.now
  }

  /**
   * Attempt to acquire permission to call upstream. Mutates state on the
   * open→half-open cooldown transition. In half-open, grants the probe to exactly
   * ONE caller (sets `probing`); everyone else is denied until it resolves.
   */
  tryAcquire(): { allowed: boolean; state: BreakerState } {
    if (this.state === "open") {
      if (this.now() - this.openedAt >= this.cooldownMs) {
        this.state = "half-open"
        this.probing = false
      } else {
        return { allowed: false, state: "open" }
      }
    }

    if (this.state === "half-open") {
      if (this.probing) return { allowed: false, state: "half-open" }
      this.probing = true
      return { allowed: true, state: "half-open" }
    }

    return { allowed: true, state: "closed" }
  }

  /** Report a successful upstream call: reset and close. */
  recordSuccess(): void {
    this.consecutiveFailures = 0
    this.probing = false
    this.state = "closed"
  }

  /**
   * Report a failed upstream call. `immediateOpen` (e.g. rate_limit / quota) trips
   * the breaker OPEN at once to protect the provider, regardless of the count. A
   * failed half-open probe also re-opens immediately.
   */
  recordFailure(immediateOpen = false): void {
    this.consecutiveFailures += 1
    const failedProbe = this.state === "half-open"
    this.probing = false
    if (
      immediateOpen ||
      failedProbe ||
      this.consecutiveFailures >= this.failureThreshold
    ) {
      this.state = "open"
      this.openedAt = this.now()
    }
  }

  /** Observed state, reflecting a cooldown-elapsed OPEN as half-open eligible. */
  getState(): BreakerState {
    if (this.state === "open" && this.now() - this.openedAt >= this.cooldownMs) {
      return "half-open"
    }
    return this.state
  }

  /** Test/ops helper. */
  reset(): void {
    this.state = "closed"
    this.consecutiveFailures = 0
    this.openedAt = 0
    this.probing = false
  }
}

// Per-provider breakers, in-memory (per instance). Reset on cold start.
const breakers = new Map<ProviderId, CircuitBreaker>()

export function getCircuitBreaker(id: ProviderId): CircuitBreaker {
  let breaker = breakers.get(id)
  if (!breaker) {
    breaker = new CircuitBreaker()
    breakers.set(id, breaker)
  }
  return breaker
}

/** Test/ops helper — clears every registered breaker. */
export function resetAllBreakers(): void {
  for (const breaker of breakers.values()) breaker.reset()
}
