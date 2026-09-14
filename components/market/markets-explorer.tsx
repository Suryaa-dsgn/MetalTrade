"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import type { MarketRow } from "@/lib/market/types"
import type { DisplayUnit } from "@/lib/market/units"
import {
  filterRows,
  serializeMarketFilters,
  sortRows,
  type MarketFilters,
  type SortField,
} from "@/lib/market/filters"
import { MarketControls } from "@/components/market/market-controls"
import { MarketTable } from "@/components/market/market-table"
import { MarketMobileList } from "@/components/market/market-mobile-list"
import { MarketEmpty } from "@/components/market/market-empty"
import { MarketError } from "@/components/market/market-error"
import { MarketTableSkeleton } from "@/components/market/market-table-skeleton"

/*
  Client orchestrator. Holds filter state (source of truth), derives visible
  rows, and syncs to the URL via router.replace (not push). Event handlers only
  mutate local filter state; URL synchronization runs in an effect AFTER render
  (never inside a setState updater — that would update the Router while rendering).
  Search filters locally immediately; the URL write for `q` is debounced ~250ms;
  all other controls update the URL immediately (amendment 7). `forcedState`
  (dev-only) drives loading/error rendering; "stale" only affects the page
  freshness banner.
*/
export function MarketsExplorer({
  rows,
  categories,
  initial,
  forcedState,
}: {
  rows: MarketRow[]
  categories: string[]
  initial: MarketFilters
  forcedState?: "loading" | "error"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [filters, setFilters] = useState<MarketFilters>(initial)
  // Filter values already reflected in the URL. Seeded from `initial` (parsed
  // from the incoming URL) so the first effect run is a no-op and any dev-only
  // `state` param survives the initial render.
  const syncedRef = useRef<MarketFilters>(initial)

  // Handlers mutate local filter state ONLY. Local filtering/sorting is derived
  // from `filters` below, so it stays immediate regardless of URL timing.
  const update = useCallback((patch: Partial<MarketFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  const onQChange = useCallback((q: string) => {
    setFilters((prev) => ({ ...prev, q }))
  }, [])

  const onSort = useCallback((field: SortField) => {
    setFilters((prev) =>
      prev.sort === field
        ? { ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { ...prev, sort: field, dir: "asc" }
    )
  }, [])

  // URL synchronization, after render. Guarded against redundant replaces (which
  // also prevents any URL<->state loop): only replace when the serialized filter
  // query actually differs from what the URL already holds. `q`-only changes are
  // debounced ~250ms to avoid history spam while typing; every other control
  // writes immediately. The dev/QA `state` param is intentionally dropped on a
  // filter change (it is never part of serializeMarketFilters), matching prior
  // behaviour.
  useEffect(() => {
    const synced = syncedRef.current
    const desired = serializeMarketFilters(filters).toString()
    if (desired === serializeMarketFilters(synced).toString()) return

    const onlyQChanged =
      synced.category === filters.category &&
      synced.sort === filters.sort &&
      synced.dir === filters.dir &&
      synced.unit === filters.unit &&
      synced.currency === filters.currency &&
      synced.q !== filters.q

    const write = () => {
      syncedRef.current = filters
      router.replace(desired ? `${pathname}?${desired}` : pathname, {
        scroll: false,
      })
    }

    if (onlyQChanged) {
      const t = setTimeout(write, 250)
      return () => clearTimeout(t)
    }
    write()
  }, [filters, pathname, router])

  // Honest retry: drop any dev forced-error state and return to normal data.
  const onRetry = useCallback(() => {
    const qs = serializeMarketFilters(filters).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [filters, pathname, router])

  const visible = useMemo(
    () => sortRows(filterRows(rows, filters), filters),
    [rows, filters]
  )

  const unit = filters.unit as DisplayUnit

  return (
    <div className="flex flex-col gap-6">
      <MarketControls
        q={filters.q}
        onQChange={onQChange}
        category={filters.category}
        categories={categories}
        onCategoryChange={(category) => update({ category })}
        unit={unit}
        onUnitChange={(u) => update({ unit: u })}
        currency={filters.currency}
        onCurrencyChange={(currency) => update({ currency })}
      />

      {forcedState === "loading" ? (
        <MarketTableSkeleton />
      ) : forcedState === "error" ? (
        <MarketError onRetry={onRetry} />
      ) : visible.length === 0 ? (
        <MarketEmpty query={filters.q} category={filters.category} />
      ) : (
        <>
          <div className="hidden md:block">
            <MarketTable
              rows={visible}
              unit={unit}
              sort={filters.sort}
              dir={filters.dir}
              onSort={onSort}
            />
          </div>
          <div className="md:hidden">
            <MarketMobileList rows={visible} unit={unit} />
          </div>
        </>
      )}
    </div>
  )
}
