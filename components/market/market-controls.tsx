"use client"

import { cn } from "@/lib/utils"
import { Select, type SelectOption } from "@/components/ui/select"
import { SearchIcon } from "@/components/ui/icon"
import { DISPLAY_UNITS, type DisplayUnit } from "@/lib/market/units"

/*
  Market controls: search (local-immediate), category, currency (USD active;
  EUR/GBP disabled with a persistent explanation), and a unit segmented toggle.
*/
const UNIT_LABELS: Record<DisplayUnit, string> = {
  native: "Native",
  t: "per t",
  kg: "per kg",
  lb: "per lb",
}

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR (conversion unavailable)", disabled: true },
  { value: "GBP", label: "GBP (conversion unavailable)", disabled: true },
]

export function MarketControls({
  q,
  onQChange,
  category,
  categories,
  onCategoryChange,
  unit,
  onUnitChange,
  currency,
  onCurrencyChange,
}: {
  q: string
  onQChange: (q: string) => void
  category: string
  categories: string[]
  onCategoryChange: (c: string) => void
  unit: DisplayUnit
  onUnitChange: (u: DisplayUnit) => void
  currency: string
  onCurrencyChange: (c: string) => void
}) {
  const categoryOptions: SelectOption[] = [
    { value: "all", label: "All categories" },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        {/* Search */}
        <div className="flex flex-1 flex-col gap-1.5 md:min-w-[16rem]">
          <label htmlFor="market-search" className="text-label uppercase tracking-label text-muted-foreground">
            Search
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="market-search"
              type="search"
              inputMode="search"
              placeholder="Search commodities"
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-body-s text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="market-category" className="text-label uppercase tracking-label text-muted-foreground">
            Category
          </label>
          <Select
            id="market-category"
            ariaLabel="Filter by category"
            value={category}
            onValueChange={onCategoryChange}
            options={categoryOptions}
            className="md:w-48"
          />
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="market-currency" className="text-label uppercase tracking-label text-muted-foreground">
            Currency
          </label>
          <Select
            id="market-currency"
            ariaLabel="Display currency"
            value={currency}
            onValueChange={onCurrencyChange}
            options={CURRENCY_OPTIONS}
            className="md:w-44"
          />
        </div>

        {/* Unit segmented toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-label uppercase tracking-label text-muted-foreground">
            Unit
          </span>
          <div
            role="group"
            aria-label="Display unit"
            className="inline-flex rounded-md border border-input bg-surface p-0.5"
          >
            {DISPLAY_UNITS.map((u) => {
              const active = unit === u
              return (
                <button
                  key={u}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onUnitChange(u)}
                  className={cn(
                    "rounded-sm px-2.5 py-1 text-body-s font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {UNIT_LABELS[u]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <p className="text-body-s text-muted-foreground">
        Values are shown in USD. Currency conversion is unavailable until a
        licensed FX source is connected. Unit conversions are exact.
      </p>
    </div>
  )
}
