import { responsibleSourcing } from "@/data/config/company"
import { VerifiedIcon } from "@/components/ui/domain-icon"

/*
  Responsible sourcing — process / provenance / material evidence, as a
  checklist (distinct treatment). Qualifiers are local to each item.
*/
export function ResponsibleSourcing() {
  return (
    <ul className="max-w-3xl space-y-3">
      {responsibleSourcing.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <VerifiedIcon className="mt-0.5 size-5 shrink-0 text-primary" />
          <span className="text-body text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  )
}
