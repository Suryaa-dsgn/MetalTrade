import Link from "next/link"

import type { MarketRow } from "@/lib/market/types"
import type { DisplayUnit } from "@/lib/market/units"
import { buildDisplayRow } from "@/lib/market/display"
import { PriceChange } from "@/components/market/price-change"
import { MarketStatus } from "@/components/market/market-status"

/*
  Mobile card alternative (Design System §14.2). Preserves ALL column meaning:
  identity, price, 24h/7D/30D change, unit, status, and updated time. Uses the
  same `buildDisplayRow` helper as the desktop table (amendment 12).
*/
function ChangeRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label uppercase tracking-label text-muted-foreground">
        {label}
      </span>
      {value === null ? (
        <span className="text-body-s text-muted-foreground">—</span>
      ) : (
        <PriceChange change={value} />
      )}
    </div>
  )
}

export function MarketMobileList({
  rows,
  unit,
}: {
  rows: MarketRow[]
  unit: DisplayUnit
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const d = buildDisplayRow(row, unit)
        return (
          <li
            key={row.slug}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/markets/${row.slug}`}
                  className="rounded-sm text-body font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {d.name}
                </Link>
                {d.symbol ? (
                  <span className="ml-2 text-body-s text-muted-foreground">
                    {d.symbol}
                  </span>
                ) : null}
              </div>
              <MarketStatus status={d.status} source={d.source} />
            </div>

            <div className="mt-3 flex items-baseline gap-1 tabular-nums">
              <span className="text-price-l tracking-tight text-foreground">
                {d.priceLabel}
              </span>
              <span className="text-body-s text-muted-foreground">
                {d.currency}/{d.unitLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <ChangeRow label="24h" value={d.change24h} />
              <ChangeRow label="7D" value={d.change7d} />
              <ChangeRow label="30D" value={d.change30d} />
            </div>

            <p className="mt-3 text-label uppercase tracking-label text-muted-foreground">
              Updated {d.updatedLabel}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
