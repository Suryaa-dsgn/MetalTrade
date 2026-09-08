import type { Metadata } from "next"
import Link from "next/link"

import type { Freshness } from "@/lib/market/types"
import { getMarketTable } from "@/lib/market/mock-adapter"
import { parseMarketFilters } from "@/lib/market/filters"
import { formatUpdatedAtUTC } from "@/lib/formatters"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/editorial/section-heading"
import { Body, Label } from "@/components/ui/typography"
import { buttonVariants } from "@/components/ui/button"
import { MarketFreshness } from "@/components/market/market-freshness"
import { MarketsExplorer } from "@/components/market/markets-explorer"
import { BenchmarkDisclaimer } from "@/components/market/benchmark-disclaimer"

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Indicative market benchmarks and historical movement for physical metals. Development sample data — not a live market feed.",
}

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const rows = await getMarketTable()
  const categories = [...new Set(rows.map((r) => r.category))]
  const filters = parseMarketFilters(sp, categories)

  // Dev/QA-only forced states, ignored in production (amendment 4).
  const isDev = process.env.NODE_ENV !== "production"
  const stateParam = typeof sp.state === "string" ? sp.state : undefined
  const forced =
    isDev &&
    (stateParam === "loading" ||
      stateParam === "error" ||
      stateParam === "stale")
      ? stateParam
      : undefined
  const explorerForced =
    forced === "loading" || forced === "error" ? forced : undefined
  const freshness: Freshness = forced === "stale" ? "stale" : "delayed"

  const latestUpdated =
    rows.find((r) => r.updatedAt)?.updatedAt ?? null

  return (
    <Section spacing="compact">
      <SectionHeading
        eyebrow="Markets"
        title="Reference prices and historical movement"
        lead="Benchmarks give market context — they are not a transaction price. Physical-metal pricing is negotiated per specification, quantity, origin, destination, and terms."
      />
      <MarketFreshness
        className="mt-6"
        freshness={freshness}
        updatedLabel={formatUpdatedAtUTC(latestUpdated)}
      />

      <div className="mt-8">
        <MarketsExplorer
          rows={rows}
          categories={categories}
          initial={filters}
          forcedState={explorerForced}
        />
      </div>

      {/* Featured metals — compact navigation only, no fabricated data. */}
      <div className="mt-10">
        <Label>Jump to a metal</Label>
        <ul className="mt-3 flex flex-wrap gap-2">
          {rows.map((row) => (
            <li key={row.slug}>
              <Link
                href={`/markets/${row.slug}`}
                className="inline-flex rounded-pill border border-border bg-surface px-3 py-1 text-body-s text-foreground transition-colors hover:border-border-strong hover:text-primary"
              >
                {row.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* How to read this */}
      <div className="mt-10 rounded-lg border border-border bg-surface-muted p-6">
        <Label>How to read this</Label>
        <Body className="mt-2 text-muted-foreground">
          All values on this page are indicative development sample data and are
          not live. A reference price is a market benchmark, expressed in its
          native unit and in USD. Movement columns show percentage change over
          24 hours, 7 days, and 30 days. Unavailable values show an em dash, not
          a zero.
        </Body>
      </div>

      <BenchmarkDisclaimer className="mt-8" />

      {/* Enquiry CTA */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/enquire/supply" className={buttonVariants()}>
          I have metal to sell
        </Link>
        <Link
          href="/enquire/buying-requirement"
          className={buttonVariants({ variant: "secondary" })}
        >
          I want to source metal
        </Link>
      </div>
    </Section>
  )
}
