import { describe, it, expect, vi, afterEach } from "vitest"

// Key present so the live provider is "configured"; registry mode by default.
process.env.METALPRICE_API_KEY = "test-key"
delete process.env.MARKET_PROVIDER

// Mock ONLY the live provider adapter; the sample provider and content source
// stay real so we exercise true mixed-source composition + partial responses.
vi.mock("@/lib/market/providers/metalpriceapi", () => ({
  metalpriceApiProvider: {
    id: "metalpriceapi",
    sourceType: "live",
    capabilities: { latest: true, history: false },
    isConfigured: () => true,
    getLatest: vi.fn(),
  },
}))

import { metalpriceApiProvider } from "@/lib/market/providers/metalpriceapi"
import type { FetchLatestResult } from "@/lib/market/providers/types"

const getLatest = metalpriceApiProvider.getLatest as unknown as ReturnType<typeof vi.fn>

function goldResult(value = 4348.21): FetchLatestResult {
  return {
    quotes: {
      "gold-spot": {
        benchmarkId: "gold-spot",
        providerSymbol: "XAU",
        value,
        providerUnit: "oz",
        sourceTimestamp: "2026-09-13T23:59:59.000Z",
      },
    },
    retrievedAt: "2026-09-14T10:00:00.000Z",
  }
}

async function freshService() {
  vi.resetModules()
  return import("@/lib/market/service")
}

afterEach(() => {
  vi.useRealTimers()
  delete process.env.MARKET_PROVIDER
})

describe("market service (registry-driven mixed source)", () => {
  it("live failure with a cold cache → gold unavailable + degraded; sample rows intact", async () => {
    getLatest.mockRejectedValue({ code: "network" })
    const svc = await freshService()
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.price).toBeNull()
    expect(gold.source).toBe("unavailable")
    // one provider failing while another (sample) stays healthy:
    const copper = data.find((r) => r.slug === "copper")!
    expect(copper.source).toBe("sample")
    expect(copper.price).toBe(8420)
    expect(meta.degraded).toBe(true)
  })

  it("multiple providers succeed: gold live, copper/lithium sample, rest unavailable", async () => {
    getLatest.mockResolvedValue(goldResult())
    const svc = await freshService()
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.source).toBe("live")
    expect(gold.price).toBeCloseTo(4348.21, 2)
    expect(gold.unit).toBe("oz")
    expect(gold.change7d).toBeNull()

    const copper = data.find((r) => r.slug === "copper")!
    expect(copper.source).toBe("sample")
    expect(copper.change7d).not.toBeNull()

    expect(data.find((r) => r.slug === "lithium")!.source).toBe("sample")
    expect(data.find((r) => r.slug === "manganese")!.source).toBe("unavailable")

    expect(meta.degraded).toBe(false)
    expect(meta.source).toBe("live")
  })

  it("partial response: provider healthy but omits gold → its fallback, others fine", async () => {
    // Healthy provider, empty quotes (gold omitted). Cold cache → unavailable.
    getLatest.mockResolvedValue({ quotes: {}, retrievedAt: "2026-09-14T10:00:00.000Z" })
    const svc = await freshService()
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.source).toBe("unavailable")
    expect(meta.degraded).toBe(true)
    expect(data.find((r) => r.slug === "copper")!.source).toBe("sample")
  })

  it("after TTL, a live failure serves last-known-good marked degraded", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-14T10:00:00.000Z"))
    getLatest.mockResolvedValue(goldResult(4400))
    const svc = await freshService()
    await svc.getMarketTable() // warms last-known-good

    vi.setSystemTime(new Date("2026-09-14T14:30:00.000Z")) // > 3h TTL
    getLatest.mockRejectedValue({ code: "quota" })
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(meta.degraded).toBe(true)
    expect(gold.price).toBeCloseTo(4400, 2) // last-known-good, not zero/mock/fabricated
    expect(gold.source).toBe("live")
  })

  it("mock/demo mode: everything sample/unavailable; no live call", async () => {
    process.env.MARKET_PROVIDER = "mock"
    getLatest.mockClear()
    const svc = await freshService()
    const { data, meta } = await svc.getMarketTable()

    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.source).toBe("sample") // demo → labelled sample, never "live"
    expect(getLatest).not.toHaveBeenCalled()
    expect(meta.source).toBe("mock")
  })

  it("provider health is separate from benchmark availability", async () => {
    // Healthy provider (getLatest resolves) that omits the gold benchmark.
    getLatest.mockResolvedValue({ quotes: {}, retrievedAt: "2026-09-14T10:00:00.000Z" })
    const svc = await freshService()
    const { data } = await svc.getMarketTable()
    const { providerHealth } = await import("@/lib/market/providers/health")

    // Provider is HEALTHY (a success was recorded)...
    expect(providerHealth.get("metalpriceapi").lastSuccessAt).not.toBeNull()
    // ...even though the individual benchmark is UNAVAILABLE.
    expect(data.find((r) => r.slug === "gold")!.source).toBe("unavailable")
  })

  it("production never silently substitutes mock for a failed live benchmark", async () => {
    const prev = process.env.NODE_ENV
    // @ts-expect-error test override
    process.env.NODE_ENV = "production"
    getLatest.mockRejectedValue({ code: "network" })
    const svc = await freshService()
    const { data } = await svc.getMarketTable()
    const gold = data.find((r) => r.slug === "gold")!
    expect(gold.source).not.toBe("sample")
    expect(gold.source).toBe("unavailable")
    // @ts-expect-error restore
    process.env.NODE_ENV = prev
  })
})
