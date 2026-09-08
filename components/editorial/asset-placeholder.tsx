import { cn } from "@/lib/utils"
import type { ImageAsset } from "@/lib/assets/types"

/*
  Neutral, deliberately non-photographic placeholder for an image slot whose
  licensed file does not exist yet (CLAUDE.md imagery rule). It names the
  required asset so it never reads as a verified production photo. When
  `asset.available` becomes true (Phase 9), swap this for `next/image`.
*/
export function AssetPlaceholder({
  asset,
  className,
}: {
  asset: ImageAsset
  className?: string
}) {
  return (
    <div
      role="img"
      aria-label={asset.alt}
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-border-strong bg-surface-subtle",
        className
      )}
    >
      <div className="max-w-full p-4 text-center">
        <span className="block text-label uppercase tracking-label text-muted-foreground">
          Image placeholder
        </span>
        <span className="mt-1 block break-all text-body-s font-medium text-muted-foreground">
          {asset.src}
        </span>
      </div>
    </div>
  )
}
