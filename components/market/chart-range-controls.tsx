"use client"

import { cn } from "@/lib/utils"
import { CHART_RANGES, type ChartRange } from "@/lib/market/types"

/*
  Range controls (Design System §13.2). Availability comes from the metal's
  `supportedRanges` CONFIG (amendment 1) — an unsupported range is disabled with
  a short explanation rather than returning fake data. Plain <button>s: fully
  keyboard-operable.
*/
export function ChartRangeControls({
  supportedRanges,
  value,
  onChange,
}: {
  supportedRanges: ChartRange[]
  value: ChartRange
  onChange: (range: ChartRange) => void
}) {
  return (
    <div
      role="group"
      aria-label="Chart time range"
      className="inline-flex flex-wrap rounded-md border border-input bg-surface p-0.5"
    >
      {CHART_RANGES.map((range) => {
        const supported = supportedRanges.includes(range)
        const active = supported && value === range
        return (
          <button
            key={range}
            type="button"
            aria-pressed={active}
            disabled={!supported}
            title={
              supported ? undefined : "Not available for this benchmark yet"
            }
            onClick={() => supported && onChange(range)}
            className={cn(
              "rounded-sm px-2.5 py-1 text-body-s font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-primary text-primary-foreground"
                : supported
                  ? "text-muted-foreground hover:text-foreground"
                  : "cursor-not-allowed text-muted-foreground/40"
            )}
          >
            {range}
          </button>
        )
      })}
    </div>
  )
}
