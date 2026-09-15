import { describe, it, expect } from "vitest"
import { CircuitBreaker } from "@/lib/market/providers/circuit-breaker"

/*
  Sec Phase 3 — circuit breaker state machine. Deterministic via an injected clock.
*/

function makeClock(start = 0) {
  let t = start
  return { now: () => t, advance: (ms: number) => (t += ms) }
}

describe("CircuitBreaker", () => {
  it("stays closed until the consecutive-failure threshold, then opens", () => {
    const clock = makeClock()
    const b = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000, now: clock.now })
    expect(b.tryAcquire().allowed).toBe(true)
    b.recordFailure()
    b.recordFailure()
    expect(b.getState()).toBe("closed")
    b.recordFailure() // third → open
    expect(b.getState()).toBe("open")
    expect(b.tryAcquire().allowed).toBe(false)
  })

  it("opens immediately on a quota/rate-limit failure", () => {
    const clock = makeClock()
    const b = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 1000, now: clock.now })
    b.recordFailure(true) // immediateOpen
    expect(b.getState()).toBe("open")
    expect(b.tryAcquire().allowed).toBe(false)
  })

  it("admits a single half-open probe after cooldown; concurrent callers are denied", () => {
    const clock = makeClock()
    const b = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: clock.now })
    b.recordFailure() // open
    expect(b.tryAcquire().allowed).toBe(false)

    clock.advance(1000) // cooldown elapsed
    const first = b.tryAcquire()
    expect(first).toEqual({ allowed: true, state: "half-open" })
    // A second concurrent caller during the probe is denied (no burst).
    expect(b.tryAcquire().allowed).toBe(false)
    expect(b.tryAcquire().allowed).toBe(false)
  })

  it("closes on a successful half-open probe", () => {
    const clock = makeClock()
    const b = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: clock.now })
    b.recordFailure()
    clock.advance(1000)
    expect(b.tryAcquire().allowed).toBe(true) // probe
    b.recordSuccess()
    expect(b.getState()).toBe("closed")
    expect(b.tryAcquire().allowed).toBe(true)
  })

  it("re-opens on a failed half-open probe and restarts the cooldown", () => {
    const clock = makeClock()
    const b = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: clock.now })
    b.recordFailure()
    clock.advance(1000)
    expect(b.tryAcquire().allowed).toBe(true) // probe
    b.recordFailure() // probe fails → re-open
    expect(b.getState()).toBe("open")
    expect(b.tryAcquire().allowed).toBe(false)
    clock.advance(1000)
    expect(b.tryAcquire().allowed).toBe(true) // fresh probe after new cooldown
  })

  it("resets consecutive failures on any success", () => {
    const clock = makeClock()
    const b = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000, now: clock.now })
    b.recordFailure()
    b.recordFailure()
    b.recordSuccess() // reset
    b.recordFailure()
    b.recordFailure()
    expect(b.getState()).toBe("closed") // only 2 since reset
  })
})
