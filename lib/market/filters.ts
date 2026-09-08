import type { MarketRow } from "@/lib/market/types"
import { DISPLAY_UNITS, type DisplayUnit } from "@/lib/market/units"

/*
  Market filter state = ONLY these fields. The dev/QA `state` param is handled
  separately by the page and never touches parse/serialize (amendment 4).
  All values are normalized to safe defaults — an invalid URL can never produce
  an impossible UI state (amendment 9).
*/
export const SORT_FIELDS = [
  "name",
  "price",
  "change24h",
  "change7d",
  "change30d",
  "updated",
] as const
export type SortField = (typeof SORT_FIELDS)[number]
export type SortDir = "asc" | "desc"

// Only USD is active in Phase 4 (amendment 10); anything else normalizes to USD.
export const ACTIVE_CURRENCY = "USD"

export type MarketFilters = {
  q: string
  category: string // "all" or an exact category
  sort: SortField
  dir: SortDir
  unit: DisplayUnit
  currency: string
}

export const DEFAULT_FILTERS: MarketFilters = {
  q: "",
  category: "all",
  sort: "name",
  dir: "asc",
  unit: "native",
  currency: ACTIVE_CURRENCY,
}

type ParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

function read(params: ParamInput, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

export function parseMarketFilters(
  params: ParamInput,
  categories: string[]
): MarketFilters {
  const sortRaw = read(params, "sort")
  const dirRaw = read(params, "dir")
  const unitRaw = read(params, "unit")
  const categoryRaw = read(params, "category")

  return {
    q: (read(params, "q") ?? "").slice(0, 80),
    category:
      categoryRaw && categories.includes(categoryRaw) ? categoryRaw : "all",
    sort: SORT_FIELDS.includes(sortRaw as SortField)
      ? (sortRaw as SortField)
      : DEFAULT_FILTERS.sort,
    dir: dirRaw === "desc" ? "desc" : "asc",
    unit: DISPLAY_UNITS.includes(unitRaw as DisplayUnit)
      ? (unitRaw as DisplayUnit)
      : DEFAULT_FILTERS.unit,
    // EUR/GBP are disabled in Phase 4 — always resolve to the active currency.
    currency: ACTIVE_CURRENCY,
  }
}

/** Serialize to a URLSearchParams, omitting values equal to the default so the
 *  URL stays clean. `currency` is never emitted (single active currency). */
export function serializeMarketFilters(filters: MarketFilters): URLSearchParams {
  const sp = new URLSearchParams()
  if (filters.q.trim()) sp.set("q", filters.q.trim())
  if (filters.category !== DEFAULT_FILTERS.category)
    sp.set("category", filters.category)
  if (filters.sort !== DEFAULT_FILTERS.sort) sp.set("sort", filters.sort)
  if (filters.dir !== DEFAULT_FILTERS.dir) sp.set("dir", filters.dir)
  if (filters.unit !== DEFAULT_FILTERS.unit) sp.set("unit", filters.unit)
  return sp
}

export function filterRows(
  rows: MarketRow[],
  filters: MarketFilters
): MarketRow[] {
  const q = filters.q.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.category !== "all" && row.category !== filters.category)
      return false
    if (!q) return true
    return (
      row.name.toLowerCase().includes(q) ||
      row.symbol.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q)
    )
  })
}

function sortValue(row: MarketRow, field: SortField): number | string | null {
  switch (field) {
    case "name":
      return row.name.toLowerCase()
    case "price":
      return row.price
    case "change24h":
      return row.change24h
    case "change7d":
      return row.change7d
    case "change30d":
      return row.change30d
    case "updated":
      return row.updatedAt ? new Date(row.updatedAt).getTime() : null
  }
}

/** Stable sort; null/unavailable values are ALWAYS last, in both directions. */
export function sortRows(rows: MarketRow[], filters: MarketFilters): MarketRow[] {
  const { sort, dir } = filters
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const av = sortValue(a.row, sort)
      const bv = sortValue(b.row, sort)
      const an = av === null || av === undefined || (typeof av === "number" && Number.isNaN(av))
      const bn = bv === null || bv === undefined || (typeof bv === "number" && Number.isNaN(bv))
      if (an && bn) return a.index - b.index
      if (an) return 1 // nulls after, regardless of direction
      if (bn) return -1
      let r: number
      if (typeof av === "string" && typeof bv === "string") r = av.localeCompare(bv)
      else r = av < bv ? -1 : av > bv ? 1 : 0
      if (r === 0) return a.index - b.index // stable tiebreak
      return dir === "desc" ? -r : r
    })
    .map((x) => x.row)
}
