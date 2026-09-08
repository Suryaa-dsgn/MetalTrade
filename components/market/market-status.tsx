import { cn } from "@/lib/utils"
import type { MarketStatus as Status } from "@/lib/market/types"

/*
  Market status badge (Design System §20 status set). Colour + text label, never
  colour alone. Delayed/historical use a neutral/info tone rather than alarming
  red (Design System §13.4).
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
  historical: {
    label: "Historical",
    badge: "bg-surface-subtle text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  unavailable: {
    label: "Unavailable",
    badge: "bg-surface-subtle text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

export function MarketStatus({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
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
