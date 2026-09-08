import Link from "next/link"

import { cn } from "@/lib/utils"
import type { ImageAsset } from "@/lib/assets/types"
import { AssetPlaceholder } from "@/components/editorial/asset-placeholder"
import { SectionHeading } from "@/components/editorial/section-heading"
import { buttonVariants } from "@/components/ui/button"
import { CheckIconGlyph } from "@/components/ui/icon"

/*
  Reusable two-sided proposition block (Blueprint §6.1). Image + statement +
  evidence points + one clear action. Used for the supplier and buyer sections
  with mirrored image sides. Points use capability language, not claims.
*/
export function ValueProposition({
  eyebrow,
  title,
  lead,
  points,
  cta,
  image,
  imageSide = "end",
}: {
  eyebrow: string
  title: string
  lead: string
  points: string[]
  cta: { label: string; href: string }
  image: ImageAsset
  imageSide?: "start" | "end"
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn(imageSide === "start" && "lg:order-2")}>
        <SectionHeading eyebrow={eyebrow} title={title} lead={lead} />
        <ul className="mt-6 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary"
              >
                <CheckIconGlyph className="size-3.5" />
              </span>
              <span className="text-body text-foreground">{point}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link href={cta.href} className={buttonVariants()}>
            {cta.label}
          </Link>
        </div>
      </div>
      <AssetPlaceholder
        asset={image}
        className={cn("aspect-[4/3]", imageSide === "start" && "lg:order-1")}
      />
    </div>
  )
}
