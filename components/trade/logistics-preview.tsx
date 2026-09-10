import Link from "next/link"

import type { ComponentType } from "react"
import { AssetImage } from "@/components/editorial/asset-image"
import { SectionHeading } from "@/components/editorial/section-heading"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRightIcon } from "@/components/ui/icon"
import {
  RoadFreightIcon,
  SeaFreightIcon,
  ContainerIcon,
  WarehouseIcon,
} from "@/components/ui/domain-icon"
import { homeAssets } from "@/lib/assets/home"

/*
  Logistics preview (Blueprint §6.1 §9). A brief lifecycle + supported modes,
  linking to the full Trade & Logistics page (Phase 6). Capability/region claims
  are avoided here — modes are shown as "where agreed", specifics are TODO.
*/
const lifecycle = [
  "Trade confirmation",
  "Inspection",
  "Documentation",
  "Freight",
  "Customs",
  "Delivery",
]

const modes: { label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { label: "Road & rail", Icon: RoadFreightIcon },
  { label: "Sea freight", Icon: SeaFreightIcon },
  { label: "Containerised", Icon: ContainerIcon },
  { label: "Warehousing", Icon: WarehouseIcon },
]

export function LogisticsPreview() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <AssetImage
        asset={homeAssets.logistics}
        className="aspect-[4/3]"
        sizes="(min-width: 1024px) 50vw, 100vw"
        hoverZoom
      />
      <div>
        <SectionHeading
          eyebrow="Trade & logistics"
          title="From source to destination"
          lead="Movement is coordinated across supported modes where agreed in the transaction. Specific lanes and capabilities are confirmed per trade."
        />

        <ul className="mt-6 flex flex-wrap gap-2">
          {lifecycle.map((stage) => (
            <li
              key={stage}
              className="rounded-pill border border-border bg-surface px-3 py-1 text-body-s text-foreground"
            >
              {stage}
            </li>
          ))}
        </ul>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {modes.map((mode) => (
            <li key={mode.label} className="flex flex-col items-start gap-2">
              <mode.Icon className="size-6 text-primary" />
              <span className="text-body-s text-muted-foreground">
                {mode.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link
            href="/trade-logistics"
            className={buttonVariants({ variant: "secondary" })}
          >
            Explore trade &amp; logistics
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  )
}
