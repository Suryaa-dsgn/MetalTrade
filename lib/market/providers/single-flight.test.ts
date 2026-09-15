import { describe, it, expect } from "vitest"
import { coalesce, flightKey } from "@/lib/market/providers/single-flight"

/*
  Sec Phase 3 — single-flight. N equivalent concurrent requests must produce
  exactly ONE execution; different request identities must not share a result.
*/

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe("flightKey", () => {
  it("is order-independent for the same benchmark set", () => {
    const a = flightKey("eia", [
      { benchmarkId: "b1", providerSymbol: "S1" },
      { benchmarkId: "b2", providerSymbol: "S2" },
    ])
    const b = flightKey("eia", [
      { benchmarkId: "b2", providerSymbol: "S2" },
      { benchmarkId: "b1", providerSymbol: "S1" },
    ])
    expect(a).toBe(b)
  })

  it("differs for different providers or different benchmark sets", () => {
    const base = [{ benchmarkId: "b1", providerSymbol: "S1" }]
    expect(flightKey("eia", base)).not.toBe(flightKey("metalsdev", base))
    expect(flightKey("eia", base)).not.toBe(
      flightKey("eia", [{ benchmarkId: "b1", providerSymbol: "S1" }, { benchmarkId: "b2", providerSymbol: "S2" }])
    )
  })
})

describe("coalesce", () => {
  it("collapses N concurrent identical calls into exactly one execution", async () => {
    let calls = 0
    const gate = deferred<string>()
    const fn = () => {
      calls += 1
      return gate.promise
    }

    const p1 = coalesce("k", fn)
    const p2 = coalesce("k", fn)
    const p3 = coalesce("k", fn)
    expect(calls).toBe(1)

    gate.resolve("value")
    const results = await Promise.all([p1, p2, p3])
    expect(results).toEqual(["value", "value", "value"])
    expect(calls).toBe(1)
  })

  it("runs separate executions for different keys", async () => {
    let calls = 0
    const fn = () => {
      calls += 1
      return Promise.resolve(calls)
    }
    await Promise.all([coalesce("a", fn), coalesce("b", fn)])
    expect(calls).toBe(2)
  })

  it("releases the key after settling, so a later call re-executes", async () => {
    let calls = 0
    const fn = () => {
      calls += 1
      return Promise.resolve(calls)
    }
    await coalesce("k", fn)
    await coalesce("k", fn)
    expect(calls).toBe(2)
  })

  it("clears the in-flight entry even when the execution rejects", async () => {
    let calls = 0
    const fn = () => {
      calls += 1
      return Promise.reject(new Error("boom"))
    }
    await expect(coalesce("k", fn)).rejects.toThrow("boom")
    await expect(coalesce("k", fn)).rejects.toThrow("boom")
    expect(calls).toBe(2)
  })
})
