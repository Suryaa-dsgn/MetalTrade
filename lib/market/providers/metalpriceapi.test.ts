import { describe, it, expect, vi, afterEach } from "vitest"
import { ProviderError } from "@/lib/market/providers/types"

// Set the key BEFORE importing the adapter chain (env.ts parses at import).
const KEY = "test-key-abc123"
process.env.METALPRICE_API_KEY = KEY

type FakeInit = { headers: Record<string, string>; signal?: AbortSignal }

function fakeResponse(opts: {
  ok?: boolean
  status?: number
  json: unknown
  headers?: Record<string, string>
}) {
  const headers = opts.headers ?? {}
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => opts.json,
  } as unknown as Response
}

// Real captured Gold payload (probe 2026-09-14, Free tier).
const GOLD_LATEST = {
  success: true,
  base: "USD",
  timestamp: 1789343999, // 2026-09-13T23:59:59Z
  rates: { USDXAU: 4348.2098637401, XAU: 0.0002299797 },
}

async function importAdapter() {
  return (await import("@/lib/market/providers/metalpriceapi")).metalpriceApiProvider
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("metalpriceApiProvider.fetchQuotes", () => {
  it("parses a live latest payload, extracts timestamp, keeps the key out of the URL", async () => {
    const fetchMock = vi.fn(async () =>
      fakeResponse({
        json: GOLD_LATEST,
        headers: { "x-api-quota": "100", "x-api-current": "5" },
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    const provider = await importAdapter()
    const res = await provider.fetchQuotes(["XAU"])

    expect(res.quotes.XAU.value).toBeCloseTo(4348.2098637401)
    expect(res.quotes.XAU.providerUnit).toBe("oz")
    expect(res.quotes.XAU.sourceTimestamp).toBe("2026-09-13T23:59:59.000Z")
    expect(res.quota).toEqual({ limit: 100, used: 5 })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, FakeInit]
    expect(url).toContain("/latest?base=USD&currencies=XAU")
    expect(url).not.toContain(KEY) // key never in the URL
    expect(init.headers["X-API-KEY"]).toBe(KEY) // header auth
  })

  it("short-circuits with no network call for an empty symbol list", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const provider = await importAdapter()
    const res = await provider.fetchQuotes([])
    expect(res.quotes).toEqual({})
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps a paid-gated response (HTTP 200 + success:false 416) to ProviderError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        fakeResponse({
          json: {
            success: false,
            error: { statusCode: 416, message: "XCU query requires a paid plan." },
          },
        })
      )
    )
    const provider = await importAdapter()
    await expect(provider.fetchQuotes(["XCU"])).rejects.toMatchObject({
      code: "paid_gated",
    })
    await expect(provider.fetchQuotes(["XCU"])).rejects.toBeInstanceOf(ProviderError)
  })

  it("maps an invalid-key response to an auth error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        fakeResponse({
          json: { success: false, error: { statusCode: 101, message: "no key" } },
        })
      )
    )
    const provider = await importAdapter()
    await expect(provider.fetchQuotes(["XAU"])).rejects.toMatchObject({ code: "auth" })
  })

  it("omits a symbol the provider did not return (no fabrication)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ json: GOLD_LATEST }))
    )
    const provider = await importAdapter()
    const res = await provider.fetchQuotes(["XAU", "XCU"])
    expect(res.quotes.XAU).toBeDefined()
    expect(res.quotes.XCU).toBeUndefined()
  })

  it("treats an unparseable body as a malformed error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => {
          throw new Error("bad json")
        },
      }))
    )
    const provider = await importAdapter()
    await expect(provider.fetchQuotes(["XAU"])).rejects.toMatchObject({
      code: "malformed",
    })
  })

  it("maps an aborted request to a timeout error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const e = new Error("aborted")
        e.name = "AbortError"
        throw e
      })
    )
    const provider = await importAdapter()
    await expect(provider.fetchQuotes(["XAU"])).rejects.toMatchObject({
      code: "timeout",
    })
  })

  it("maps a transport failure to a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET")
      })
    )
    const provider = await importAdapter()
    await expect(provider.fetchQuotes(["XAU"])).rejects.toMatchObject({
      code: "network",
    })
  })
})
