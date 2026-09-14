import type { MarketQuote } from "@/lib/market/types"
import type { BenchmarkConfig } from "@/lib/market/benchmarks"
import type { RawQuote } from "@/lib/market/providers/types"
import { convertMassPrice, isMassUnit } from "@/lib/market/units"
import { evaluateFreshness } from "@/lib/market/freshness"
import { logger } from "@/lib/observability/logger"

/*
  Registry-aware normalization: turn a provider RAW quote into the app's
  MarketQuote, deterministically and safely.

  Steps (all explicit, none inferred):
    1. Convert provider value from `providerUnit` → `canonicalUnit` using the
       centralised `convertMassPrice` (no magic factors). Unknown units yield
       null → unavailable, never a guessed number.
    2. Sanity-guard the canonical value against `sanityBand`. A value outside the
       band is REFUSED (unavailable) and logged — this is the backstop against a
       troy/avoirdupois or scale mistake ever reaching the UI as a real price.
    3. Apply the benchmark's freshness policy to the source timestamp.
    4. Keep the provider-native value/unit alongside the canonical value for
       debuggability.

  Refusing to publish is always preferred over publishing a suspicious number.
*/

export type NormalizedQuote = {
  quote: MarketQuote
  /** Provider-native values, retained for debugging unit issues. */
  native: {
    providerValue: number | null
    providerUnit: string | null
  }
}

function unavailable(
  cfg: BenchmarkConfig,
  name: string,
  retrievedAt: string,
  sourceTimestamp: string | null = null
): NormalizedQuote {
  return {
    quote: {
      symbol: cfg.providerSymbol ?? "",
      name,
      price: null,
      currency: cfg.currency,
      unit: cfg.canonicalUnit,
      change24h: null,
      updatedAt: sourceTimestamp,
      status: "unavailable",
      source: "unavailable",
      retrievedAt,
    },
    native: { providerValue: null, providerUnit: null },
  }
}

/**
 * Normalize a live provider quote for one benchmark. `raw` may be undefined when
 * the provider omitted the symbol (→ unavailable, no fabrication).
 */
export function normalizeLiveQuote(
  raw: RawQuote | undefined,
  cfg: BenchmarkConfig,
  name: string,
  retrievedAt: string
): NormalizedQuote {
  if (!raw) {
    return unavailable(cfg, name, retrievedAt)
  }

  const providerUnit = raw.providerUnit
  const canonicalUnit = cfg.canonicalUnit

  // 0. Cross-check the adapter's unit against the registry's declared unit. A
  //    mismatch means the vendor changed its denomination (or a mapping drifted)
  //    — refuse rather than silently convert the wrong basis.
  if (cfg.providerUnit && cfg.providerUnit !== providerUnit) {
    logger.warn("market.normalize.unit_mismatch", {
      slug: cfg.slug,
      providerSymbol: cfg.providerSymbol,
      declaredUnit: cfg.providerUnit,
      providerUnit,
    })
    return unavailable(cfg, name, retrievedAt, raw.sourceTimestamp)
  }

  // 1. Unit conversion (explicit; refuses on unknown units).
  let canonicalValue: number | null
  if (providerUnit === canonicalUnit) {
    canonicalValue = raw.value
  } else if (isMassUnit(providerUnit) && isMassUnit(canonicalUnit)) {
    canonicalValue = convertMassPrice(raw.value, providerUnit, canonicalUnit)
  } else {
    canonicalValue = null
  }

  if (canonicalValue === null || Number.isNaN(canonicalValue)) {
    logger.warn("market.normalize.unit_unconvertible", {
      slug: cfg.slug,
      providerSymbol: cfg.providerSymbol,
      providerUnit,
      canonicalUnit,
    })
    return unavailable(cfg, name, retrievedAt, raw.sourceTimestamp)
  }

  // 2. Sanity guard — refuse an implausible magnitude rather than publish it.
  if (cfg.sanityBand) {
    const [min, max] = cfg.sanityBand
    if (canonicalValue < min || canonicalValue > max) {
      logger.warn("market.normalize.sanity_failed", {
        slug: cfg.slug,
        providerSymbol: cfg.providerSymbol,
        canonicalValue,
        canonicalUnit,
        band: [min, max],
      })
      return unavailable(cfg, name, retrievedAt, raw.sourceTimestamp)
    }
  }

  // 3. Freshness from the source timestamp per the benchmark's policy.
  const status = evaluateFreshness(raw.sourceTimestamp, cfg.freshnessPolicy)

  return {
    quote: {
      symbol: cfg.providerSymbol ?? "",
      name,
      price: canonicalValue,
      currency: cfg.currency,
      unit: canonicalUnit,
      change24h: null, // day-change needs an extra call/endpoint (not on Free); honest null
      updatedAt: raw.sourceTimestamp,
      status,
      source: "live",
      retrievedAt,
    },
    native: { providerValue: raw.value, providerUnit },
  }
}
