/*
  Loading skeleton — preserves the table's layout footprint (Design System
  §13.4 / §17). No animated fake lines of data; a neutral pulsing grid.
  `animate-pulse` is reduced to a near-instant state under prefers-reduced-motion
  by the global rule in globals.css.
*/
export function MarketTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border"
      role="status"
      aria-label="Loading market data"
    >
      <div className="flex items-center gap-4 border-b border-border bg-surface-muted px-4 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-3 flex-1 animate-pulse rounded-sm bg-surface-subtle"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
        >
          {Array.from({ length: 6 }).map((_, c) => (
            <div
              key={c}
              className="h-4 flex-1 animate-pulse rounded-sm bg-surface-subtle"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
