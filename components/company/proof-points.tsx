import { proofNote } from "@/data/config/company"
import { Body, Label } from "@/components/ui/typography"

/*
  Proof points (Phase 9B). Only cautious, client-confirmed facts are published:
  "4 years of trade experience" (exact approved wording, not "in business") and
  the confirmed commodity count. The "16 countries" claim is held pending
  clarification (see docs/content-claims-register.md). Everything else stays a
  deliberate placeholder via `proofNote`. No invented facts.
*/
export function ProofPoints() {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface-subtle p-6">
      <Label>Operating facts</Label>
      <ul className="mt-3 space-y-1 text-body-s text-foreground">
        <li>4 years of trade experience.</li>
        <li>12 confirmed public commodities.</li>
      </ul>
      <Body className="mt-3 max-w-[70ch] text-muted-foreground">{proofNote}</Body>
    </div>
  )
}
