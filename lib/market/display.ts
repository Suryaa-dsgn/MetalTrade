import type { MarketRow } from "@/lib/market/types"
import { resolveDisplayUnit, type DisplayUnit } from "@/lib/market/units"
import { formatPrice, formatUpdatedAtUTC } from "@/lib/formatters"

/*
  Single source of display formatting for a market row. BOTH the desktop table
  and the mobile card list consume this, so numbers/units/labels are identical
  (amendment 12). Change percentages are passed through raw for `PriceChange`.
*/
export type DisplayRow = {
  slug: string
  name: string
  symbol?: string
  category: string
  status: MarketRow["status"]
  priceLabel: string
  unitLabel: string
  currency: string
  updatedLabel: string
  change24h: number | null
  change7d: number | null
  change30d: number | null
  converted: boolean
}

export function buildDisplayRow(row: MarketRow, unit: DisplayUnit): DisplayRow {
  const { value, unitLabel, converted } = resolveDisplayUnit(
    row.price,
    row.unit,
    unit
  )
  // Consistent precision: whole numbers for large values, 2dp for small
  // (e.g. converted $/kg or $/lb).
  const priceLabel =
    value === null
      ? "—"
      : formatPrice(value, {
          minimumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
          maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
        })

  return {
    slug: row.slug,
    name: row.name,
    symbol: row.symbol,
    category: row.category,
    status: row.status,
    priceLabel,
    unitLabel,
    currency: row.currency,
    updatedLabel: formatUpdatedAtUTC(row.updatedAt),
    change24h: row.change24h,
    change7d: row.change7d,
    change30d: row.change30d,
    converted,
  }
}
