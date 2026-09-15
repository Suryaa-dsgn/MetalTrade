import { describe, it, expect } from "vitest"
import { InMemoryFixedWindowRateLimiter } from "@/lib/security/rate-limiter"

/*
  Sec Phase 4 — in-memory fixed-window limiter (defense in depth). Deterministic
  via an injected clock.
*/

function makeClock(start = 0) {
  let t = start
  return { now: () => t, advance: (ms: number) => (t += ms) }
}

describe("InMemoryFixedWindowRateLimiter", () => {
  it("allows up to the limit, then blocks within the window", () => {
    const clock = makeClock()
    const rl = new InMemoryFixedWindowRateLimiter({ limit: 3, windowMs: 1000, now: clock.now })
    expect(rl.check("k").allowed).toBe(true)
    expect(rl.check("k").allowed).toBe(true)
    const third = rl.check("k")
    expect(third.allowed).toBe(true)
    expect(third.remaining).toBe(0)
    expect(rl.check("k").allowed).toBe(false) // 4th exceeds
  })

  it("resets after the window elapses", () => {
    const clock = makeClock()
    const rl = new InMemoryFixedWindowRateLimiter({ limit: 1, windowMs: 1000, now: clock.now })
    expect(rl.check("k").allowed).toBe(true)
    expect(rl.check("k").allowed).toBe(false)
    clock.advance(1000)
    expect(rl.check("k").allowed).toBe(true) // new window
  })

  it("tracks keys independently", () => {
    const clock = makeClock()
    const rl = new InMemoryFixedWindowRateLimiter({ limit: 1, windowMs: 1000, now: clock.now })
    expect(rl.check("a").allowed).toBe(true)
    expect(rl.check("b").allowed).toBe(true) // different key, own budget
    expect(rl.check("a").allowed).toBe(false)
  })

  it("reports the window reset time", () => {
    const clock = makeClock(5000)
    const rl = new InMemoryFixedWindowRateLimiter({ limit: 1, windowMs: 2000, now: clock.now })
    expect(rl.check("k").resetAt).toBe(7000)
  })
})
