/*
  Number, percent, and date formatters (Design System §13.5).
  - Tabular by intent (paired with `tabular-nums` in components).
  - Null / NaN → em dash, never a fake zero.
  - UTC is formatted manually and deterministically to avoid SSR/CSR hydration
    drift from locale/timezone differences.
*/

const LOCALE = "en-US"
const DASH = "—"

export type Direction = "up" | "down" | "flat"

export function formatPrice(
  value: number | null,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (value === null || Number.isNaN(value)) return DASH
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value)
}

export function formatChangePercent(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return DASH
  const magnitude = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(pct))
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "" // U+2212 minus for negatives
  return `${sign}${magnitude}%`
}

export function changeDirection(pct: number | null): Direction {
  if (pct === null || Number.isNaN(pct) || pct === 0) return "flat"
  return pct > 0 ? "up" : "down"
}

export function formatUpdatedAtUTC(iso: string | null): string {
  if (!iso) return DASH
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return DASH
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}

/** Expand a compact unit to a spoken form for accessible labels. */
export function expandUnit(unit: string): string {
  const map: Record<string, string> = {
    MT: "metric ton",
    oz: "troy ounce",
    kg: "kilogram",
    lb: "pound",
  }
  return map[unit] ?? unit
}
