import type {
  ChartRange,
  HistoryPoint,
  MetalStatistics,
} from "@/lib/market/types"

/*
  DEVELOPMENT FIXTURE ONLY — a deterministic seeded random walk. This is NOT
  real Copper history and must be labelled as indicative sample data wherever it
  is shown (amendment 3). A licensed provider replaces this in Phase 10.

  Determinism (seed from slug+range) keeps SSR and CSR identical, so there is no
  hydration drift.
*/

// Fixed anchor so the fixture never drifts with the wall clock.
const ANCHOR_ISO = "2026-09-08T14:30:00Z"

const HOUR = 3_600_000
const DAY = 24 * HOUR

type RangeConfig = { count: number; stepMs: number; volatility: number }

const RANGE_CONFIG: Record<ChartRange, RangeConfig> = {
  "1D": { count: 24, stepMs: HOUR, volatility: 0.006 },
  "7D": { count: 28, stepMs: 6 * HOUR, volatility: 0.012 },
  "1M": { count: 30, stepMs: DAY, volatility: 0.02 },
  "3M": { count: 45, stepMs: 2 * DAY, volatility: 0.03 },
  "1Y": { count: 52, stepMs: 7 * DAY, volatility: 0.05 },
  "5Y": { count: 60, stepMs: 30 * DAY, volatility: 0.08 },
}

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Generate a series ending exactly at `currentPrice` (walk built backwards). */
export function generateSeries(
  slug: string,
  range: ChartRange,
  currentPrice: number
): HistoryPoint[] {
  const { count, stepMs, volatility } = RANGE_CONFIG[range]
  const rng = mulberry32(hashSeed(`${slug}:${range}`))
  const anchor = new Date(ANCHOR_ISO).getTime()

  const values: number[] = new Array(count)
  values[count - 1] = currentPrice
  for (let i = count - 2; i >= 0; i--) {
    const pct = (rng() - 0.5) * 2 * volatility
    values[i] = Math.max(values[i + 1] / (1 + pct), currentPrice * 0.2)
  }

  return values.map((value, i) => ({
    timestamp: new Date(anchor - (count - 1 - i) * stepMs).toISOString(),
    value: Math.round(value * 100) / 100,
  }))
}

/** Build the series map for the ranges a metal actually supports. */
export function buildHistorySet(
  slug: string,
  supportedRanges: ChartRange[],
  currentPrice: number
): Partial<Record<ChartRange, HistoryPoint[]>> {
  const set: Partial<Record<ChartRange, HistoryPoint[]>> = {}
  for (const range of supportedRanges) {
    set[range] = generateSeries(slug, range, currentPrice)
  }
  return set
}

/** Coherent statistics derived from the fixture (amendment 11):
 *  low ≤ current ≤ high, 52-week from the 1Y series, previous close from
 *  change24h. Canonical values in the native unit; conversion happens at display. */
export function computeStatistics({
  currentPrice,
  change24h,
  series1D,
  series1Y,
  currency,
  unit,
}: {
  currentPrice: number
  change24h: number | null
  series1D: HistoryPoint[]
  series1Y: HistoryPoint[]
  currency: string
  unit: string
}): MetalStatistics {
  const dayVals = series1D.map((p) => p.value)
  const yearVals = series1Y.map((p) => p.value)
  const previousClose =
    change24h !== null ? currentPrice / (1 + change24h / 100) : null
  const open = series1D[0]?.value ?? null

  const candidates = [
    ...dayVals,
    ...(previousClose !== null ? [previousClose] : []),
    ...(open !== null ? [open] : []),
    currentPrice,
  ]

  return {
    open: open === null ? null : Math.round(open * 100) / 100,
    previousClose:
      previousClose === null ? null : Math.round(previousClose * 100) / 100,
    dayLow: Math.round(Math.min(...candidates) * 100) / 100,
    dayHigh: Math.round(Math.max(...candidates) * 100) / 100,
    week52Low: Math.round(Math.min(...yearVals, currentPrice) * 100) / 100,
    week52High: Math.round(Math.max(...yearVals, currentPrice) * 100) / 100,
    currency,
    unit,
  }
}
