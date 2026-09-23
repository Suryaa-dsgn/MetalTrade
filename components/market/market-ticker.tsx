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

  The ticker makes no provenance claim of its own: each value is whatever the
  data layer resolved (real, unavailable, etc.), and provenance/freshness is
  represented in the data-driven surfaces (e.g. the Markets page). Unavailable
  benchmarks render an em dash, never a fabricated figure.
*/
function accessibleLabel(metal: MetalSummary): string {
  const q = metal.quote
  if (q.price === null) {
    return `${metal.name}, price unavailable.`
  }
  const dir = changeDirection(q.change24h)
  const move =
    dir === "flat" ? "unchanged" : `${dir} ${formatChangePercent(q.change24h)}`
  return `${metal.name}, ${formatPrice(q.price)} ${q.currency} per ${expandUnit(q.unit)}, ${move}.`
}

export function MarketTicker({ metals }: { metals: MetalSummary[] }) {
  const updated = metals.find((m) => m.quote.updatedAt)?.quote.updatedAt ?? null

  return (
    <section
      aria-label="Market benchmarks"
      className="border-y border-border bg-surface"
    >
      <Container className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
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
