import "server-only"

import { serverConfig } from "@/lib/config/env"
import { logger } from "@/lib/observability/logger"
import type {
  BenchmarkProvider,
  FetchQuotesResult,
  ProviderErrorCode,
  RawQuote,
} from "@/lib/market/providers/types"
import { ProviderError } from "@/lib/market/providers/types"

/*
  MetalpriceAPI live provider adapter. Owns EVERYTHING vendor-specific:
  endpoint, auth, symbol denomination, response parsing, timestamp extraction,
  quota headers, and error mapping to safe codes. It returns RAW quotes; the
  registry-aware normalization layer converts units, sanity-checks, and maps to
  MarketQuote. Swapping in a second provider means implementing this same
  `BenchmarkProvider` interface — no page/service rewrite.

  Verified contract (probe 2026-09-14, Free tier) is documented in
  lib/market/benchmarks.ts. Key facts used here:
    - Header auth: `X-API-KEY` (keeps the key out of URLs/logs).
    - /latest returns `rates["USD"+symbol]` = USD per the vendor's native unit.
    - `timestamp` (UNIX seconds) is the provider as-of time.
    - Failures arrive as HTTP 200 with `{ success:false, error:{ statusCode } }`,
      as well as via HTTP status codes.
*/

const BASE_URL = "https://api.metalpriceapi.com/v1"
const REQUEST_TIMEOUT_MS = 8_000

/*
  VERIFIED vendor unit per symbol. Only symbols whose denomination has been
  confirmed against a live response belong here. A symbol absent from this map
  is returned with an empty unit, which normalization refuses (unavailable) —
  so an unverified instrument can never be published with a guessed unit.
    - XAU verified: USDXAU ≈ 4348/oz (troy ounce). units.ts "oz" = troy ounce.
  Base metals (XCU/XSN/XPB/XLI/IRON) are paid-gated on Free and NOT yet
  verified; add them here only after the paid-tier probe confirms troy vs
  avoirdupois and magnitude.
*/
const VERIFIED_UNITS: Record<string, string> = {
  XAU: "oz",
}

type MetalpriceLatest = {
  success?: boolean
  base?: string
  timestamp?: number
  rates?: Record<string, number>
  error?: { statusCode?: number; message?: string; code?: number }
}

/** Map a vendor status/error code to a safe internal category. */
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
  // Vendor param errors arrive as 2xx statusCodes (201-207, 230-235); HTTP 4xx
  // are client/param errors too.
  if (status >= 200 && status < 300) return "bad_request"
  if (status >= 400 && status < 500) return "bad_request"
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

async function getJson(url: string, apiKey: string): Promise<{
  body: MetalpriceLatest
  quota?: { limit?: number; used?: number }
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "X-API-KEY": apiKey, Accept: "application/json" },
      signal: controller.signal,
      // Daily/EOD data: let Next reuse the fetch across requests. The market
      // service adds its own success-cache and failover on top.
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

  let body: MetalpriceLatest
  try {
    body = (await res.json()) as MetalpriceLatest
  } catch {
    throw new ProviderError("malformed", "unparseable response", res.status)
  }

  // Vendor reports failures as HTTP 200 + success:false, and also via HTTP codes.
  if (!res.ok || body.success === false) {
    const vendorStatus = body.error?.statusCode ?? body.error?.code ?? res.status
    throw new ProviderError(
      mapErrorCode(vendorStatus),
      "provider request failed",
      vendorStatus
    )
  }

  return { body, quota }
}

export const metalpriceApiProvider: BenchmarkProvider = {
  id: "metalpriceapi",

  async fetchQuotes(symbols: string[]): Promise<FetchQuotesResult> {
    const retrievedAt = new Date().toISOString()
    const wanted = [...new Set(symbols)].filter(Boolean)
    if (wanted.length === 0) {
      return { quotes: {}, retrievedAt }
    }

    const apiKey = serverConfig.metalPriceApiKey
    if (!apiKey) {
      throw new ProviderError("auth", "METALPRICE_API_KEY is not set")
    }

    const url = `${BASE_URL}/latest?base=USD&currencies=${wanted.join(",")}`
    const { body, quota } = await getJson(url, apiKey)

    const sourceTimestamp = toIso(body.timestamp)
    const rates = body.rates ?? {}
    const quotes: Record<string, RawQuote> = {}

    for (const symbol of wanted) {
      const value = rates[`USD${symbol}`]
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        // Missing/implausible → omit; normalization renders it unavailable.
        continue
      }
      quotes[symbol] = {
        providerSymbol: symbol,
        value,
        providerUnit: VERIFIED_UNITS[symbol] ?? "", // "" → normalization refuses
        sourceTimestamp,
      }
    }

    logger.info("market.provider.fetch_ok", {
      provider: "metalpriceapi",
      requested: wanted.length,
      returned: Object.keys(quotes).length,
      sourceTimestamp,
      quotaLimit: quota?.limit,
      quotaUsed: quota?.used,
    })

    return { quotes, retrievedAt, quota }
  },
}
