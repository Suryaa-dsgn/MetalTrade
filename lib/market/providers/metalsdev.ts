import "server-only"

import { z } from "zod"

import { serverConfig } from "@/lib/config/env"
import { logger } from "@/lib/observability/logger"
import type {
  BenchmarkProvider,
  FetchLatestResult,
  ProviderBenchmarkRequest,
  ProviderErrorCode,
  RawQuote,
} from "@/lib/market/providers/types"
import { ProviderError } from "@/lib/market/providers/types"

/*
  Metals.Dev live provider adapter. Owns everything vendor-specific: endpoint,
  auth, symbol denomination, response VALIDATION (Zod), parsing, timestamp
  extraction, and error mapping. Receives {benchmarkId, providerSymbol} requests
  and returns RAW quotes keyed by benchmarkId; normalization converts/sanity-
  checks and maps to MarketQuote.

  VERIFIED CONTRACT (live probe 2026-09-14, Free tier)
  - Base: https://api.metals.dev/v1 ; auth: `api_key` query param (server-side
    only; the URL is never logged).
  - GET /latest?currency=USD&unit=mt → {
      status:"success", currency:"USD", unit:"mt",
      metals:{ ..., lme_copper:14233, lme_lead:1897, lme_zinc:3872, copper:14048.68, ... },
      currencies:{...}, timestamps:{ metal:"2026-09-14T14:58:04.061Z", currency:"..." } }
  - Industrial metals are returned per METRIC TONNE (unit "mt") in USD — no
    conversion needed. LME 3M benchmarks are the `lme_*` keys (distinct from the
    spot keys). Free tier includes LME data.
  - Precious metals only in /timeseries (unit toz) → NO industrial/LME history.
*/

const BASE_URL = "https://api.metals.dev/v1"
const REQUEST_TIMEOUT_MS = 8_000

/** Vendor `unit` value → our canonical MassUnit label. Only verified units. */
const UNIT_MAP: Record<string, string> = {
  mt: "MT",
  kg: "kg",
  g: "g",
  toz: "oz",
  lb: "lb",
}

const LatestSchema = z.object({
  status: z.string(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  metals: z.record(z.string(), z.number()).optional(),
  timestamps: z
    .object({ metal: z.string().optional(), currency: z.string().optional() })
    .optional(),
  error_message: z.string().optional(),
})
type Latest = z.infer<typeof LatestSchema>

function mapErrorCode(status: number): ProviderErrorCode {
  switch (status) {
    case 401:
    case 403:
      return "auth"
    case 429:
      return "rate_limit"
    case 402:
      return "quota"
    case 400:
    case 422:
      return "bad_request"
    case 404:
      return "not_found"
  }
  if (status >= 400 && status < 500) return "bad_request"
  if (status >= 500) return "server_error" // transient; eligible for one retry
  return "unknown"
}

async function getLatestPayload(url: string): Promise<Latest> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 6 }, // near-real-time feed; reference benchmark
    })
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError"
    throw new ProviderError(
      aborted ? "timeout" : "network",
      aborted ? "request timed out" : "network error"
    )
  } finally {
    clearTimeout(timer)
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new ProviderError("malformed", "unparseable response", res.status)
  }

  const parsed = LatestSchema.safeParse(json)
  if (!parsed.success) {
    throw new ProviderError("malformed", "unexpected response shape", res.status)
  }
  const body = parsed.data

  if (!res.ok || body.status !== "success") {
    throw new ProviderError(mapErrorCode(res.status), "provider request failed", res.status)
  }
  return body
}

export const metalsDevProvider: BenchmarkProvider = {
  id: "metalsdev",
  sourceType: "live",
  capabilities: { latest: true, history: false }, // industrial history not available

  isConfigured() {
    return !!serverConfig.metalsDevApiKey
  },

  async getLatest(
    requests: ProviderBenchmarkRequest[]
  ): Promise<FetchLatestResult> {
    const retrievedAt = new Date().toISOString()
    const reqs = requests.filter((r) => r.providerSymbol)
    if (reqs.length === 0) return { quotes: {}, retrievedAt }

    const apiKey = serverConfig.metalsDevApiKey
    if (!apiKey) throw new ProviderError("auth", "METALS_DEV_API_KEY is not set")

    // One /latest call returns every metal; the key stays out of logs.
    const url = `${BASE_URL}/latest?currency=USD&unit=mt&api_key=${encodeURIComponent(apiKey)}`
    const body = await getLatestPayload(url)

    const metals = body.metals ?? {}
    const providerUnit = UNIT_MAP[body.unit ?? "mt"] ?? "" // "" → normalization refuses
    const sourceTimestamp = body.timestamps?.metal ?? null
    const quotes: Record<string, RawQuote> = {}

    for (const req of reqs) {
      const value = metals[req.providerSymbol]
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        continue // missing/implausible → omitted (partial), rendered unavailable
      }
      quotes[req.benchmarkId] = {
        benchmarkId: req.benchmarkId,
        providerSymbol: req.providerSymbol,
        value,
        providerUnit,
        sourceTimestamp,
      }
    }

    logger.info("market.provider.fetch_ok", {
      provider: "metalsdev",
      requested: reqs.length,
      returned: Object.keys(quotes).length,
      unit: body.unit,
      sourceTimestamp,
    })

    return { quotes, retrievedAt }
  },
}
