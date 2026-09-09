import type { ComponentType } from "react"

import { operatingModel, operatingModelNote } from "@/data/config/company"
import { H4 } from "@/components/ui/typography"
import {
  SourceIcon,
  AssayIcon,
  CounterpartyIcon,
  DocumentationIcon,
  ContainerIcon,
  VerifiedIcon,
} from "@/components/ui/domain-icon"

/*
  Role in the value chain — a numbered sequence (distinct from the trust
  stepper's cards). Typical/supporting role, not a mandatory process
  (amendment 4). Numbered chips → reads as a sequence; vertical on mobile.
*/
const icons: Record<string, ComponentType<{ className?: string }>> = {
  source: SourceIcon,
  evaluate: AssayIcon,
  connect: CounterpartyIcon,
  negotiate: DocumentationIcon,
  coordinate: ContainerIcon,
  deliver: VerifiedIcon,
}

export function OperatingModel() {
  return (
    <div>
      <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
        {operatingModel.map((step, index) => {
          const Icon = icons[step.key]
          return (
            <li key={step.key}>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-pill bg-primary-soft text-body-s font-semibold tabular-nums text-primary">
                  {index + 1}
                </span>
                {Icon ? <Icon className="size-5 text-primary" /> : null}
              </div>
              <H4 as="h3" className="mt-3 text-body font-semibold">
                {step.label}
              </H4>
              <p className="mt-1 text-body-s text-muted-foreground">
                {step.description}
              </p>
            </li>
          )
        })}
      </ol>
      <p className="mt-6 max-w-[80ch] text-body-s text-muted-foreground">
        {operatingModelNote}
      </p>
    </div>
  )
}
