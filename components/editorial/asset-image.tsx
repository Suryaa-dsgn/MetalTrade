import Image from "next/image"

import { cn } from "@/lib/utils"
import type { ImageAsset } from "@/lib/assets/types"
import { AssetPlaceholder } from "@/components/editorial/asset-placeholder"

/*
  Single swap point for editorial imagery (Design System §10.3). When the asset
  is cleared (`available` + a real `src`) it renders an optimised `next/image`
  with `object-cover` and the recorded focal point; otherwise it degrades to the
  neutral `AssetPlaceholder`, so excluded/pending slots need no per-site branch.

  `className` MUST establish container geometry (an aspect box or explicit size)
  so the `fill` image never causes layout shift (amendment 6).

  Alt behaviour (amendment 5): informative images pass their descriptive
  `asset.alt`; set `decorative` when the image is purely decorative or fully
  redundant with adjacent text, and it renders `alt=""` (hidden from AT).

  Hover zoom (Phase 9A.2): set `hoverZoom` to enable the shared, CSS-only image
  zoom (see `.asset-zoom` / `.asset-zoom-target` in globals.css). `zoomTrigger`
  chooses what the pointer hovers:
    - "self" (default): the image's own frame is the trigger — standalone
      editorial/material images.
    - "card": an ancestor carrying `.asset-zoom` is the trigger (e.g. MetalCard),
      so hovering/focusing anywhere on the card zooms the image.
  It only applies on the real-image branch — placeholders never zoom. Stays
  server-compatible (no JS handlers); the effect is pure CSS and reduced-motion
  and touch are handled centrally.
*/
export function AssetImage({
  asset,
  className,
  sizes,
  priority,
  decorative,
  hoverZoom,
  zoomTrigger = "self",
}: {
  asset: ImageAsset
  className?: string
  sizes?: string
  priority?: boolean
  decorative?: boolean
  hoverZoom?: boolean
  zoomTrigger?: "self" | "card"
}) {
  if (!asset.available || !asset.src) {
    return <AssetPlaceholder asset={asset} className={className} />
  }

  const objectPosition = asset.focalPoint
    ? `${asset.focalPoint.x}% ${asset.focalPoint.y}%`
    : undefined

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        hoverZoom && zoomTrigger === "self" && "asset-zoom",
        className
      )}
    >
      <Image
        src={asset.src}
        alt={decorative ? "" : asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", hoverZoom && "asset-zoom-target")}
        style={{ objectPosition }}
      />
    </div>
  )
}
