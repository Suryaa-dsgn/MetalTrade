import { describe, it, expect, vi, afterEach } from "vitest"

/*
  Live EIA Brent history in the market service: per-range window mapping (30D/90D/1Y),
  a separate cache per range, last-known-good on failure, and — critically — that a
  history failure never removes the latest price from the crude detail. The Resend/EIA
  SDK/network is mocked (stubbed fetch); CI never hits a live account.
*/

const KEY = "test-eia-key"
process.env.EIA_API_KEY = KEY

function fakeResponse(opts: { ok?: boolean; status?: number; json: unknown }) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: { get: () => null },
    json: async () => opts.json,
  } as unknown as Response
}

const RBRTE_LATEST = {
  response: {
    data: [{ period: "2026-09-15", series: "RBRTE", value: "130.80", units: "$/BBL" }],
  },
}
const RBRTE_HISTORY = {
  response: {
    data: [
      { period: "2026-09-11", series: "RBRTE", value: "108.20", units: "$/BBL" },
      { period: "2026-09-14", series: "RBRTE", value: "129.90", units: "$/BBL" },
      { period: "2026-09-15", series: "RBRTE", value: "130.80", units: "$/BBL" },
    ],
  },
}

const NOW = new Date("2026-09-17T12:00:00.000Z")
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const DAY = 24 * 60 * 60 * 1000

async function freshService(fetchImpl: (url: string) => Promise<Response>) {
  vi.resetModules()
  const calls: string[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url)
      return fetchImpl(url)
    })
  )
  const svc = await import("@/lib/market/service")
  return { svc, calls }
}

afterEach(() => vi.unstubAllGlobals())

describe("getBenchmarkHistory — window mapping (30D / 90D / 1Y)", () => {
  const cases: Array<["1M" | "3M" | "1Y", number]> = [
    ["1M", 30],
    ["3M", 90],
    ["1Y", 365],
  ]
  for (const [range, days] of cases) {
    it(`${range} queries a ${days}-day window ending today`, async () => {
      const { svc, calls } = await freshService(async () => fakeResponse({ json: RBRTE_HISTORY }))
      const res = await svc.getBenchmarkHistory("crude-oil", range, NOW)
      expect(res?.points).toHaveLength(3)
      expect(res?.unit).toBe("bbl")
      const url = calls[0]
      expect(url).toContain(`end=${ymd(NOW.getTime())}`)
      expect(url).toContain(`start=${ymd(NOW.getTime() - days * DAY)}`)
      // ascending
      expect(res!.points.map((p) => p.value)).toEqual([108.2, 129.9, 130.8])
    })
  }
})

describe("getBenchmarkHistory — caching + resilience", () => {
  it("caches per range and never collides across ranges", async () => {
    const { svc, calls } = await freshService(async () => fakeResponse({ json: RBRTE_HISTORY }))
    await svc.getBenchmarkHistory("crude-oil", "1M", NOW)
    await svc.getBenchmarkHistory("crude-oil", "1M", NOW) // within TTL → cache hit
    await svc.getBenchmarkHistory("crude-oil", "3M", NOW) // separate key → fetch
    const historyFetches = calls.filter((u) => u.includes("start="))
    expect(historyFetches).toHaveLength(2) // 1M once + 3M once (no collision, no refetch)
  })

  it("returns empty points on failure with no cache (never sample/fabricated)", async () => {
    const { svc } = await freshService(async () => fakeResponse({ ok: false, status: 500, json: {} }))
    const res = await svc.getBenchmarkHistory("crude-oil", "1M", NOW)
    expect(res).toEqual({ points: [], unit: "bbl" })
  })

  it("serves last-known-good when a later refresh fails", async () => {
    let fail = false
    const { svc } = await freshService(async () =>
      fail ? fakeResponse({ ok: false, status: 500, json: {} }) : fakeResponse({ json: RBRTE_HISTORY })
    )
    const first = await svc.getBenchmarkHistory("crude-oil", "1M", NOW)
    expect(first?.points).toHaveLength(3)
    fail = true
    const later = new Date(NOW.getTime() + 7 * 60 * 60 * 1000) // past the 6h min-fetch interval
    const res = await svc.getBenchmarkHistory("crude-oil", "1M", later)
    expect(res?.points).toHaveLength(3) // last-known-good, not empty
  })

  it("returns null for a non-live-history benchmark (caller may use sample)", async () => {
    const { svc } = await freshService(async () => fakeResponse({ json: RBRTE_HISTORY }))
    expect(await svc.getBenchmarkHistory("gold", "1M", NOW)).toBeNull() // historyCapable:false
    expect(await svc.getBenchmarkHistory("copper", "1M", NOW)).toBeNull() // routing:sample
  })

  it("returns empty on a history TIMEOUT and makes exactly one bounded retry", async () => {
    const { svc, calls } = await freshService(async () => {
      const e = new Error("aborted")
      e.name = "AbortError" // → ProviderError("timeout"), which is retryable
      throw e
    })
    const res = await svc.getBenchmarkHistory("crude-oil", "3M", NOW)
    expect(res).toEqual({ points: [], unit: "bbl" })
    // one bounded retry ⇒ two attempts, not more
    expect(calls.filter((u) => u.includes("start=")).length).toBe(2)
  })
})

describe("getMetalDetail — latest and history are independent", () => {
  const routing = (histImpl: () => Promise<Response>) => async (url: string) => {
    if (url.includes("api.eia.gov") && url.includes("start=")) return histImpl()
    if (url.includes("api.eia.gov")) return fakeResponse({ json: RBRTE_LATEST })
    return fakeResponse({ ok: false, status: 403, json: {} }) // metalpriceapi etc. → unavailable
  }

  it("keeps the live latest price when history fails; chart unavailable, commodity NOT downgraded", async () => {
    const { svc } = await freshService(routing(async () => fakeResponse({ ok: false, status: 500, json: {} })))
    const { data } = await svc.getMetalDetail("crude-oil")
    expect(data).not.toBeNull()
    expect(data!.detail.provider).toContain("U.S. Energy Information Administration")
    expect(Object.keys(data!.historySet)).toHaveLength(0) // chart unavailable
  })

  it("keeps the latest crude price when history TIMES OUT (chart unavailable only)", async () => {
    const { svc } = await freshService(
      routing(async () => {
        const e = new Error("aborted")
        e.name = "AbortError"
        throw e
      })
    )
    const { data } = await svc.getMetalDetail("crude-oil")
    expect(data).not.toBeNull()
    expect(data!.detail.provider).toContain("U.S. Energy Information Administration")
    expect(Object.keys(data!.historySet)).toHaveLength(0) // chart unavailable, latest kept
  })

  it("wires real EIA history into the crude chart across all ranges (ascending)", async () => {
    const { svc } = await freshService(routing(async () => fakeResponse({ json: RBRTE_HISTORY })))
    const { data } = await svc.getMetalDetail("crude-oil")
    expect(data).not.toBeNull()
    for (const r of ["1M", "3M", "1Y"] as const) {
      expect(data!.historySet[r]).toHaveLength(3)
      expect(data!.historySet[r]!.map((p) => p.value)).toEqual([108.2, 129.9, 130.8])
    }
  })
})
