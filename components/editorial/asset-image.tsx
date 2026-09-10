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
*/
export function AssetImage({
  asset,
  className,
  sizes,
  priority,
  decorative,
}: {
  asset: ImageAsset
  className?: string
  sizes?: string
  priority?: boolean
  decorative?: boolean
}) {
  if (!asset.available || !asset.src) {
    return <AssetPlaceholder asset={asset} className={className} />
  }

  const objectPosition = asset.focalPoint
    ? `${asset.focalPoint.x}% ${asset.focalPoint.y}%`
    : undefined

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <Image
        src={asset.src}
        alt={decorative ? "" : asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={{ objectPosition }}
      />
    </div>
  )
}
