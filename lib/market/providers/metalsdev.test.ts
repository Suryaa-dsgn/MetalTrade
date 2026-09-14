import { describe, it, expect, vi, afterEach } from "vitest"
import { ProviderError } from "@/lib/market/providers/types"

const KEY = "test-metalsdev-key"
process.env.METALS_DEV_API_KEY = KEY

function fakeResponse(opts: { ok?: boolean; status?: number; json: unknown }) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: { get: () => null },
    json: async () => opts.json,
  } as unknown as Response
}

// Trimmed REAL payload captured from the live probe (2026-09-14, Free tier).
const LATEST = {
  status: "success",
  currency: "USD",
  unit: "mt",
  metals: {
    copper: 14048.6825,
    lead: 1870.1,
    zinc: 3771.7,
    lme_copper: 14233,
    lme_lead: 1897,
    lme_zinc: 3872,
  },
  timestamps: { metal: "2026-09-14T14:58:04.061Z", currency: "2026-09-14T14:57:08.240Z" },
}

const COPPER = { benchmarkId: "copper-lme-3m", providerSymbol: "lme_copper" }
const LEAD = { benchmarkId: "lead-lme-3m", providerSymbol: "lme_lead" }
const ZINC = { benchmarkId: "zinc-lme-3m", providerSymbol: "lme_zinc" }

async function importAdapter() {
  return (await import("@/lib/market/providers/metalsdev")).metalsDevProvider
}

afterEach(() => vi.unstubAllGlobals())

describe("metalsDevProvider.getLatest", () => {
  it("is configured with a key and declares no history capability", async () => {
    const p = await importAdapter()
    expect(p.isConfigured()).toBe(true)
    expect(p.sourceType).toBe("live")
    expect(p.capabilities).toEqual({ latest: true, history: false })
  })

  it("parses LME 3M values as USD per metric tonne, keyed by benchmarkId", async () => {
    const fetchMock = vi.fn(async () => fakeResponse({ json: LATEST }))
    vi.stubGlobal("fetch", fetchMock)
    const p = await importAdapter()
    const res = await p.getLatest([COPPER, LEAD, ZINC])

    expect(res.quotes["copper-lme-3m"].value).toBe(14233)
    expect(res.quotes["copper-lme-3m"].providerUnit).toBe("MT")
    expect(res.quotes["copper-lme-3m"].sourceTimestamp).toBe("2026-09-14T14:58:04.061Z")
    expect(res.quotes["lead-lme-3m"].value).toBe(1897)
    expect(res.quotes["zinc-lme-3m"].value).toBe(3872)

    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toContain("/latest?currency=USD&unit=mt")
    expect(url).toContain("api_key=")
  })

  it("does not confuse spot with LME (uses the lme_* symbol requested)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ json: LATEST })))
    const p = await importAdapter()
    const res = await p.getLatest([COPPER])
    // 14233 is lme_copper, NOT spot copper (14048.68)
    expect(res.quotes["copper-lme-3m"].value).toBe(14233)
    expect(res.quotes["copper-lme-3m"].value).not.toBe(14048.6825)
  })

  it("omits a benchmark the vendor did not return (partial response)", async () => {
    const partial = { ...LATEST, metals: { lme_copper: 14233 } }
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ json: partial })))
    const p = await importAdapter()
    const res = await p.getLatest([COPPER, LEAD, ZINC])
    expect(res.quotes["copper-lme-3m"]).toBeDefined()
    expect(res.quotes["lead-lme-3m"]).toBeUndefined()
    expect(res.quotes["zinc-lme-3m"]).toBeUndefined()
  })

  it("rejects a schema-invalid body (Zod) as malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ json: { status: "success", metals: { lme_copper: "x" } } }))
    )
    const p = await importAdapter()
    await expect(p.getLatest([COPPER])).rejects.toMatchObject({ code: "malformed" })
  })

  it("maps HTTP 401 to auth and 429 to rate_limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ ok: false, status: 401, json: { status: "error" } })))
    let p = await importAdapter()
    await expect(p.getLatest([COPPER])).rejects.toMatchObject({ code: "auth" })
    await expect(p.getLatest([COPPER])).rejects.toBeInstanceOf(ProviderError)

    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ ok: false, status: 429, json: { status: "error" } })))
    p = await importAdapter()
    await expect(p.getLatest([COPPER])).rejects.toMatchObject({ code: "rate_limit" })
  })

  it("maps abort to timeout and transport failure to network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      const e = new Error("aborted"); e.name = "AbortError"; throw e
    }))
    let p = await importAdapter()
    await expect(p.getLatest([COPPER])).rejects.toMatchObject({ code: "timeout" })

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNRESET") }))
    p = await importAdapter()
    await expect(p.getLatest([COPPER])).rejects.toMatchObject({ code: "network" })
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
