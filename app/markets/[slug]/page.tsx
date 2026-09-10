import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import type { HistoryState } from "@/lib/market/types"
import { getContentSource } from "@/lib/content/source"
import { getMetalBySlug, getMetalDetail } from "@/lib/market/service"
import { formatPrice, formatUpdatedAtUTC } from "@/lib/formatters"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/editorial/section-heading"
import { AssetImage } from "@/components/editorial/asset-image"
import { Body, H1, H3, Label, Lead } from "@/components/ui/typography"
import { buttonVariants } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ArrowRightIcon } from "@/components/ui/icon"
import { FormsIcon } from "@/components/ui/domain-icon"
import { PriceChange } from "@/components/market/price-change"
import { MarketStatus } from "@/components/market/market-status"
import { MetalMarketPanel } from "@/components/market/metal-market-panel"
import { SpecTable } from "@/components/market/spec-table"
import { BenchmarkDisclaimer } from "@/components/market/benchmark-disclaimer"

export async function generateStaticParams() {
  const metals = await getContentSource().getMetals()
  return metals.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data: metal } = await getMetalBySlug(slug)
  if (!metal) return { title: "Metal" }
  return {
    title: metal.name,
    description: `Indicative ${metal.name} market benchmark, historical movement, and physical trade context. Development sample data. Not a live feed.`,
  }
}

function CtaRow({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href={`/enquire/supply?metal=${slug}`}
        className={buttonVariants()}
      >
        I have this metal to sell
      </Link>
      <Link
        href={`/enquire/buying-requirement?metal=${slug}`}
        className={buttonVariants({ variant: "secondary" })}
      >
        I want to source this metal
      </Link>
    </div>
  )
}

export default async function MetalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const { data: metal } = await getMetalBySlug(slug)
  if (!metal) notFound()

  const { data: detailData } = await getMetalDetail(slug)
  const q = metal.quote

  const crumbs = [
    { label: "Markets", href: "/markets" },
    { label: metal.name },
  ]

  // Minimal "in preparation" page for catalogue metals without full detail.
  if (!detailData) {
    return (
      <Section spacing="compact">
        <Breadcrumb items={crumbs} />
        <Label className="mt-6 block">{metal.category}</Label>
        <H1 className="mt-2">
          {metal.name}{" "}
          <span className="text-muted-foreground">{metal.symbol}</span>
        </H1>
        <Lead className="mt-4">{metal.summary}</Lead>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Label>Market benchmark</Label>
          <MarketStatus status={q.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <span className="text-price-l tabular-nums tracking-tight text-foreground">
            {q.price === null ? "—" : formatPrice(q.price)}
          </span>
          <span className="text-body-s text-muted-foreground">
            {q.currency}/{q.unit}
          </span>
          {q.price !== null ? <PriceChange change={q.change24h} /> : null}
          <span className="text-label uppercase tracking-label text-muted-foreground">
            Indicative sample · updated {formatUpdatedAtUTC(q.updatedAt)}
          </span>
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface-subtle px-6 py-8">
          <H3 as="p" className="text-h4">
            Detailed profile in preparation
          </H3>
          <Body className="mt-2 text-muted-foreground">
            The full {metal.name} profile (historical chart, statistics, and
            physical specifications) is being prepared. In the meantime, share a
            supply position or a buying requirement and the trade desk will
            respond.
          </Body>
        </div>

        <div className="mt-8">
          <CtaRow slug={slug} />
        </div>
        <div className="mt-6">
          <Link
            href="/markets"
            className="inline-flex items-center gap-1 rounded-sm text-body-s font-medium text-primary hover:underline"
          >
            Back to all markets
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </Section>
    )
  }

  // Full Copper template.
  const { detail, historySet } = detailData
  const sp = await searchParams
  const isDev = process.env.NODE_ENV !== "production"
  const raw = typeof sp.chart === "string" ? sp.chart : undefined
  const normalized = raw === "nodata" ? "no-data" : raw
  const forcedHistoryState: HistoryState | undefined =
    isDev &&
    (normalized === "loading" ||
      normalized === "no-data" ||
      normalized === "stale" ||
      normalized === "error")
      ? normalized
      : undefined

  return (
    <>
      <Section spacing="compact">
        <Breadcrumb items={crumbs} />
        <Label className="mt-6 block">{metal.category}</Label>
        <H1 className="mt-2">
          {metal.name}{" "}
          <span className="text-muted-foreground">{metal.symbol}</span>
        </H1>
        <Lead className="mt-4">{metal.summary}</Lead>
        <div className="mt-6">
          <CtaRow slug={slug} />
        </div>

        <div className="mt-10">
          <MetalMarketPanel
            quote={q}
            provider={detail.provider}
            statistics={detail.statistics}
            supportedRanges={detail.supportedRanges}
            historySet={historySet}
            forcedHistoryState={forcedHistoryState}
          />
        </div>
      </Section>

      {/* Physical material */}
      <Section surface="muted">
        <SectionHeading
          eyebrow="Physical material"
          title="Forms, grades, and documentation"
          lead="Specifications are indicative and confirmed per transaction. The trade desk aligns grade, assay, and documentation to each requirement."
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <AssetImage
            asset={metal.image}
            className="aspect-[4/3]"
            sizes="(min-width: 1024px) 50vw, 100vw"
            hoverZoom
          />
          <div>
            <div className="flex items-center gap-2">
              <FormsIcon className="size-5 text-muted-foreground" />
              <Label className="text-muted-foreground">Traded forms</Label>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {metal.forms.map((form) => (
                <li
                  key={form}
                  className="rounded-pill border border-border bg-surface px-3 py-1 text-body-s text-foreground"
                >
                  {form}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8">
          <SpecTable fields={detail.specifications} />
        </div>
      </Section>

      {/* Applications, regions, pricing factors */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div>
            <Label>Typical applications</Label>
            <ul className="mt-4 space-y-2 text-body text-foreground">
              {detail.applications.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <Label>Regions served</Label>
            <Body className="mt-4 text-muted-foreground">
              {detail.regionsNote}
            </Body>
          </div>
          <div>
            <Label>What affects the physical price</Label>
            <ul className="mt-4 space-y-2 text-body text-foreground">
              {detail.pricingFactors.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Disclaimer + CTA */}
      <Section surface="muted" spacing="compact">
        <BenchmarkDisclaimer />
        <div className="mt-8">
          <CtaRow slug={slug} />
        </div>
      </Section>
    </>
  )
}
