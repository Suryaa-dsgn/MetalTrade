"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import type { ChartRange, HistoryPoint, HistoryState } from "@/lib/market/types"
import { formatPrice, formatUpdatedAtUTC } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Body, H4 } from "@/components/ui/typography"

/*
  Historical price chart (Design System §13). Single restrained cobalt line
  (~2px), 1px low-contrast grid, muted tabular axes, one tooltip, no gradient /
  glow / permanent dots / decorative animation. DEVELOPMENT FIXTURE — visibly
  labelled as indicative sample, never mistakable for real Copper history.

  Understandable without hover via the benchmark text, range controls, textual
  freshness, and the data-table alternative — the tooltip is only an enhancement
  (amendment 8).
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
}: {
  active?: boolean
  payload?: Array<{ payload: HistoryPoint }>
  currency: string
  unit: string
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
        Copper benchmark · sample
      </div>
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
}: {
  series: HistoryPoint[]
  range: ChartRange
  state: HistoryState
  currency: string
  unit: string
  lastUpdatedLabel: string
  onRetry?: () => void
}) {
  const sampleTag = (
    <p className="mt-2 text-label uppercase tracking-label text-muted-foreground">
      Indicative sample data · not historical or live market data
    </p>
  )

  if (state === "loading") {
    return (
      <div>
        <SkeletonGrid />
        {sampleTag}
      </div>
    )
  }

  if (state === "error") {
    return (
      <div>
        <ChartFrame>
          <div>
            <H4 as="p">Chart data could not be loaded</H4>
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
        {sampleTag}
      </div>
    )
  }

  if (state === "no-data" || series.length === 0) {
    return (
      <div>
        <ChartFrame>
          <Body className="text-muted-foreground">
            No historical data is available for the {range} range.
          </Body>
        </ChartFrame>
        {sampleTag}
      </div>
    )
  }

  return (
    <div>
      {state === "stale" ? (
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-body-s font-medium text-warning">
          Stale — showing last known data from {lastUpdatedLabel}
        </p>
      ) : null}
      <div className={cn("w-full", CHART_HEIGHT)}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
          >
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
              content={<ChartTooltip currency={currency} unit={unit} />}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
      {sampleTag}
    </div>
  )
}
