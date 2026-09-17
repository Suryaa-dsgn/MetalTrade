import { describe, it, expect, vi, afterEach } from "vitest"
import { ProviderError } from "@/lib/market/providers/types"

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

// Trimmed REAL payload captured from the live probe (2026-09-15). value is a STRING.
const RBRTE_LATEST = {
  response: {
    total: 9974,
    dateFormat: "YYYY-MM-DD",
    frequency: "daily",
    data: [
      { period: "2026-09-09", series: "RBRTE", value: "109.51", units: "$/BBL" },
      { period: "2026-09-08", series: "RBRTE", value: "106.12", units: "$/BBL" },
    ],
  },
}

const BRENT = { benchmarkId: "brent-crude", providerSymbol: "RBRTE" }

async function importAdapter() {
  return (await import("@/lib/market/providers/eia")).eiaProvider
}

afterEach(() => vi.unstubAllGlobals())

describe("eiaProvider.getLatest", () => {
  it("is configured with a key; latest capability", async () => {
    const p = await importAdapter()
    expect(p.isConfigured()).toBe(true)
    expect(p.sourceType).toBe("live")
    expect(p.capabilities.latest).toBe(true)
  })

  it("parses the latest RBRTE row: string value → number, $/BBL → bbl, period → ISO", async () => {
    const fetchMock = vi.fn(async () => fakeResponse({ json: RBRTE_LATEST }))
    vi.stubGlobal("fetch", fetchMock)
    const p = await importAdapter()
    const res = await p.getLatest([BRENT])

    const q = res.quotes["brent-crude"]
    expect(q.value).toBe(109.51) // newest row (desc), parsed from the string "109.51"
    expect(q.providerUnit).toBe("bbl")
    expect(q.sourceTimestamp).toBe("2026-09-09T00:00:00.000Z")

    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toContain("/petroleum/pri/spt/data/")
    expect(url).toContain("facets%5Bseries%5D%5B%5D=RBRTE")
  })

  it("treats empty data (bogus/omitted series) as unavailable, not an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ json: { response: { total: 0, data: [] } } }))
    )
    const p = await importAdapter()
    const res = await p.getLatest([BRENT])
    expect(res.quotes["brent-crude"]).toBeUndefined()
  })

  it("maps invalid auth (HTTP 403) to an auth error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ ok: false, status: 403, json: {} })))
    const p = await importAdapter()
    await expect(p.getLatest([BRENT])).rejects.toMatchObject({ code: "auth" })
    await expect(p.getLatest([BRENT])).rejects.toBeInstanceOf(ProviderError)
  })

  it("maps HTTP 429 to rate_limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ ok: false, status: 429, json: {} })))
    const p = await importAdapter()
    await expect(p.getLatest([BRENT])).rejects.toMatchObject({ code: "rate_limit" })
  })

  it("rejects an unparseable body as malformed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, status: 200, headers: { get: () => null },
      json: async () => { throw new Error("bad json") },
    })))
    const p = await importAdapter()
    await expect(p.getLatest([BRENT])).rejects.toMatchObject({ code: "malformed" })
  })

  it("maps abort to timeout and transport failure to network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { const e = new Error("a"); e.name = "AbortError"; throw e }))
    let p = await importAdapter()
    await expect(p.getLatest([BRENT])).rejects.toMatchObject({ code: "timeout" })

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNRESET") }))
    p = await importAdapter()
    await expect(p.getLatest([BRENT])).rejects.toMatchObject({ code: "network" })
  })

  it("short-circuits with no network call for an empty request list", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const p = await importAdapter()
    const res = await p.getLatest([])
    expect(res.quotes).toEqual({})
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// Ascending RBRTE history, trimmed from the verified contract shape.
const RBRTE_HISTORY = {
  response: {
    total: 3,
    dateFormat: "YYYY-MM-DD",
    frequency: "daily",
    data: [
      { period: "2026-09-11", series: "RBRTE", value: "108.20", units: "$/BBL" },
      { period: "2026-09-14", series: "RBRTE", value: "129.90", units: "$/BBL" },
      { period: "2026-09-15", series: "RBRTE", value: "130.80", units: "$/BBL" },
    ],
  },
}
const HISTORY_REQ = {
  benchmarkId: "brent-crude",
  providerSymbol: "RBRTE",
  startDate: "2026-08-16",
  endDate: "2026-09-15",
}

describe("eiaProvider.getHistory", () => {
  it("declares the history capability", async () => {
    const p = await importAdapter()
    expect(p.capabilities.history).toBe(true)
    expect(typeof p.getHistory).toBe("function")
  })

  it("builds a daily RBRTE query with start/end and ascending sort", async () => {
    const fetchMock = vi.fn(async () => fakeResponse({ json: RBRTE_HISTORY }))
    vi.stubGlobal("fetch", fetchMock)
    const p = await importAdapter()
    await p.getHistory!(HISTORY_REQ)
    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toContain("frequency=daily")
    expect(url).toContain("facets%5Bseries%5D%5B%5D=RBRTE")
    expect(url).toContain("start=2026-08-16")
    expect(url).toContain("end=2026-09-15")
    expect(url).toContain("sort%5B0%5D%5Bdirection%5D=asc")
  })

  it("parses ascending points (string value → number, $/BBL, period → ISO)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ json: RBRTE_HISTORY })))
    const p = await importAdapter()
    const res = await p.getHistory!(HISTORY_REQ)
    expect(res.unit).toBe("bbl")
    expect(res.points).toHaveLength(3)
    expect(res.points.map((pt) => pt.value)).toEqual([108.2, 129.9, 130.8])
    // strictly ascending timestamps
    const ts = res.points.map((pt) => Date.parse(pt.timestamp))
    expect(ts).toEqual([...ts].sort((a, b) => a - b))
    expect(res.points[2].timestamp).toBe("2026-09-15T00:00:00.000Z")
  })

  it("re-sorts to ascending even if the vendor returns rows out of order", async () => {
    const shuffled = {
      response: {
        data: [
          { period: "2026-09-15", series: "RBRTE", value: "130.80", units: "$/BBL" },
          { period: "2026-09-11", series: "RBRTE", value: "108.20", units: "$/BBL" },
        ],
      },
    }
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ json: shuffled })))
    const p = await importAdapter()
    const res = await p.getHistory!(HISTORY_REQ)
    expect(res.points.map((pt) => pt.value)).toEqual([108.2, 130.8])
  })

  it("skips malformed rows (wrong series, non-bbl unit, null/NaN value, bad date)", async () => {
    const messy = {
      response: {
        data: [
          { period: "2026-09-10", series: "RBRTE", value: "100.00", units: "$/BBL" }, // ok
          { period: "2026-09-11", series: "WTI", value: "70.00", units: "$/BBL" }, // wrong series
          { period: "2026-09-12", series: "RBRTE", value: "88.00", units: "$/GAL" }, // wrong unit
          { period: "2026-09-13", series: "RBRTE", value: null, units: "$/BBL" }, // null value
          { period: "2026-09-14", series: "RBRTE", value: "abc", units: "$/BBL" }, // NaN
          { period: "not-a-date", series: "RBRTE", value: "99.00", units: "$/BBL" }, // bad date
          { period: "2026-09-16", series: "RBRTE", value: "-5", units: "$/BBL" }, // non-positive
        ],
      },
    }
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ json: messy })))
    const p = await importAdapter()
    const res = await p.getHistory!(HISTORY_REQ)
    expect(res.points).toHaveLength(1)
    expect(res.points[0].value).toBe(100)
  })

  it("returns an empty series for an empty response (no fabrication)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ json: { response: { total: 0, data: [] } } }))
    )
    const p = await importAdapter()
    const res = await p.getHistory!(HISTORY_REQ)
    expect(res.points).toEqual([])
  })

  it("propagates a provider auth error (does not fabricate history)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ ok: false, status: 403, json: {} })))
    const p = await importAdapter()
    await expect(p.getHistory!(HISTORY_REQ)).rejects.toMatchObject({ code: "auth" })
  })
})
