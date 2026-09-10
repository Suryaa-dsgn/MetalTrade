import Link from "next/link"

import { cn } from "@/lib/utils"
import type { MetalSummary } from "@/lib/market/types"
import { AssetImage } from "@/components/editorial/asset-image"
import { PriceChange } from "@/components/market/price-change"
import { buttonVariants } from "@/components/ui/button"
import { MetalIcon } from "@/components/ui/domain-icon"
import { H3, Label } from "@/components/ui/typography"
import { formatPrice } from "@/lib/formatters"

/*
  Editorial metal card (Design System §12.2). Image occupies a meaningful area;
  price + movement align on one row. Shows only general physical forms — no
  invented availability, purity, or volume. Prices are indicative sample data.
*/
export function MetalCard({ metal }: { metal: MetalSummary }) {
  const q = metal.quote

  return (
    <article className="asset-zoom flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md focus-within:shadow-md">
      <AssetImage
        asset={metal.image}
        className="aspect-[4/3] rounded-none"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        hoverZoom
        zoomTrigger="card"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <MetalIcon className="size-5 text-muted-foreground" />
          <H3 className="text-h4">{metal.name}</H3>
        </div>
        <p className="mt-1 text-body-s text-muted-foreground">
          {metal.forms.join(" · ")}
        </p>

        <div className="mt-4 flex items-baseline justify-between gap-2">
          <span className="text-price-l tabular-nums tracking-tight text-foreground">
            {q.price === null ? "—" : formatPrice(q.price)}
            <span className="ml-1 align-baseline text-body-s font-normal text-muted-foreground">
              {q.currency}/{q.unit}
            </span>
          </span>
          {q.price !== null ? <PriceChange change={q.change24h} /> : null}
        </div>
        <Label className="mt-1">Indicative sample · not live</Label>

        <div className="mt-5 flex flex-wrap gap-2 pt-1">
          <Link
            href={`/markets/${metal.slug}`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            View market
          </Link>
          <Link
            href="/enquire/supply"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Discuss supply
          </Link>
        </div>
      </div>
    </article>
  )
}
