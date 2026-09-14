import Link from "next/link"

import { cn } from "@/lib/utils"
import type { MarketRow } from "@/lib/market/types"
import type { DisplayUnit } from "@/lib/market/units"
import { buildDisplayRow } from "@/lib/market/display"
import type { SortDir, SortField } from "@/lib/market/filters"
import { PriceChange } from "@/components/market/price-change"
import { MarketStatus } from "@/components/market/market-status"
import { SortAscIcon, SortDescIcon, SortIcon } from "@/components/ui/icon"

/*
  Desktop market table (Design System §14). Left-align identity, right-align
  numerics (tabular). Sortable headers are real <button>s with aria-sort. The
  metal name is a native <a> (keyboard, new-tab, modifier-click all work) — rows
  are not JS-clickable (amendment 3). Consumes the shared `buildDisplayRow`.
*/
type Column = {
  key: SortField | "unit" | "status"
  label: string
  sortable: boolean
  numeric: boolean
}

const columns: Column[] = [
  { key: "name", label: "Commodity", sortable: true, numeric: false },
  { key: "price", label: "Reference price", sortable: true, numeric: true },
  { key: "change24h", label: "24h", sortable: true, numeric: true },
  { key: "change7d", label: "7D", sortable: true, numeric: true },
  { key: "change30d", label: "30D", sortable: true, numeric: true },
  { key: "unit", label: "Unit", sortable: false, numeric: false },
  { key: "status", label: "Status", sortable: false, numeric: false },
  { key: "updated", label: "Updated", sortable: true, numeric: false },
]

export function MarketTable({
  rows,
  unit,
  sort,
  dir,
  onSort,
}: {
  rows: MarketRow[]
  unit: DisplayUnit
  sort: SortField
  dir: SortDir
  onSort: (field: SortField) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-body-s">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map((col) => {
              const active = col.sortable && sort === col.key
              const ariaSort = active
                ? dir === "asc"
                  ? "ascending"
                  : "descending"
                : col.sortable
                  ? "none"
                  : undefined
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-label uppercase tracking-label text-muted-foreground",
                    col.numeric ? "text-right" : "text-left"
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key as SortField)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                        col.numeric && "flex-row-reverse",
                        active && "text-foreground"
                      )}
                    >
                      {col.label}
                      {active ? (
                        dir === "asc" ? (
                          <SortAscIcon className="size-4" />
                        ) : (
                          <SortDescIcon className="size-4" />
                        )
                      ) : (
                        <SortIcon className="size-4 text-muted-foreground/60" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const d = buildDisplayRow(row, unit)
            return (
              <tr
                key={row.slug}
                className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-muted/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/markets/${row.slug}`}
                    className="rounded-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {d.name}
                  </Link>
                  {d.symbol ? (
                    <span className="ml-2 text-muted-foreground">{d.symbol}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {d.priceLabel}
                  <span className="ml-1 text-muted-foreground">
                    {d.currency}/{d.unitLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <CellChange value={d.change24h} />
                </td>
                <td className="px-4 py-3 text-right">
                  <CellChange value={d.change7d} />
                </td>
                <td className="px-4 py-3 text-right">
                  <CellChange value={d.change30d} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.unitLabel}</td>
                <td className="px-4 py-3">
                  <MarketStatus status={d.status} source={d.source} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
                  {d.updatedLabel}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CellChange({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  return <PriceChange change={value} className="justify-end" />
}
