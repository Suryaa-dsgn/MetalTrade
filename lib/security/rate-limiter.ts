/*
  Sec Phase 4 — application-level rate limiter (defense in depth).

  IMPORTANT: this in-memory limiter is NOT distributed production rate limiting.
  Its counters live in one process and are lost on restart and unshared across
  instances, so under horizontal scaling each instance limits independently. It
  exists for:
    - defense in depth (a cheap first barrier in front of an expensive action),
    - local / single-instance operation,
    - deterministic testing,
    - a clean seam a future durable/distributed limiter can implement.

  The authoritative, distributed rate limiting for production must be provided by
  the hosting/edge layer (see docs/security-production-readiness.md). Its accuracy
  also depends on a trustworthy client identity, which only the edge can guarantee
  (see lib/security/client-identity.ts).
*/

export type RateLimitDecision = {
  allowed: boolean
  limit: number
  remaining: number
  /** Epoch ms when the current window resets. */
  resetAt: number
}

export interface RateLimiter {
  check(key: string): RateLimitDecision
}

export type FixedWindowOptions = {
  /** Max allowed events per window. */
  limit: number
  /** Window length in ms. */
  windowMs: number
  /** Injectable clock for tests. */
  now?: () => number
}

/**
 * Fixed-window counter. Simple and predictable; adequate as a defense-in-depth
 * barrier. Not a token bucket and not distributed.
 */
export class InMemoryFixedWindowRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>()
  private readonly limit: number
  private readonly windowMs: number
  private readonly now: () => number

  constructor(opts: FixedWindowOptions) {
    this.limit = opts.limit
    this.windowMs = opts.windowMs
    this.now = opts.now ?? Date.now
  }

  check(key: string): RateLimitDecision {
    const nowMs = this.now()
    const existing = this.buckets.get(key)

    if (!existing || nowMs >= existing.resetAt) {
      const resetAt = nowMs + this.windowMs
      this.buckets.set(key, { count: 1, resetAt })
      return { allowed: true, limit: this.limit, remaining: this.limit - 1, resetAt }
    }

    existing.count += 1
    const allowed = existing.count <= this.limit
    return {
      allowed,
      limit: this.limit,
      remaining: Math.max(0, this.limit - existing.count),
      resetAt: existing.resetAt,
    }
  }

  /** Test/ops helper. */
  reset(): void {
    this.buckets.clear()
  }
}

// Enquiry submission is the one write path today (the priority endpoint). A
// generous cap for a human, tight enough to blunt a naive single-source flood.
export const enquiryRateLimiter = new InMemoryFixedWindowRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
})
