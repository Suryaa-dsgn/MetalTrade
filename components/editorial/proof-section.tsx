import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/editorial/section-heading"
import { Label } from "@/components/ui/typography"

/*
  Operating-facts architecture (Design System §12.3). Only client-confirmed,
  cautious facts are published (trade experience, confirmed commodity count).
  Anything unconfirmed stays a structured placeholder ("—" + "Pending
  verification"), never a fabricated metric. The "16 countries" claim is held
  pending clarification (see docs/content-claims-register.md).
*/
const proofPoints: { label: string; value?: string; note: string }[] = [
  { label: "Trade experience", value: "4 years", note: "In physical commodity trade." },
  { label: "Commodities", value: "12", note: "Confirmed public catalogue." },
  { label: "Trading regions", note: "Pending verification" },
  { label: "Approved metrics", note: "Published once verified" },
]

export function ProofSection() {
  return (
    <div>
      <SectionHeading
        eyebrow="Operating facts"
        title="Evidence over adjectives"
        lead="Verified operating facts appear here as they are confirmed. Placeholders are deliberate, never invented figures."
      />
      <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {proofPoints.map((point) => (
          <div key={point.label} className="bg-surface p-6">
            <dd
              className={cn(
                "text-price-l tabular-nums",
                point.value ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {point.value ?? "—"}
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
