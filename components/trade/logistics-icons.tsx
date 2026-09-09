import type { ComponentType } from "react"

import {
  AssayIcon,
  AirFreightIcon,
  CollectionIcon,
  ContainerIcon,
  CounterpartyIcon,
  CustomsIcon,
  DocumentationIcon,
  InsuranceIcon,
  RailFreightIcon,
  RoadFreightIcon,
  SeaFreightIcon,
  TrackingIcon,
  VerifiedIcon,
  WarehouseIcon,
} from "@/components/ui/domain-icon"

/*
  Maps content icon keys (from data/config/logistics.ts) to domain icon
  components. Presentation concern — kept out of the content config.
*/
const map: Record<string, ComponentType<{ className?: string }>> = {
  "trade-confirmation": CounterpartyIcon,
  inspection: AssayIcon,
  documentation: DocumentationIcon,
  collection: CollectionIcon,
  "inland-transport": RoadFreightIcon,
  "port-freight": ContainerIcon,
  customs: CustomsIcon,
  delivery: VerifiedIcon,
  freight: SeaFreightIcon,
  warehousing: WarehouseIcon,
  insurance: InsuranceIcon,
  tracking: TrackingIcon,
  road: RoadFreightIcon,
  rail: RailFreightIcon,
  sea: SeaFreightIcon,
  air: AirFreightIcon,
}

export function LogisticsIcon({
  iconKey,
  className,
}: {
  iconKey: string
  className?: string
}) {
  const Icon = map[iconKey]
  return Icon ? <Icon className={className} /> : null
}
