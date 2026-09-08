import type { ComponentType } from "react"

import { H4 } from "@/components/ui/typography"
import {
  SourceIcon,
  ProcessIcon,
  ContainerIcon,
  CounterpartyIcon,
} from "@/components/ui/domain-icon"

/*
  Source → Trade desk → Logistics → Buyer (Design System §15.1). Legible without
  animation: numbered stages, horizontal on desktop, vertical on mobile.
*/
type Stage = {
  n: string
  title: string
  detail: string
  Icon: ComponentType<{ className?: string }>
}

const stages: Stage[] = [
  {
    n: "01",
    title: "Source",
    detail: "Verified material from mines, refiners, processors, and traders.",
    Icon: SourceIcon,
  },
  {
    n: "02",
    title: "Trade desk",
    detail: "Counterparty qualification, market pricing context, documentation.",
    Icon: ProcessIcon,
  },
  {
    n: "03",
    title: "Logistics",
    detail: "Inspection, freight, customs, and delivery coordination where agreed.",
    Icon: ContainerIcon,
  },
  {
    n: "04",
    title: "Buyer",
    detail: "Qualified demand matched to specification and destination.",
    Icon: CounterpartyIcon,
  },
]

export function NetworkFlow() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
      {stages.map((stage) => (
        <li
          key={stage.n}
          className="flex flex-col gap-3 bg-surface p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-label uppercase tracking-label text-muted-foreground tabular-nums">
              {stage.n}
            </span>
            <stage.Icon className="size-6 text-primary" />
          </div>
          <H4 as="h3">{stage.title}</H4>
          <p className="text-body-s text-muted-foreground">{stage.detail}</p>
        </li>
      ))}
    </ol>
  )
}
