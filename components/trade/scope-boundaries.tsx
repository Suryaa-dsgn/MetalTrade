import { scopeInside, scopeOutside } from "@/data/config/logistics"
import { CheckIconGlyph, CloseIcon } from "@/components/ui/icon"
import { Label } from "@/components/ui/typography"

/*
  Honest scope boundaries (Blueprint §6.4). Calm treatment — the "outside scope"
  column is muted, not an error/warning style.
*/
export function ScopeBoundaries() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <Label>What the trade desk coordinates</Label>
        <ul className="mt-4 space-y-3">
          {scopeInside.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckIconGlyph className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-body text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <Label>What sits outside this scope</Label>
        <ul className="mt-4 space-y-3">
          {scopeOutside.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CloseIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <span className="text-body text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
