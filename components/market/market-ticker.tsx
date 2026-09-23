import type { CSSProperties } from "react"
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
  Market ticker (Design System §12.1). Institutional market tape: a fixed
  "Updated" timestamp pill on the left, and a continuous, slow horizontal
  marquee of commodity benchmarks on the right. Pure CSS (see `.market-tape-*`
  in globals.css) so this stays a Server Component — the animation pauses on
  hover / focus and is disabled under reduced motion.

  It is NOT the only access to data (the metal cards below repeat it). The ticker
  makes no provenance claim of its own: each value is whatever the data layer
  resolved (real, unavailable, etc.); provenance/freshness lives in the
  data-driven surfaces (e.g. the Markets page). Unavailable benchmarks render an
  em dash, never a fabricated figure.
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

/** One commodity: name · price+unit (or em dash) · 24h move. */
function TapeItem({ metal }: { metal: MetalSummary }) {
  const q = metal.quote
  return (
    <li>
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
}

export function MarketTicker({ metals }: { metals: MetalSummary[] }) {
  const updated = metals.find((m) => m.quote.updatedAt)?.quote.updatedAt ?? null

  // Duration scales with the number of items so the linear speed stays roughly
  // constant and readable regardless of catalogue size (clamped 35–60s/cycle).
  const durationSec = Math.min(60, Math.max(35, metals.length * 4))

  return (
    <section
      aria-label="Market benchmarks"
      className="border-y border-border bg-surface"
    >
      {/* Stacked on mobile (a compact pill line above a full-width tape) so the
          feed never squeezes into an unreadable row; a single [pill | feed] row
          from sm up. */}
      <Container className="flex flex-col items-start gap-2 py-2.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-pill border border-border bg-surface-muted px-2.5 py-1 text-label uppercase tracking-label text-muted-foreground">
          Updated {formatUpdatedAtUTC(updated)}
        </span>

        {/* Subtle divider (desktop/tablet); the gap separates on mobile. */}
        <span
          aria-hidden="true"
          className="hidden h-4 w-px shrink-0 bg-border sm:block"
        />

        {/* Moving feed. Clipped (no scrollbar); the track holds two identical
            groups and translates -50% for a seamless loop. */}
        <div className="market-tape-viewport relative w-full overflow-hidden sm:w-auto sm:min-w-0 sm:flex-1">
          <div
            className="market-tape-track"
            style={
              { "--market-tape-duration": `${durationSec}s` } as CSSProperties
            }
          >
            <ul className="market-tape-group">
              {metals.map((metal) => (
                <TapeItem key={metal.slug} metal={metal} />
              ))}
            </ul>
            {/* Visual duplicate for the seamless loop: inert + hidden from the
                a11y tree so it is neither focusable nor announced twice. */}
            <ul className="market-tape-group" aria-hidden="true" inert>
              {metals.map((metal) => (
                <TapeItem key={metal.slug} metal={metal} />
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}
