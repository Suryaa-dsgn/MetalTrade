import { cn } from "@/lib/utils"
import type { Freshness } from "@/lib/market/types"

/*
  Feed freshness indicator + source summary. `delayed` and `stale` are DISTINCT
  (amendment 6): delayed = intentionally delayed/EOD feed (neutral/info); stale =
  exceeded the freshness threshold (attention — amber, never alarming red).

  Source summary is TRUTHFUL for mixed sourcing: the page never claims to be
  wholly "live" or wholly "sample". It shows a "Live benchmark" pill when any
  real benchmark is present and an "Indicative sample" pill when any sample data
  is present; per-row badges carry the specifics.
*/
const config: Record<Freshness, { label: string; badge: string; dot: string }> = {
  live: {
    label: "Live",
    badge: "bg-positive-soft text-positive",
    dot: "bg-positive",
  },
  delayed: {
    label: "Delayed / end of day",
    badge: "bg-info-soft text-info",
    dot: "bg-info",
  },
  stale: {
    label: "Stale, exceeded freshness threshold",
    badge: "bg-warning-soft text-warning",
    dot: "bg-warning",
  },
}

export function MarketFreshness({
  freshness,
  updatedLabel,
  hasLive,
  hasSample,
  className,
}: {
  freshness: Freshness
  updatedLabel: string
  /** True when at least one value on the page is a real provider benchmark. */
  hasLive: boolean
  /** True when at least one value on the page is indicative sample data. */
  hasSample: boolean
  className?: string
}) {
  const c = config[freshness]
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {hasLive ? (
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-info-soft px-2.5 py-1 text-label uppercase tracking-label text-info">
          Live benchmark
        </span>
      ) : null}
      {hasSample ? (
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-label uppercase tracking-label text-warning">
          Indicative sample
        </span>
      ) : null}
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
