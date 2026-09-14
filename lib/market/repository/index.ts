import type { MarketObservationRepository } from "@/lib/market/repository/types"
import { InMemoryMarketObservationRepository } from "@/lib/market/repository/memory"

/*
  Repository seam. The service asks for the repository through this factory and
  depends only on the interface. To move to durable storage later, construct the
  durable implementation here (selected by config) — nothing else changes.
*/
let instance: MarketObservationRepository | null = null

export function getObservationRepository(): MarketObservationRepository {
  if (!instance) instance = new InMemoryMarketObservationRepository()
  return instance
}

export type { MarketObservationRepository } from "@/lib/market/repository/types"
