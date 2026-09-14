import { describe, it, expect, vi, afterEach } from "vitest"

// Configure live routing BEFORE importing the service chain (env parses at load).
process.env.MARKET_PROVIDER = "metalpriceapi"
process.env.METALPRICE_API_KEY = "test-key"

// Mock ONLY the live provider adapter; the mock/sample provider and content
// source stay real so we exercise true mixed-source composition.
vi.mock("@/lib/market/providers/metalpriceapi", () => ({
  metalpriceApiProvider: { id: "metalpriceapi", fetchQuotes: vi.fn() },
}))

import type { FetchQuotesResult } from "@/lib/market/providers/types"

function goldResult(value = 4348.21): FetchQuotesResult {
  return {
    quotes: {
      XAU: {
        providerSymbol: "XAU",
        value,
        providerUnit: "oz",
        sourceTimestamp: "2026-09-13T23:59:59.000Z",
      },
    },
    retrievedAt: "2026-09-14T10:00:00.000Z",
  }
}

// Fresh module graph per test → fresh in-memory cache. Re-import the mock handle
// from the same fresh registry so it is the instance the service uses.
async function freshService() {
  vi.resetModules()
  const { metalpriceApiProvider } = await import(
    "@/lib/market/providers/metalpriceapi"
  )
  const fetchQuotes = metalpriceApiProvider.fetchQuotes as unknown as ReturnType<
    typeof vi.fn
  >
  const svc = await import("@/lib/market/service")
  return { svc, fetchQuotes }
}

afterEach(() => {
  vi.useRealTimers()
})

describe("market service (mixed source)", () => {
  it("live failure with a cold cache renders gold unavailable + degraded", async () => {
    const { svc, fetchQuotes } = await freshService()
    fetchQuotes.mockRejectedValue({ code: "network" })
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.price).toBeNull()
    expect(gold.source).toBe("unavailable")
    expect(meta.degraded).toBe(true)
  })

  it("live success: gold live, copper/lithium sample, rest unavailable", async () => {
    const { svc, fetchQuotes } = await freshService()
    fetchQuotes.mockResolvedValue(goldResult())
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.source).toBe("live")
    expect(gold.price).toBeCloseTo(4348.21, 2)
    expect(gold.unit).toBe("oz")
    expect(gold.updatedAt).toBe("2026-09-13T23:59:59.000Z")
    expect(gold.retrievedAt).toBe("2026-09-14T10:00:00.000Z")

    const copper = data.find((r) => r.slug === "copper")!
    expect(copper.source).toBe("sample")
    expect(copper.price).toBe(8420) // labelled sample, unchanged
    expect(copper.unit).toBe("MT")
    expect(copper.change7d).not.toBeNull() // sample keeps multi-day change
    expect(gold.change7d).toBeNull() // live gold has none on Free

    const lithium = data.find((r) => r.slug === "lithium")!
    expect(lithium.source).toBe("sample")

    const manganese = data.find((r) => r.slug === "manganese")!
    expect(manganese.source).toBe("unavailable")
    expect(manganese.price).toBeNull()

    expect(meta.degraded).toBe(false)
    expect(meta.source).toBe("live")
  })

  it("after TTL, a live failure serves last-known-good marked degraded", async () => {
    const { svc, fetchQuotes } = await freshService()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-14T10:00:00.000Z"))
    fetchQuotes.mockResolvedValue(goldResult(4400))
    await svc.getMarketTable() // warms cache + last-known-good at t0

    // Advance beyond the 3h TTL and fail the next fetch.
    vi.setSystemTime(new Date("2026-09-14T14:30:00.000Z"))
    fetchQuotes.mockRejectedValue({ code: "quota" })
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(meta.degraded).toBe(true)
    expect(gold.price).toBeCloseTo(4400, 2) // last-known-good, not zero/mock/fabricated
    expect(gold.source).toBe("live")
  })

  it("mock mode (no live provider) labels everything sample/unavailable", async () => {
    process.env.MARKET_PROVIDER = "mock"
    const { svc, fetchQuotes } = await freshService()
    fetchQuotes.mockClear() // ignore historical calls; assert THIS run makes none
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.source).toBe("sample") // falls back to labelled sample, never "live"
    expect(fetchQuotes).not.toHaveBeenCalled() // no live call in mock mode
    expect(meta.source).toBe("mock")

    process.env.MARKET_PROVIDER = "metalpriceapi" // restore for any later tests
  })
})
