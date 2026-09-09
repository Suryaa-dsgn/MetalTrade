import { transportModeNote, transportModes } from "@/data/config/logistics"
import { LogisticsIcon } from "@/components/trade/logistics-icons"

/*
  Transport modes — "considered according to route and transaction" (amendment
  2). Not asserted as currently-supported company capabilities.
*/
export function TransportModes() {
  return (
    <div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {transportModes.map((mode) => (
          <li
            key={mode.key}
            className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4"
          >
            <LogisticsIcon iconKey={mode.key} className="size-6 text-primary" />
            <span className="text-body font-medium text-foreground">
              {mode.label}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-[80ch] text-body-s text-muted-foreground">
        {transportModeNote}
      </p>
    </div>
  )
}
