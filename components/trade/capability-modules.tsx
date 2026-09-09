import { capabilities, capabilityNote } from "@/data/config/logistics"
import { LogisticsIcon } from "@/components/trade/logistics-icons"
import { H4, Label } from "@/components/ui/typography"

/*
  Capability categories — SUPPORTING information (amendment 1), shown as things
  coordinated "where agreed", each confirmed per engagement. The limitation note
  uses a calm informational treatment, not error styling (amendment 9).
*/
export function CapabilityModules() {
  return (
    <div>
      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((cap) => (
          <div key={cap.key} className="flex flex-col gap-2">
            <LogisticsIcon
              iconKey={cap.key}
              className="size-6 text-muted-foreground"
            />
            <H4 as="h3" className="text-body font-semibold">
              {cap.title}
            </H4>
            <p className="text-body-s text-muted-foreground">
              {cap.description}
            </p>
            <Label className="text-muted-foreground">{cap.note}</Label>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-info/25 bg-info-soft p-4">
        <p className="text-body-s text-info">{capabilityNote}</p>
      </div>
    </div>
  )
}
