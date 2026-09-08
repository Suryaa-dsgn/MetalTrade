import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/editorial/section-heading"
import { Label } from "@/components/ui/typography"

/*
  Operating-facts architecture (Design System §12.3). NO invented numbers — each
  slot is a structured placeholder (em dash + "Pending verification") until the
  client supplies substantiated metrics. This must never read as a verified fact.
*/
const proofPoints: { label: string; note: string }[] = [
  { label: "Metals actively traded", note: "Pending verification" },
  { label: "Trading corridors", note: "Pending verification" },
  { label: "Typical response time", note: "Pending verification" },
  { label: "Verification steps", note: "Pending verification" },
]

export function ProofSection() {
  return (
    <div>
      <SectionHeading
        eyebrow="Operating facts"
        title="Evidence over adjectives"
        lead="Substantiated operating metrics will appear here once verified. Until then these are deliberate placeholders, not claims."
      />
      <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {proofPoints.map((point) => (
          <div key={point.label} className="bg-surface p-6">
            <dd className={cn("text-price-l tabular-nums text-muted-foreground")}>
              —
            </dd>
            <dt className="mt-2 text-body-s font-medium text-foreground">
              {point.label}
            </dt>
            <Label className="mt-2 block text-muted-foreground">{point.note}</Label>
          </div>
        ))}
      </dl>
    </div>
  )
}
