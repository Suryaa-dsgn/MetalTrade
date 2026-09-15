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
  MetalpriceAPI live provider adapter. Owns EVERYTHING vendor-specific: endpoint,
  auth, symbol denomination, response VALIDATION (Zod), parsing, timestamp
  extraction, quota headers, and error mapping to safe codes. It receives
  {benchmarkId, providerSymbol} requests and returns RAW quotes keyed by
  benchmarkId; the registry-aware normalization layer converts units,
  sanity-checks, and maps to MarketQuote.

  Verified contract (probe 2026-09-14, Free tier) is documented in
  lib/market/benchmarks.ts and docs/market-provider-readiness.md.
*/

const BASE_URL = "https://api.metalpriceapi.com/v1"
const REQUEST_TIMEOUT_MS = 8_000

/* VERIFIED vendor unit per symbol. A symbol absent here is returned with an
   empty unit, which normalization refuses — so an unverified instrument can
   never be published with a guessed unit. XAU verified as troy ounce. */
const VERIFIED_UNITS: Record<string, string> = { XAU: "oz" }

// Zod schema for the /latest response — reject malformed payloads before parsing.
const LatestSchema = z.object({
  success: z.boolean().optional(),
  base: z.string().optional(),
  timestamp: z.number().optional(),
  rates: z.record(z.string(), z.number()).optional(),
  error: z
    .object({
      statusCode: z.number().optional(),
      code: z.number().optional(),
      message: z.string().optional(),
    })
    .optional(),
})
type Latest = z.infer<typeof LatestSchema>

function mapErrorCode(status: number | undefined): ProviderErrorCode {
  if (status === undefined) return "unknown"
  switch (status) {
    case 101:
    case 102:
      return "auth"
    case 104:
    case 429:
      return "rate_limit"
    case 105:
      return "quota"
    case 403:
    case 416:
      return "paid_gated"
    case 300:
      return "not_found"
  }
  if (status >= 200 && status < 300) return "bad_request"
  if (status >= 400 && status < 500) return "bad_request"
  if (status >= 500) return "server_error" // transient; eligible for one retry
  return "unknown"
}

function parseQuotaHeader(value: string | null): number | undefined {
  if (value == null || value === "") return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function toIso(unixSeconds: number | undefined): string | null {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return null
  const d = new Date(unixSeconds * 1000)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

async function getLatestPayload(
  url: string,
  apiKey: string
): Promise<{ body: Latest; quota?: { limit?: number; used?: number } }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "X-API-KEY": apiKey, Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 12 },
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

  const quota = {
    limit: parseQuotaHeader(res.headers.get("x-api-quota")),
    used: parseQuotaHeader(res.headers.get("x-api-current")),
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

  if (!res.ok || body.success === false) {
    const vendorStatus = body.error?.statusCode ?? body.error?.code ?? res.status
    throw new ProviderError(mapErrorCode(vendorStatus), "provider request failed", vendorStatus)
  }
  return { body, quota }
}

export const metalpriceApiProvider: BenchmarkProvider = {
  id: "metalpriceapi",
  sourceType: "live",
  capabilities: { latest: true, history: false }, // history paid-gated on Free

  isConfigured() {
    return !!serverConfig.metalPriceApiKey
  },

  async getLatest(
    requests: ProviderBenchmarkRequest[]
  ): Promise<FetchLatestResult> {
    const retrievedAt = new Date().toISOString()
    const reqs = requests.filter((r) => r.providerSymbol)
    if (reqs.length === 0) return { quotes: {}, retrievedAt }

    const apiKey = serverConfig.metalPriceApiKey
    if (!apiKey) throw new ProviderError("auth", "METALPRICE_API_KEY is not set")

    const symbols = [...new Set(reqs.map((r) => r.providerSymbol))]
    const url = `${BASE_URL}/latest?base=USD&currencies=${symbols.join(",")}`
    const { body, quota } = await getLatestPayload(url, apiKey)

    const sourceTimestamp = toIso(body.timestamp)
    const rates = body.rates ?? {}
    const quotes: Record<string, RawQuote> = {}

    for (const req of reqs) {
      const value = rates[`USD${req.providerSymbol}`]
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        continue // missing/implausible → omitted (partial), normalization renders unavailable
      }
      quotes[req.benchmarkId] = {
        benchmarkId: req.benchmarkId,
        providerSymbol: req.providerSymbol,
        value,
        providerUnit: VERIFIED_UNITS[req.providerSymbol] ?? "", // "" → refused downstream
        sourceTimestamp,
      }
    }

    logger.info("market.provider.fetch_ok", {
      provider: "metalpriceapi",
      requested: reqs.length,
      returned: Object.keys(quotes).length,
      sourceTimestamp,
      quotaLimit: quota?.limit,
      quotaUsed: quota?.used,
    })

    return { quotes, retrievedAt, quota }
  },
}
