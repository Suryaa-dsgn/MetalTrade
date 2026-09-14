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
