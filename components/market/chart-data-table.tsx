"use client"

import { useId, useState } from "react"

import type { HistoryPoint } from "@/lib/market/types"
import { formatPrice, formatUpdatedAtUTC } from "@/lib/formatters"
import { ChevronDown, ChevronUp } from "@/components/ui/icon"

/*
  Accessible data-table alternative to the chart (Design System §13.3, §18;
  amendment 7). Bounded scroll region so long ranges never expand the page;
  meaningful caption; explicit timestamp | value | currency | unit. Values are
  the same presentation-derived numbers as the chart.
*/
export function ChartDataTable({
  series,
  currency,
  unit,
  caption,
}: {
  series: HistoryPoint[]
  currency: string
  unit: string
  /** Provenance-aware caption (e.g. "Brent Crude reference benchmark, 1M range"). */
  caption: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-sm text-body-s font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {open ? "Hide data table" : "View as data table"}
        {open ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {open ? (
        <div
          id={id}
          className="mt-3 max-h-72 overflow-auto rounded-lg border border-border"
        >
          <table className="w-full border-collapse text-body-s">
            <caption className="px-4 py-2 text-left text-label uppercase tracking-label text-muted-foreground">
              {caption}
            </caption>
            <thead>
              <tr className="border-y border-border bg-surface-muted">
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  Timestamp (UTC)
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Value
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  Currency
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  Unit
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr key={point.timestamp} className="border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums text-muted-foreground">
                    {formatUpdatedAtUTC(point.timestamp)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatPrice(point.value, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{currency}</td>
                  <td className="px-4 py-2 text-muted-foreground">{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
