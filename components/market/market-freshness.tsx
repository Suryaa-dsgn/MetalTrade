import { cn } from "@/lib/utils"
import type { Freshness } from "@/lib/market/types"

/*
  Feed freshness indicator. `delayed` and `stale` are DISTINCT (amendment 6):
  delayed = intentionally delayed feed (neutral/info); stale = exceeded the
  freshness threshold (attention — amber, never alarming red).

  A persistent "indicative sample" tag makes clear this is development data and
  not a live market feed (amendment 11).
*/
const config: Record<Freshness, { label: string; badge: string; dot: string }> = {
  live: {
    label: "Live",
    badge: "bg-positive-soft text-positive",
    dot: "bg-positive",
  },
  delayed: {
    label: "Delayed feed",
    badge: "bg-info-soft text-info",
    dot: "bg-info",
  },
  stale: {
    label: "Stale — exceeded freshness threshold",
    badge: "bg-warning-soft text-warning",
    dot: "bg-warning",
  },
}

export function MarketFreshness({
  freshness,
  updatedLabel,
  className,
}: {
  freshness: Freshness
  updatedLabel: string
  className?: string
}) {
  const c = config[freshness]
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-label uppercase tracking-label text-warning">
        Indicative sample · not a live feed
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-body-s font-medium",
          c.badge
        )}
      >
        <span className={cn("size-1.5 rounded-pill", c.dot)} aria-hidden="true" />
        {c.label}
      </span>
      <span className="text-label uppercase tracking-label text-muted-foreground">
        Updated {updatedLabel}
      </span>
    </div>
  )
}
