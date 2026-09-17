import "server-only"

import { z } from "zod"

import { serverConfig } from "@/lib/config/env"
import { logger } from "@/lib/observability/logger"
import type {
  BenchmarkProvider,
  FetchLatestResult,
  ProviderBenchmarkRequest,
  ProviderErrorCode,
  ProviderHistoryRequest,
  ProviderHistoryResult,
  RawQuote,
} from "@/lib/market/providers/types"
import { ProviderError } from "@/lib/market/providers/types"
import type { HistoryPoint } from "@/lib/market/types"

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
// Latest-quote request timeout (unchanged; the latest path is fast + tiny).
export const REQUEST_TIMEOUT_MS = 8_000
// History requests pull a larger daily series (up to ~260 rows for 1Y) and are
// consistently slower than the latest quote, so they get their OWN, longer timeout.
// Specific to EIA history — no other provider/path is affected.
export const HISTORY_REQUEST_TIMEOUT_MS = 15_000

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
  if (status >= 500) return "server_error" // transient; eligible for one retry
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

// Upper bound on rows for a daily series over up to ~1Y (≈260 trading days). One
// page is enough; EIA caps `length` at 5000.
const HISTORY_MAX_ROWS = 500

function buildHistoryUrl(
  symbol: string,
  apiKey: string,
  startDate: string,
  endDate: string
): string {
  const sp = new URLSearchParams()
  sp.set("frequency", "daily")
  sp.append("data[0]", "value")
  sp.append("facets[series][]", symbol)
  sp.set("start", startDate)
  sp.set("end", endDate)
  // Ascending by period so the chart renders left→right without a client sort.
  sp.set("sort[0][column]", "period")
  sp.set("sort[0][direction]", "asc")
  sp.set("length", String(HISTORY_MAX_ROWS))
  sp.set("api_key", apiKey)
  return `${BASE_URL}?${sp.toString()}`
}

async function getPayload(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<EiaResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
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
  // Latest quote + daily RBRTE history (both via the same verified contract).
  capabilities: { latest: true, history: true },

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

  async getHistory(
    request: ProviderHistoryRequest
  ): Promise<ProviderHistoryResult> {
    const retrievedAt = new Date().toISOString()
    const apiKey = serverConfig.eiaApiKey
    if (!apiKey) throw new ProviderError("auth", "EIA_API_KEY is not set")

    const body = await getPayload(
      buildHistoryUrl(
        request.providerSymbol,
        apiKey,
        request.startDate,
        request.endDate
      ),
      HISTORY_REQUEST_TIMEOUT_MS
    )
    const rows = body.response?.data ?? []

    // Validate every observation; skip (never fabricate) malformed/missing rows.
    // Non-trading days simply aren't returned by EIA, so gaps are natural.
    const points: HistoryPoint[] = []
    for (const row of rows) {
      if (row.series !== request.providerSymbol) continue // series must be RBRTE
      if (unitFrom(row.units) !== "bbl") continue // unit must be $/BBL
      const timestamp = toIsoDate(row.period) // valid period/date
      if (!timestamp) continue
      const value = typeof row.value === "string" ? Number(row.value) : row.value
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue
      points.push({ timestamp, value })
    }
    // Ascending by time (defensive — EIA is asked for asc, but never assume).
    points.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))

    logger.info("market.provider.history_ok", {
      provider: "eia",
      series: request.providerSymbol,
      returned: points.length,
    })

    return { benchmarkId: request.benchmarkId, points, unit: "bbl", retrievedAt }
  },
}
