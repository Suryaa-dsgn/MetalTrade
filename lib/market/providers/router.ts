import "server-only"

import type { BenchmarkProvider } from "@/lib/market/providers/types"
import type { ProviderId } from "@/lib/market/benchmarks"
import { metalpriceApiProvider } from "@/lib/market/providers/metalpriceapi"
import { mockBenchmarkProvider } from "@/lib/market/providers/mock"

/*
  Provider router. Maps a ProviderId (from the BenchmarkRegistry) to its adapter,
  so the service and pages never instantiate providers directly. Fails safe: an
  unknown or not-yet-integrated provider resolves to null, and the caller falls
  the affected benchmarks back to their fallback policy rather than throwing.

  Metals.Dev and EIA are assigned in the registry but intentionally absent here
  until each is researched, implemented, and verified.
*/
const PROVIDERS: Partial<Record<ProviderId, BenchmarkProvider>> = {
  metalpriceapi: metalpriceApiProvider,
  mock: mockBenchmarkProvider,
}

export function getProvider(id: ProviderId): BenchmarkProvider | null {
  return PROVIDERS[id] ?? null
}

export function isProviderImplemented(id: ProviderId): boolean {
  return Boolean(PROVIDERS[id])
}
