import { describe, it, expect } from "vitest"
import { InMemoryMarketObservationRepository } from "@/lib/market/repository/memory"
import type { MarketQuote } from "@/lib/market/types"

function quote(over: Partial<MarketQuote>): MarketQuote {
  return {
    symbol: "XAU",
    name: "Gold",
    price: 4348,
    currency: "USD",
    unit: "oz",
    change24h: null,
    updatedAt: "2026-09-13T23:59:59.000Z",
    status: "eod",
    source: "live",
    retrievedAt: "2026-09-14T10:00:00.000Z",
    ...over,
  }
}

describe("InMemoryMarketObservationRepository", () => {
  it("returns null before anything is saved", async () => {
    const repo = new InMemoryMarketObservationRepository()
    expect(await repo.getLatest("gold-spot")).toBeNull()
    expect(await repo.getLastKnownGood("gold-spot")).toBeNull()
  })

  it("saves and returns latest + last-known-good", async () => {
    const repo = new InMemoryMarketObservationRepository()
    const q = quote({ price: 4400 })
    await repo.saveObservation("gold-spot", q)
    expect((await repo.getLatest("gold-spot"))?.price).toBe(4400)
    expect((await repo.getLastKnownGood("gold-spot"))?.price).toBe(4400)
  })

  it("does NOT overwrite last-known-good with a null-price observation", async () => {
    const repo = new InMemoryMarketObservationRepository()
    await repo.saveObservation("gold-spot", quote({ price: 4400 }))
    await repo.saveObservation("gold-spot", quote({ price: null, status: "unavailable" }))
    // latest reflects the null observation; last-known-good keeps the good one
    expect(await repo.getLatest("gold-spot")).not.toBeNull()
    expect((await repo.getLatest("gold-spot"))?.price).toBeNull()
    expect((await repo.getLastKnownGood("gold-spot"))?.price).toBe(4400)
  })

  it("keeps benchmarks independent", async () => {
    const repo = new InMemoryMarketObservationRepository()
    await repo.saveObservation("gold-spot", quote({ price: 4400 }))
    expect(await repo.getLastKnownGood("copper-lme-3m")).toBeNull()
  })

  it("returns empty history (not persisted yet)", async () => {
    const repo = new InMemoryMarketObservationRepository()
    expect(await repo.getHistory("gold-spot")).toEqual([])
  })
})
