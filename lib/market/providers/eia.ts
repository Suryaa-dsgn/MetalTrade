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
  U.S. EIA (Energy Information Administration) live provider adapter.

  VERIFIED CONTRACT (live probe 2026-09-15)
  - Base: https://api.eia.gov/v2/petroleum/pri/spt/data/ ; auth: `api_key` QUERY
    param (EIA requires the key in the URL). SECURITY: the URL is NEVER logged and
    never appears in errors (only safe enum codes leave the adapter).
  - Query: frequency=daily, data[0]=value, facets[series][]=RBRTE, sort period
    desc, length N → latest first.
  - Response: { response: { total, dateFormat, frequency, data: [ { period:
    "2026-09-09", series:"RBRTE", value:"109.51" (STRING), units:"$/BBL", … } ] } }.
  - Brent = series RBRTE (Europe Brent Spot Price FOB), USD per BARREL (volume,
    not mass). Daily; the latest observation may legitimately lag a few days.
  - Empty/bogus series → HTTP 200, total 0, empty data (→ partial/unavailable).

  EIA data is public-domain U.S. Government data; attribution is rendered from
  EIA_ATTRIBUTION. History (deep RBRTE daily series) is available and could be
  added through this same contract; the Crude chart UI is deferred.
*/

const BASE_URL = "https://api.eia.gov/v2/petroleum/pri/spt/data/"
const REQUEST_TIMEOUT_MS = 8_000

const RowSchema = z.object({
  period: z.string(),
  series: z.string().optional(),
  value: z.union([z.number(), z.string(), z.null()]).optional(),
  units: z.string().optional(),
})
const ResponseSchema = z.object({
  response: z
    .object({
      total: z.union([z.number(), z.string()]).optional(),
      data: z.array(RowSchema).optional(),
    })
    .optional(),
})
type EiaResponse = z.infer<typeof ResponseSchema>

function mapErrorCode(status: number): ProviderErrorCode {
  switch (status) {
    case 401:
    case 403:
      return "auth"
    case 429:
      return "rate_limit"
    case 400:
    case 422:
      return "bad_request"
    case 404:
      return "not_found"
  }
  if (status >= 400 && status < 500) return "bad_request"
  return "unknown"
}

/** EIA units string → our canonical unit. Only verified units; "" is refused. */
function unitFrom(units: string | undefined): string {
  if (units && /bbl/i.test(units)) return "bbl"
  return ""
}

function toIsoDate(period: string): string | null {
  // Daily periods are date-only "YYYY-MM-DD"; anchor at UTC midnight.
  const d = new Date(`${period}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function buildUrl(symbols: string[], apiKey: string): string {
  const sp = new URLSearchParams()
  sp.set("frequency", "daily")
  sp.append("data[0]", "value")
  for (const s of symbols) sp.append("facets[series][]", s)
  sp.set("sort[0][column]", "period")
  sp.set("sort[0][direction]", "desc")
  sp.set("length", String(Math.max(5, symbols.length * 3)))
  sp.set("api_key", apiKey)
  return `${BASE_URL}?${sp.toString()}`
}

async function getPayload(url: string): Promise<EiaResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 12 }, // daily data — fetch at most twice a day
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

  if (!res.ok) {
    // Never include the URL/query (it carries the key) in the error.
    throw new ProviderError(mapErrorCode(res.status), "provider request failed", res.status)
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new ProviderError("malformed", "unparseable response", res.status)
  }
  const parsed = ResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new ProviderError("malformed", "unexpected response shape", res.status)
  }
  return parsed.data
}

export const eiaProvider: BenchmarkProvider = {
  id: "eia",
  sourceType: "live",
  // History (RBRTE daily series) is available and can be added through this same
  // contract when the Crude chart experience is built; not fetched yet.
  capabilities: { latest: true, history: false },

  isConfigured() {
    return !!serverConfig.eiaApiKey
  },

  async getLatest(
    requests: ProviderBenchmarkRequest[]
  ): Promise<FetchLatestResult> {
    const retrievedAt = new Date().toISOString()
    const reqs = requests.filter((r) => r.providerSymbol)
    if (reqs.length === 0) return { quotes: {}, retrievedAt }

    const apiKey = serverConfig.eiaApiKey
    if (!apiKey) throw new ProviderError("auth", "EIA_API_KEY is not set")

    const symbols = [...new Set(reqs.map((r) => r.providerSymbol))]
    const body = await getPayload(buildUrl(symbols, apiKey))
    const rows = body.response?.data ?? []

    // Rows arrive newest-first; the FIRST row per series is its latest observation.
    const latestBySeries = new Map<string, (typeof rows)[number]>()
    for (const row of rows) {
      if (row.series && !latestBySeries.has(row.series)) latestBySeries.set(row.series, row)
    }

    const quotes: Record<string, RawQuote> = {}
    for (const req of reqs) {
      const row = latestBySeries.get(req.providerSymbol)
      if (!row) continue // empty/omitted → partial, rendered unavailable
      const value = typeof row.value === "string" ? Number(row.value) : row.value
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue
      quotes[req.benchmarkId] = {
        benchmarkId: req.benchmarkId,
        providerSymbol: req.providerSymbol,
        value,
        providerUnit: unitFrom(row.units), // "" → normalization refuses (no guess)
        sourceTimestamp: toIsoDate(row.period),
      }
    }

    logger.info("market.provider.fetch_ok", {
      provider: "eia",
      requested: reqs.length,
      returned: Object.keys(quotes).length,
    })

    return { quotes, retrievedAt }
  },
}
