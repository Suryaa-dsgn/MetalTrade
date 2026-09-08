"use client"

import { useCallback, useMemo, useRef, useState } from "react"
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
  rows, and syncs to the URL via router.replace (not push). Search filters
  locally immediately; the URL write for `q` is debounced ~250ms; all other
  controls update the URL immediately (amendment 7). `forcedState` (dev-only)
  drives loading/error rendering; "stale" only affects the page freshness banner.
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
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pushUrl = useCallback(
    (next: MarketFilters) => {
      const qs = serializeMarketFilters(next).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname]
  )

  const update = useCallback(
    (patch: Partial<MarketFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch }
        pushUrl(next)
        return next
      })
    },
    [pushUrl]
  )

  const onQChange = useCallback(
    (q: string) => {
      setFilters((prev) => {
        const next = { ...prev, q }
        if (qTimer.current) clearTimeout(qTimer.current)
        qTimer.current = setTimeout(() => pushUrl(next), 250)
        return next
      })
    },
    [pushUrl]
  )

  const onSort = useCallback(
    (field: SortField) => {
      setFilters((prev) => {
        const next: MarketFilters =
          prev.sort === field
            ? { ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }
            : { ...prev, sort: field, dir: "asc" }
        pushUrl(next)
        return next
      })
    },
    [pushUrl]
  )

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
