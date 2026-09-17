"use client"

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import type {
  ChartRange,
  DataProvenance,
  HistoryPoint,
  HistoryState,
} from "@/lib/market/types"
import { formatPrice, formatUpdatedAtUTC } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Body, H4 } from "@/components/ui/typography"

/*
  Historical price chart (Design System §13). Single restrained cobalt line
  (~2px), 1px low-contrast grid, muted tabular axes, one tooltip. A very subtle
  cobalt area fade sits BEHIND the grid for atmospheric depth (never a solid
  block); no glow / permanent dots / decorative animation.

  PROVENANCE-DRIVEN LABELS: the benchmark/source labels are passed in, never
  hard-coded. Real live data (e.g. EIA Brent) shows its own benchmark + source and
  is NEVER labelled "sample"; the "indicative sample data" note appears only for
  sample-provenance data. Understandable without hover via the benchmark text, range
  controls, textual freshness, and the data-table alternative (amendment 8).
*/
const CHART_HEIGHT = "h-[300px] sm:h-[360px]"

function formatTick(range: ChartRange, iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })
  if (range === "1D") return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  if (range === "7D" || range === "1M" || range === "3M")
    return `${mon} ${d.getUTCDate()}`
  return `${mon} ${d.getUTCFullYear() % 100}`
}

function ChartTooltip({
  active,
  payload,
  currency,
  unit,
  benchmarkLabel,
  sourceLabel,
  provenance,
}: {
  active?: boolean
  payload?: Array<{ payload: HistoryPoint }>
  currency: string
  unit: string
  benchmarkLabel: string
  sourceLabel: string
  provenance: DataProvenance
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-md">
      <div className="text-label uppercase tracking-label text-muted-foreground">
        {formatUpdatedAtUTC(point.timestamp)}
      </div>
      <div className="mt-1 tabular-nums text-foreground">
        {formatPrice(point.value, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        <span className="text-muted-foreground">
          {currency}/{unit}
        </span>
      </div>
      <div className="text-label uppercase tracking-label text-muted-foreground">
        {benchmarkLabel}
      </div>
      {provenance === "live" && sourceLabel ? (
        <div className="text-label uppercase tracking-label text-muted-foreground">
          {sourceLabel}
        </div>
      ) : null}
    </div>
  )
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border border-border bg-surface p-6 text-center",
        CHART_HEIGHT
      )}
    >
      {children}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div
      className={cn(
        "grid grid-rows-4 gap-0 overflow-hidden rounded-lg border border-border bg-surface",
        CHART_HEIGHT
      )}
      role="status"
      aria-label="Loading chart"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-b border-border/60 last:border-b-0" />
      ))}
    </div>
  )
}

export function PriceChart({
  series,
  range,
  state,
  currency,
  unit,
  lastUpdatedLabel,
  onRetry,
  provenance,
  benchmarkLabel,
  sourceLabel,
}: {
  series: HistoryPoint[]
  range: ChartRange
  state: HistoryState
  currency: string
  unit: string
  lastUpdatedLabel: string
  onRetry?: () => void
  provenance: DataProvenance
  benchmarkLabel: string
  sourceLabel: string
}) {
  // Provenance-driven source note. Live → its own attribution (e.g. EIA); sample →
  // the indicative-sample disclaimer; unavailable → nothing.
  const footerNote = sourceLabel ? (
    <p className="mt-2 text-label uppercase tracking-label text-muted-foreground">
      {sourceLabel}
    </p>
  ) : null

  if (state === "loading") {
    return (
      <div>
        <SkeletonGrid />
        {footerNote}
      </div>
    )
  }

  if (state === "error") {
    return (
      <div>
        <ChartFrame>
          <div>
            <H4 as="p">Historical data temporarily unavailable</H4>
            <Body className="mx-auto mt-2 text-muted-foreground">
              Historical data for the {range} range did not load. Last known
              update: {lastUpdatedLabel}.
            </Body>
            {onRetry ? (
              <div className="mt-5">
                <Button variant="secondary" onClick={onRetry}>
                  Retry
                </Button>
              </div>
            ) : null}
          </div>
        </ChartFrame>
        {footerNote}
      </div>
    )
  }

  if (state === "no-data" || series.length === 0) {
    return (
      <div>
        <ChartFrame>
          <Body className="text-muted-foreground">
            Historical data temporarily unavailable.
          </Body>
        </ChartFrame>
        {footerNote}
      </div>
    )
  }

  return (
    <div>
      {state === "stale" ? (
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-body-s font-medium text-warning">
          Stale, showing last known data from {lastUpdatedLabel}
        </p>
      ) : null}
      <div className={cn("w-full", CHART_HEIGHT)}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
          >
            <defs>
              {/* Decorative vertical fade in the existing cobalt series colour —
                  faint near the line, fully transparent by the baseline. */}
              <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.16}
                />
                <stop
                  offset="45%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.06}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            {/* Behind the grid: atmospheric area fade under the price line. */}
            <Area
              type="monotone"
              dataKey="value"
              baseValue="dataMin"
              stroke="none"
              fill="url(#priceAreaGradient)"
              fillOpacity={1}
              activeDot={false}
              isAnimationActive={false}
            />
            <CartesianGrid
              stroke="var(--color-border)"
              strokeWidth={1}
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v: string) => formatTick(range, v)}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              minTickGap={28}
            />
            <YAxis
              width={64}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => formatPrice(v)}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={
                <ChartTooltip
                  currency={currency}
                  unit={unit}
                  benchmarkLabel={benchmarkLabel}
                  sourceLabel={sourceLabel}
                  provenance={provenance}
                />
              }
              cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {footerNote}
    </div>
  )
}
