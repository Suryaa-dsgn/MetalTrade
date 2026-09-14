import type { ComponentType } from "react"

import { H4 } from "@/components/ui/typography"
import {
  CounterpartyIcon,
  MetalIcon,
  SourceIcon,
  AssayIcon,
  ProcessIcon,
  ContainerIcon,
  VerifiedIcon,
} from "@/components/ui/domain-icon"

/*
  Trust framework stepper (Design System §12.4; covers Blueprint §8 trade
  assurance). Process language, not claims. Horizontal grid on desktop, vertical
  sequence on mobile.
*/
type Step = {
  n: string
  title: string
  detail: string
  Icon: ComponentType<{ className?: string }>
}

const steps: Step[] = [
  { n: "01", title: "Verify the counterparty", detail: "Supplier verification and buyer vetting before a trade progresses.", Icon: CounterpartyIcon },
  { n: "02", title: "Review the material", detail: "Material type, quantity, location, and documents reviewed.", Icon: MetalIcon },
  { n: "03", title: "Document the origin", detail: "Origin documentation reviewed where available.", Icon: SourceIcon },
  { n: "04", title: "Inspect and test", detail: "Engineer inspection, then independent third-party inspection and testing when a vetted buyer is in place.", Icon: AssayIcon },
  { n: "05", title: "Structure the trade", detail: "Terms, Incoterms, and documentation aligned before movement.", Icon: ProcessIcon },
  { n: "06", title: "Coordinate origin logistics", detail: "Freight and origin customs coordinated; the buyer handles destination customs.", Icon: ContainerIcon },
  { n: "07", title: "Confirm delivery", detail: "Delivery confirmed to the vetted buyer.", Icon: VerifiedIcon },
]

export function TrustFramework() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step) => (
        <li
          key={step.n}
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-label uppercase tracking-label tabular-nums text-muted-foreground">
              {step.n}
            </span>
            <step.Icon className="size-5 text-primary" />
          </div>
          <H4 as="h3" className="text-body font-semibold">
            {step.title}
          </H4>
          <p className="text-body-s text-muted-foreground">{step.detail}</p>
        </li>
      ))}
    </ol>
  )
}
