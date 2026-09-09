import type { MetalStatistics } from "@/lib/market/types"
import { resolveDisplayUnit, type DisplayUnit } from "@/lib/market/units"
import { formatPrice } from "@/lib/formatters"
import { Label } from "@/components/ui/typography"

/*
  Market summary metrics (Design System §6.3, §14). Values are presentation-
  derived from immutable canonical statistics (amendment 5): each is converted
  from the native unit at render, never mutated. Volume / open interest are
  omitted — not meaningful/licensed for a physical benchmark.
*/
function convertValue(
  value: number | null,
  nativeUnit: string,
  unit: DisplayUnit
): number | null {
  return resolveDisplayUnit(value, nativeUnit, unit).value
}

export function MarketStatistics({
  statistics,
  unit,
}: {
  statistics: MetalStatistics
  unit: DisplayUnit
}) {
  const { currency, unit: nativeUnit } = statistics
  const unitLabel = resolveDisplayUnit(
    statistics.open,
    nativeUnit,
    unit
  ).unitLabel

  const fmt = (v: number | null) => {
    const converted = convertValue(v, nativeUnit, unit)
    return converted === null ? "—" : formatPrice(converted)
  }

  const range = (low: number | null, high: number | null) =>
    low === null || high === null ? "—" : `${fmt(low)} – ${fmt(high)}`

  const items: { label: string; value: string }[] = [
    { label: "Open", value: fmt(statistics.open) },
    { label: "Previous close", value: fmt(statistics.previousClose) },
    { label: "Day range", value: range(statistics.dayLow, statistics.dayHigh) },
    {
      label: "52-week range",
      value: range(statistics.week52Low, statistics.week52High),
    },
  ]

  return (
    <div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-surface p-4">
            <dt className="text-label uppercase tracking-label text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 tabular-nums text-foreground">
              {item.value}
              <span className="ml-1 text-body-s text-muted-foreground">
                {currency}/{unitLabel}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <Label className="mt-3 block text-muted-foreground">
        Volume and open interest are not shown for physical benchmarks. Values
        are indicative sample data.
      </Label>
    </div>
  )
}
