"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import type {
  ChartRange,
  DataProvenance,
  HistoryPoint,
  HistoryState,
  MarketQuote,
  MetalStatistics,
} from "@/lib/market/types"
import {
  DISPLAY_UNITS,
  resolveDisplayUnit,
  type DisplayUnit,
} from "@/lib/market/units"
import { changeDirection, formatPrice, formatUpdatedAtUTC } from "@/lib/formatters"
import { Select, type SelectOption } from "@/components/ui/select"
import { PriceChange } from "@/components/market/price-change"
import { MarketStatus } from "@/components/market/market-status"
import { PriceChart } from "@/components/market/price-chart"
import { ChartRangeControls } from "@/components/market/chart-range-controls"
import { ChartDataTable } from "@/components/market/chart-data-table"
import { MarketStatistics } from "@/components/market/market-statistics"
import { Label, PriceXL } from "@/components/ui/typography"

const UNIT_LABELS: Record<DisplayUnit, string> = {
  native: "Native",
  t: "per t",
  kg: "per kg",
  lb: "per lb",
}
const CURRENCY_OPTIONS: SelectOption[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR (conversion unavailable)", disabled: true },
  { value: "GBP", label: "GBP (conversion unavailable)", disabled: true },
]

const CHANGE_TONE = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-muted-foreground",
} as const

/*
  Interactive market panel for the metal detail page. Holds `unit` + `range`
  state and derives ALL displayed values from immutable canonical quote /
  statistics / history via `resolveDisplayUnit` — source arrays are never
  mutated (amendment 5). Quote status and history state are independent.
*/
export function MetalMarketPanel({
  quote,
  provider,
  statistics,
  supportedRanges,
  historySet,
  forcedHistoryState,
  provenance,
  benchmarkLabel,
  sourceLabel,
}: {
  quote: MarketQuote
  provider: string
  statistics: MetalStatistics
  supportedRanges: ChartRange[]
  historySet: Partial<Record<ChartRange, HistoryPoint[]>>
  forcedHistoryState?: HistoryState
  /** Provenance of the CHART data + its labels (never hard-coded to Copper/sample). */
  provenance: DataProvenance
  benchmarkLabel: string
  sourceLabel: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const defaultRange: ChartRange = supportedRanges.includes("1M")
    ? "1M"
    : (supportedRanges[0] ?? "1D")
  const [range, setRange] = useState<ChartRange>(defaultRange)
  const [unit, setUnit] = useState<DisplayUnit>("native")

  // Benchmark price + change, derived from canonical values.
  const priceDisplay = resolveDisplayUnit(quote.price, quote.unit, unit)
  const unitLabel = priceDisplay.unitLabel
  const absoluteCanonical =
    quote.price !== null && statistics.previousClose !== null
      ? quote.price - statistics.previousClose
      : null
  const absoluteDisplay = resolveDisplayUnit(
    absoluteCanonical,
    quote.unit,
    unit
  ).value
  const dir = changeDirection(quote.change24h)

  // Presentation-derived display series (new array; canonical untouched).
  const displaySeries = useMemo<HistoryPoint[]>(() => {
    const canonical = historySet[range] ?? []
    return canonical.map((p) => ({
      timestamp: p.timestamp,
      value: resolveDisplayUnit(p.value, quote.unit, unit).value ?? p.value,
    }))
  }, [historySet, range, quote.unit, unit])

  const historyState: HistoryState =
    forcedHistoryState ?? (historySet[range] ? "ready" : "no-data")
  const lastUpdatedLabel = formatUpdatedAtUTC(quote.updatedAt)

  const absoluteLabel =
    absoluteDisplay === null
      ? "—"
      : `${absoluteDisplay > 0 ? "+" : absoluteDisplay < 0 ? "−" : ""}${formatPrice(
          Math.abs(absoluteDisplay),
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}`

  return (
    <div className="flex flex-col gap-8">
      {/* Benchmark block */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Label>Market benchmark</Label>
          <MarketStatus status={quote.status} source={quote.source} />
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <PriceXL className="text-foreground">
            {priceDisplay.value === null ? "—" : formatPrice(priceDisplay.value)}
          </PriceXL>
          <span className="text-body text-muted-foreground">
            {quote.currency}/{unitLabel}
          </span>
          <span
            className={cn(
              "text-body font-medium tabular-nums",
              CHANGE_TONE[dir]
            )}
          >
            {absoluteLabel}
          </span>
          <PriceChange change={quote.change24h} className="text-body" />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-label uppercase tracking-label text-muted-foreground">
          <span>Provider: {provider}</span>
          <span>Updated {lastUpdatedLabel}</span>
        </div>
      </div>

      {/* Unit / currency controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground">Currency</Label>
          <Select
            ariaLabel="Display currency"
            value="USD"
            onValueChange={() => {}}
            options={CURRENCY_OPTIONS}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-label uppercase tracking-label text-muted-foreground">
            Unit
          </span>
          <div
            role="group"
            aria-label="Display unit"
            className="inline-flex rounded-md border border-input bg-surface p-0.5"
          >
            {DISPLAY_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-body-s font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  unit === u
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {UNIT_LABELS[u]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart + range controls */}
      <div>
        <div className="mb-4">
          <ChartRangeControls
            supportedRanges={supportedRanges}
            value={range}
            onChange={setRange}
          />
        </div>
        <PriceChart
          series={displaySeries}
          range={range}
          state={historyState}
          currency={quote.currency}
          unit={unitLabel}
          lastUpdatedLabel={lastUpdatedLabel}
          onRetry={() => router.replace(pathname, { scroll: false })}
          provenance={provenance}
          benchmarkLabel={benchmarkLabel}
          sourceLabel={sourceLabel}
        />
        <ChartDataTable
          series={displaySeries}
          currency={quote.currency}
          unit={unitLabel}
          caption={`${benchmarkLabel}, ${range} range${
            provenance === "sample" ? " (indicative sample data)" : ""
          }`}
        />
      </div>

      {/* Statistics */}
      <MarketStatistics statistics={statistics} unit={unit} provenance={provenance} />
    </div>
  )
}
