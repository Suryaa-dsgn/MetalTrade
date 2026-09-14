import { cn } from "@/lib/utils"
import type { MarketStatus as Status, DataProvenance } from "@/lib/market/types"

/*
  Market status badge (Design System §20 status set). Colour + text label, never
  colour alone. Delayed/historical use a neutral/info tone rather than alarming
  red (Design System §13.4).

  Provenance-aware: a SAMPLE row shows a "Sample" badge (never a real feed
  status like "Delayed"), so indicative data is never mistaken for a live
  benchmark. Live rows show their real freshness; unavailable is unavailable.
*/
const config: Record<Status, { label: string; badge: string; dot: string }> = {
  live: {
    label: "Live",
    badge: "bg-positive-soft text-positive",
    dot: "bg-positive",
  },
  delayed: {
    label: "Delayed",
    badge: "bg-info-soft text-info",
    dot: "bg-info",
  },
  eod: {
    label: "End of day",
    badge: "bg-surface-subtle text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  stale: {
    // Attention, not alarm — amber, never red (Design System §13.4).
    label: "Stale",
    badge: "bg-warning-soft text-warning",
    dot: "bg-warning",
  },
  unavailable: {
    label: "Unavailable",
    badge: "bg-surface-subtle text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

export function MarketStatus({
  status,
  source,
  className,
}: {
  status: Status
  source?: DataProvenance
  className?: string
}) {
  // Sample data must never wear a live-feed status label.
  if (source === "sample" && status !== "unavailable") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-body-s font-medium text-warning",
          className
        )}
      >
        <span className="size-1.5 rounded-pill bg-warning" aria-hidden="true" />
        Sample
      </span>
    )
  }
  const c = config[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-body-s font-medium",
        c.badge,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-pill", c.dot)} aria-hidden="true" />
      {c.label}
    </span>
  )
}
