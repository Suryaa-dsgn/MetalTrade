import type { ComponentProps } from "react"
import {
  Mountains,
  Cube,
  Stack,
  Boat,
  Truck,
  ShippingContainer,
  Warehouse,
  SealCheck,
  Certificate,
  Flask,
  ClipboardText,
  Path,
  Handshake,
} from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"

/*
  Domain / editorial icon barrel — Phosphor ONLY, weight `regular` ONLY
  (logistics stages, metal categories, trust and process steps, capability
  markers). Never duotone, fill, or bold as decoration. Never used for UI
  chrome — that is Heroicons via `@/components/ui/icon`.

  Uses the `/ssr` entry so these render in server components without forcing a
  client boundary. Application components MUST import domain icons from here,
  never from `@phosphor-icons/react` directly, so a swap stays one file.

  This is a seed set. Later phases add logistics/metal/trust glyphs HERE.
*/

type PhosphorIcon = typeof Cube
type DomainIconProps = ComponentProps<PhosphorIcon>

/** Wrap a Phosphor icon, forcing weight `regular`; decorative by default. */
function domainIcon(Base: PhosphorIcon, displayName: string) {
  function Icon({ className, ...props }: DomainIconProps) {
    return (
      <Base
        aria-hidden="true"
        className={cn("size-5", className)}
        {...props}
        // Placed after the spread so `regular` can never be overridden to
        // fill/duotone/bold (CLAUDE.md).
        weight="regular"
      />
    )
  }
  Icon.displayName = `Domain(${displayName})`
  return Icon
}

export const SourceIcon = domainIcon(Mountains, "Source")
export const MetalIcon = domainIcon(Cube, "Metal")
export const FormsIcon = domainIcon(Stack, "Forms")
export const SeaFreightIcon = domainIcon(Boat, "SeaFreight")
export const RoadFreightIcon = domainIcon(Truck, "RoadFreight")
export const ContainerIcon = domainIcon(ShippingContainer, "Container")
export const WarehouseIcon = domainIcon(Warehouse, "Warehouse")
export const VerifiedIcon = domainIcon(SealCheck, "Verified")
export const CertificateIcon = domainIcon(Certificate, "Certificate")
export const AssayIcon = domainIcon(Flask, "Assay")
export const DocumentationIcon = domainIcon(ClipboardText, "Documentation")
export const ProcessIcon = domainIcon(Path, "Process")
export const CounterpartyIcon = domainIcon(Handshake, "Counterparty")
