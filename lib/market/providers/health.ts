import type { ProviderId } from "@/lib/market/benchmarks"

/*
  Lightweight provider-health model. Tracks whether a VENDOR API is reachable and
  behaving — deliberately separate from benchmark availability (a healthy
  provider can still omit an individual benchmark). In-memory only; no dashboard,
  alerting, or persistence. A future internal ops view can read this model
  without any provider change.
*/
export type ProviderHealth = {
  provider: ProviderId
  lastAttemptAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  lastFailureCode: string | null
  rateLimited: boolean
  quota?: { limit?: number; used?: number }
}

function blank(provider: ProviderId): ProviderHealth {
  return {
    provider,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureCode: null,
    rateLimited: false,
  }
}

class ProviderHealthStore {
  private map = new Map<ProviderId, ProviderHealth>()

  private ensure(provider: ProviderId): ProviderHealth {
    let h = this.map.get(provider)
    if (!h) {
      h = blank(provider)
      this.map.set(provider, h)
    }
    return h
  }

  recordAttempt(provider: ProviderId, at = new Date().toISOString()): void {
    this.ensure(provider).lastAttemptAt = at
  }

  recordSuccess(
    provider: ProviderId,
    quota?: { limit?: number; used?: number },
    at = new Date().toISOString()
  ): void {
    const h = this.ensure(provider)
    h.lastSuccessAt = at
    h.rateLimited = false
    if (quota) h.quota = quota
  }

  recordFailure(provider: ProviderId, code: string, at = new Date().toISOString()): void {
    const h = this.ensure(provider)
    h.lastFailureAt = at
    h.lastFailureCode = code
    h.rateLimited = code === "rate_limit" || code === "quota"
  }

  get(provider: ProviderId): ProviderHealth {
    return { ...this.ensure(provider) }
  }

  all(): ProviderHealth[] {
    return [...this.map.values()].map((h) => ({ ...h }))
  }
}

export const providerHealth = new ProviderHealthStore()
