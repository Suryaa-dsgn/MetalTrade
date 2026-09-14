import Link from "next/link"

import type { MetalSummary } from "@/lib/market/types"
import { Container } from "@/components/layout/container"
import { PriceChange } from "@/components/market/price-change"
import {
  changeDirection,
  expandUnit,
  formatChangePercent,
  formatPrice,
  formatUpdatedAtUTC,
} from "@/lib/formatters"

/*
  Compact market ticker (Design System §12.1). Static strip — no auto-scrolling
  marquee, so no pause control is needed. Scrolls horizontally on small screens.
  It is NOT the only access to data (the metal cards below repeat it).

  MOCK DATA: labelled as indicative sample, never live.
*/
function accessibleLabel(metal: MetalSummary): string {
  const q = metal.quote
  if (q.price === null) {
    return `${metal.name}, sample price unavailable.`
  }
  const dir = changeDirection(q.change24h)
  const move =
    dir === "flat" ? "unchanged" : `${dir} ${formatChangePercent(q.change24h)}`
  return `${metal.name}, indicative sample ${formatPrice(q.price)} ${q.currency} per ${expandUnit(q.unit)}, ${move}.`
}

export function MarketTicker({ metals }: { metals: MetalSummary[] }) {
  const updated = metals.find((m) => m.quote.updatedAt)?.quote.updatedAt ?? null

  return (
    <section
      aria-label="Market benchmarks"
      className="border-y border-border bg-surface"
    >
      <Container className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="shrink-0 rounded-pill bg-warning-soft px-2.5 py-1 text-label uppercase tracking-label text-warning">
          Indicative sample · not live
        </span>
        <ul className="flex min-w-0 flex-1 gap-5 overflow-x-auto">
          {metals.map((metal) => {
            const q = metal.quote
            return (
              <li key={metal.slug} className="shrink-0">
                <Link
                  href={`/markets/${metal.slug}`}
                  aria-label={accessibleLabel(metal)}
                  className="flex items-center gap-2 rounded-sm whitespace-nowrap py-1 text-body-s"
                >
                  <span className="font-medium text-foreground">{metal.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {q.price === null
                      ? "—"
                      : `${formatPrice(q.price)} ${q.currency}/${q.unit}`}
                  </span>
                  {q.price !== null ? <PriceChange change={q.change24h} /> : null}
                </Link>
              </li>
            )
          })}
        </ul>
        <span className="shrink-0 text-label uppercase tracking-label text-muted-foreground">
          Updated {formatUpdatedAtUTC(updated)}
        </span>
      </Container>
    </section>
  )
}
