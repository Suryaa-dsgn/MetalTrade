import { cn } from "@/lib/utils"
import { TrendDownIcon, TrendFlatIcon, TrendUpIcon } from "@/components/ui/icon"
import { changeDirection, formatChangePercent } from "@/lib/formatters"

/*
  Price movement — colour + arrow + text, never colour alone (Design System §18).
  A visually-hidden word states the direction for screen readers.
*/
const config = {
  up: { Icon: TrendUpIcon, cls: "text-positive", word: "up" },
  down: { Icon: TrendDownIcon, cls: "text-negative", word: "down" },
  flat: { Icon: TrendFlatIcon, cls: "text-muted-foreground", word: "unchanged" },
} as const

export function PriceChange({
  change,
  className,
}: {
  change: number | null
  className?: string
}) {
  const { Icon, cls, word } = config[changeDirection(change)]
  return (
    <span
      className={cn(
        // `relative` keeps the sr-only child's containing block local so it
        // can't escape an overflow-scroll ancestor (e.g. the market ticker).
        "relative inline-flex items-center gap-1 text-body-s font-medium tabular-nums",
        cls,
        className
      )}
    >
      <Icon />
      {formatChangePercent(change)}
      <span className="sr-only">{word}</span>
    </span>
  )
}
