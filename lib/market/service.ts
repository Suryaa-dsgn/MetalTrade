import "server-only"

import type {
  ChartRange,
  HistoryPoint,
  MarketQuote,
  MarketRow,
  MetalDetail,
  MetalSummary,
  Metal,
  DataProvenance,
} from "@/lib/market/types"
import {
  getProvider,
  isProviderImplemented,
} from "@/lib/market/providers/router"
import { providerHealth } from "@/lib/market/providers/health"
import type {
  FetchLatestResult,
  ProviderBenchmarkRequest,
} from "@/lib/market/providers/types"
import { normalizeQuote } from "@/lib/market/normalize"
import {
  getBenchmark,
  type BenchmarkConfig,
  type ProviderId,
  SAMPLE_ATTRIBUTION,
  METALPRICEAPI_ATTRIBUTION,
  UNAVAILABLE_ATTRIBUTION,
} from "@/lib/market/benchmarks"
import {
  getSampleExtendedChanges,
  getSampleHistory,
} from "@/lib/market/providers/mock"
import { okMeta, degradedMeta, type ReadMeta } from "@/lib/market/meta"
import { getObservationRepository } from "@/lib/market/repository"
import { getContentSource } from "@/lib/content/source"
import { computeStatistics } from "@/lib/market/history"
import { serverConfig } from "@/lib/config/env"
import { logger } from "@/lib/observability/logger"

/*
  Market read service — registry + router driven, MIXED-SOURCE orchestration.

  Per commodity the BenchmarkRegistry decides routing (live | sample | none); the
  ProviderRouter resolves the provider; each provider is asked for its benchmarks
  by {benchmarkId, providerSymbol} and returns RAW quotes keyed by benchmarkId.
  Partial responses are FIRST-CLASS: a benchmark the provider omits (or a whole
  provider failure) is resolved per that benchmark's own fallback policy, never
  failing the batch. One page can show live Gold beside labelled sample Copper
  and unavailable others, each with honest provenance.

  Modes:
    - default ("registry"): per-benchmark routing. A live provider that is not
      configured (missing key) → its benchmarks fall back (last-known-good or
      unavailable) and log; never mock-as-live in production.
    - "mock" (MARKET_PROVIDER=mock): explicit full sample/demo build — every
      commodity with fixture data is served from the sample provider, labelled.

  Fallback order per benchmark: fresh → cached → last-known-good (stale/degraded)
  → sample only where the policy allows in dev → unavailable.

  LIMITATION: the L1 cache and last-known-good are per server instance and do not
  survive a cold start (no database, by design; the repository seam in the next
  phase makes durable storage pluggable). The adapter's Next fetch revalidate
  softens this.
*/

const LIVE_CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3h; daily/EOD data + provider fetch-cache

function isDemoMode(): boolean {
  return serverConfig.marketMode === "mock"
}

export type MetalDetailData = {
  detail: MetalDetail
  historySet: Partial<Record<ChartRange, HistoryPoint[]>>
}

// --- L1 in-memory fetch cache; L2 last-known-good via the repository seam -----
const providerCache = new Map<ProviderId, { data: FetchLatestResult; at: number }>()
const repository = getObservationRepository()

function unavailableQuote(cfg: BenchmarkConfig | undefined, name: string): MarketQuote {
  return {
    symbol: cfg?.providerSymbol ?? "",
    name,
    price: null,
    currency: cfg?.currency ?? "USD",
    unit: cfg?.canonicalUnit ?? "MT",
    change24h: null,
    updatedAt: null,
    status: "unavailable",
    source: "unavailable",
    retrievedAt: null,
  }
}

/** Fetch a provider's latest with an L1 TTL cache; live failures are simulated
 *  via MARKET_SIMULATE_FAILURE. Returns the result or a typed failure. */
async function fetchLatest(
  provider: ReturnType<typeof getProvider>,
  requests: ProviderBenchmarkRequest[]
): Promise<{ ok: true; result: FetchLatestResult } | { ok: false; code: string }> {
  if (!provider) return { ok: false, code: "provider_unavailable" }
  const now = Date.now()
  const cached = providerCache.get(provider.id)
  if (cached && now - cached.at < LIVE_CACHE_TTL_MS) {
    logger.info("market.cache.hit", { provider: provider.id })
    return { ok: true, result: cached.data }
  }
  logger.info("market.cache.miss", { provider: provider.id })
  providerHealth.recordAttempt(provider.id)
  try {
    if (serverConfig.marketSimulateFailure && provider.sourceType === "live") {
      throw Object.assign(new Error("simulated failure"), { code: "network" })
    }
    logger.info("market.fetch.started", { provider: provider.id, count: requests.length })
    const result = await provider.getLatest(requests)
    providerCache.set(provider.id, { data: result, at: now })
    providerHealth.recordSuccess(provider.id, result.quota)
    logger.info("market.fetch.success", {
      provider: provider.id,
      returned: Object.keys(result.quotes).length,
    })
    return { ok: true, result }
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "unknown"
    providerHealth.recordFailure(provider.id, code)
    logger.warn("market.fetch.failed", { provider: provider.id, code })
    if (code === "rate_limit" || code === "quota") {
      logger.warn("market.provider.rate_limited", { provider: provider.id, code })
    }
    return { ok: false, code }
  }
}

/** Resolve a single benchmark that had no fresh value, per its fallback policy. */
async function fallbackQuote(
  cfg: BenchmarkConfig,
  name: string
): Promise<{ quote: MarketQuote; degraded: boolean }> {
  if (cfg.fallbackPolicy === "live-then-lastgood") {
    const good = await repository.getLastKnownGood(cfg.benchmarkId)
    if (good && good.price != null) {
      logger.warn("market.quote.stale", { benchmarkId: cfg.benchmarkId })
      return { quote: { ...good, status: "stale", source: "live" }, degraded: true }
    }
  }
  return { quote: unavailableQuote(cfg, name), degraded: true }
}

// --- core resolution -------------------------------------------------------

type PlanItem = {
  slug: string
  name: string
  cfg: BenchmarkConfig
  request: ProviderBenchmarkRequest
}

async function resolveQuotes(catalogue: Metal[]): Promise<{
  bySlug: Record<string, MarketQuote>
  meta: ReadMeta
}> {
  const demo = isDemoMode()
  const isProd = process.env.NODE_ENV === "production"
  const bySlug: Record<string, MarketQuote> = {}
  const plan = new Map<ProviderId, PlanItem[]>()
  let degraded = false
  let anyLive = false

  // 1. Build the fetch plan (which provider serves which benchmark).
  for (const metal of catalogue) {
    const cfg = getBenchmark(metal.slug)
    if (!cfg) {
      bySlug[metal.slug] = unavailableQuote(undefined, metal.name)
      continue
    }

    let providerId: ProviderId | null = null
    let providerSymbol: string | undefined

    if (demo) {
      // Full demo: everything with sample fixture data → mock, else unavailable.
      if (metal.symbol) {
        providerId = "mock"
        providerSymbol = metal.symbol
      }
    } else if (cfg.routing === "live") {
      // Invariant (enforced by tests): a benchmark only routes live when public
      // display is approved. A verified-but-gated benchmark stays "sample"/"none".
      if (cfg.provider && isProviderImplemented(cfg.provider) && cfg.providerSymbol) {
        providerId = cfg.provider
        providerSymbol = cfg.providerSymbol
      } else {
        logger.warn("market.route.live_unroutable", {
          slug: metal.slug,
          provider: cfg.provider,
        })
      }
    } else if (cfg.routing === "sample") {
      if (metal.symbol) {
        providerId = "mock"
        providerSymbol = metal.symbol
      }
    }

    if (providerId && providerSymbol) {
      const item: PlanItem = {
        slug: metal.slug,
        name: metal.name,
        cfg,
        request: { benchmarkId: cfg.benchmarkId, providerSymbol },
      }
      const list = plan.get(providerId) ?? []
      list.push(item)
      plan.set(providerId, list)
    } else {
      bySlug[metal.slug] = unavailableQuote(cfg, metal.name)
    }
  }

  // 2. Execute per provider (one batched call each) and resolve per benchmark.
  for (const [providerId, items] of plan) {
    const provider = getProvider(providerId)
    const isLive = provider?.sourceType === "live"

    // Provider not implemented, or a live provider missing its key → fall back.
    if (!provider || (isLive && !provider.isConfigured())) {
      if (isLive) {
        logger.error("market.provider.misconfigured", {
          provider: providerId,
          reason: provider ? "not_configured" : "not_implemented",
          env: isProd ? "production" : "development",
        })
      }
      for (const item of items) {
        const fb = await fallbackQuote(item.cfg, item.name)
        bySlug[item.slug] = fb.quote
        degraded = degraded || (isLive && fb.degraded)
      }
      continue
    }

    const outcome = await fetchLatest(
      provider,
      items.map((i) => i.request)
    )

    for (const item of items) {
      if (outcome.ok) {
        const raw = outcome.result.quotes[item.cfg.benchmarkId]
        if (raw) {
          const { quote } = normalizeQuote(
            raw,
            item.cfg,
            item.name,
            outcome.result.retrievedAt,
            provider.sourceType
          )
          bySlug[item.slug] = quote
          if (quote.source === "live") {
            anyLive = true
            if (quote.price != null) {
              await repository.saveObservation(item.cfg.benchmarkId, quote)
            }
          }
          if (quote.source === "unavailable" && isLive) {
            // A live raw quote that failed validation/sanity in normalization.
            logger.warn("market.quote.rejected", {
              benchmarkId: item.cfg.benchmarkId,
              provider: providerId,
            })
            degraded = true
          }
        } else {
          // Partial response: this benchmark was omitted → its own fallback.
          const fb = await fallbackQuote(item.cfg, item.name)
          bySlug[item.slug] = fb.quote
          if (isLive) {
            degraded = true
            if (fb.quote.source === "live") anyLive = true
          }
        }
      } else {
        // Whole-provider failure → fall back every benchmark it owns.
        const fb = await fallbackQuote(item.cfg, item.name)
        bySlug[item.slug] = fb.quote
        if (isLive) {
          degraded = true
          if (fb.quote.source === "live") anyLive = true
        }
      }
    }
  }

  const provider = anyLive ? "metalpriceapi" : "mock"
  const source = anyLive ? "live" : "mock"
  const meta = degraded ? degradedMeta(provider, source) : okMeta(provider, source)

  // Attribution for a compact "Source: …" line — distinct attributions of the
  // benchmarks actually displayed live (registry-driven, not hard-coded in the UI).
  const sources = new Map<string, { label: string; url?: string }>()
  for (const [slug, q] of Object.entries(bySlug)) {
    if (q.source !== "live") continue
    const a = getBenchmark(slug)?.attribution
    if (a) sources.set(a.label, { label: a.label, url: a.url })
  }
  if (sources.size > 0) meta.sources = [...sources.values()]

  return { bySlug, meta }
}

// --- public reads ----------------------------------------------------------

export async function getMarketOverview(): Promise<{
  data: MetalSummary[]
  meta: ReadMeta
}> {
  const catalogue = await getContentSource().getMetals()
  const { bySlug, meta } = await resolveQuotes(catalogue)
  const data = catalogue.map((metal) => ({
    ...metal,
    quote: bySlug[metal.slug] ?? unavailableQuote(getBenchmark(metal.slug), metal.name),
  }))
  return { data, meta }
}

export async function getMarketTable(): Promise<{
  data: MarketRow[]
  meta: ReadMeta
}> {
  const catalogue = await getContentSource().getMetals()
  const { bySlug, meta } = await resolveQuotes(catalogue)
  const ext = getSampleExtendedChanges()

  const rows: MarketRow[] = catalogue.map((metal) => {
    const q = bySlug[metal.slug]
    const isSample = q?.source === "sample"
    const e = isSample && metal.symbol ? ext[metal.symbol] : undefined
    return {
      slug: metal.slug,
      name: metal.name,
      symbol: metal.symbol,
      category: metal.category,
      price: q?.price ?? null,
      currency: q?.currency ?? "USD",
      unit: q?.unit ?? "MT",
      change24h: q?.change24h ?? null,
      change7d: e?.change7d ?? null,
      change30d: e?.change30d ?? null,
      updatedAt: q?.updatedAt ?? null,
      status: q?.status ?? "unavailable",
      source: q?.source ?? "unavailable",
      retrievedAt: q?.retrievedAt ?? null,
    }
  })
  return { data: rows, meta }
}

export async function getMetalBySlug(
  slug: string
): Promise<{ data: MetalSummary | null; meta: ReadMeta }> {
  const catalogue = await getContentSource().getMetals()
  const metal = catalogue.find((m) => m.slug === slug)
  if (!metal) return { data: null, meta: okMeta("mock", "mock") }
  const { bySlug, meta } = await resolveQuotes(catalogue)
  return {
    data: {
      ...metal,
      quote: bySlug[slug] ?? unavailableQuote(getBenchmark(slug), metal.name),
    },
    meta,
  }
}

function sourceLabel(source: DataProvenance | undefined): string {
  switch (source) {
    case "live":
      return METALPRICEAPI_ATTRIBUTION.label
    case "sample":
      return SAMPLE_ATTRIBUTION.label
    default:
      return UNAVAILABLE_ATTRIBUTION.label
  }
}

export async function getMetalDetail(
  slug: string
): Promise<{ data: MetalDetailData | null; meta: ReadMeta }> {
  const content = getContentSource()
  const [contentDetail, catalogue] = await Promise.all([
    content.getMetalDetailContent(slug),
    content.getMetals(),
  ])
  const metal = catalogue.find((m) => m.slug === slug)
  if (!contentDetail || !metal) return { data: null, meta: okMeta("mock", "mock") }

  const { bySlug, meta } = await resolveQuotes(catalogue)
  const quote = bySlug[slug]
  const cfg = getBenchmark(slug)
  const price = quote?.price
  if (price == null) return { data: null, meta }

  // Sample benchmarks use labelled sample history; a live history-capable
  // benchmark would branch to its history provider (registry historyProvider).
  const historySet =
    quote?.source === "sample" && cfg?.historyCapable
      ? getSampleHistory(slug, contentDetail.supportedRanges, price)
      : {}

  const series1D = historySet["1D"] ?? []
  const series1Y = historySet["1Y"] ?? series1D
  const statistics = computeStatistics({
    currentPrice: price,
    change24h: quote?.change24h ?? null,
    series1D,
    series1Y,
    currency: quote?.currency ?? "USD",
    unit: quote?.unit ?? "MT",
  })

  const detail: MetalDetail = {
    slug: contentDetail.slug,
    provider: sourceLabel(quote?.source),
    supportedRanges: contentDetail.supportedRanges,
    statistics,
    specifications: contentDetail.specifications,
    applications: contentDetail.applications,
    regionsNote: contentDetail.regionsNote,
    pricingFactors: contentDetail.pricingFactors,
  }
  return { data: { detail, historySet }, meta }
}
