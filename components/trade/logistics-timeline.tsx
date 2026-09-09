import { lifecycleStages } from "@/data/config/logistics"
import { LogisticsIcon } from "@/components/trade/logistics-icons"
import { H4 } from "@/components/ui/typography"

/*
  Trade lifecycle — the primary story (amendment 1). Numbered stages under thin
  connecting rules, not heavy cards (amendment 8). Vertical on mobile → 2 / 4
  columns on larger screens. Fully legible without animation.
*/
export function LogisticsTimeline() {
  return (
    <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {lifecycleStages.map((stage, index) => (
        <li key={stage.key} className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-label uppercase tracking-label tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <LogisticsIcon iconKey={stage.key} className="size-6 text-primary" />
          </div>
          <H4 as="h3" className="mt-3 text-body font-semibold">
            {stage.label}
          </H4>
          <p className="mt-1 text-body-s text-muted-foreground">
            {stage.description}
          </p>
        </li>
      ))}
    </ol>
  )
}
