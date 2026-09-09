import { proofNote, regionsNote } from "@/data/config/company"
import { Body, Label } from "@/components/ui/typography"

/*
  Proof-point architecture — understated placeholder (amendment 1). Ready for
  verified facts, partners, and metrics later, without giant empty "—" cards or
  looking like broken production data. Includes the regions placeholder. No
  invented facts (amendment 7).
*/
export function ProofPoints() {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface-subtle p-6">
      <Label>Operating facts</Label>
      <Body className="mt-2 max-w-[70ch] text-muted-foreground">{proofNote}</Body>
      <p className="mt-3 text-body-s text-muted-foreground">{regionsNote}</p>
    </div>
  )
}
