import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  Body,
  BodyS,
  Display,
  H1,
  H2,
  H3,
  H4,
  Label,
  Lead,
  Numeric,
  Price,
  PriceXL,
} from "@/components/ui/typography"
import {
  ArrowRightIcon,
  CheckIconGlyph,
  ChevronDown,
  CloseIcon,
  ExternalLinkIcon,
  MenuIcon,
  PlusControlIcon,
  SearchIcon,
  SortIcon,
  TrendDownIcon,
  TrendFlatIcon,
  TrendUpIcon,
} from "@/components/ui/icon"
import {
  AssayIcon,
  CertificateIcon,
  ContainerIcon,
  CounterpartyIcon,
  DocumentationIcon,
  FormsIcon,
  MetalIcon,
  ProcessIcon,
  RoadFreightIcon,
  SeaFreightIcon,
  SourceIcon,
  VerifiedIcon,
  WarehouseIcon,
} from "@/components/ui/domain-icon"

// Internal development route: never indexed.
export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
}

// ---- Local demo helpers (token demonstrations only, not real components) ----

function Swatch({
  name,
  hex,
  className,
}: {
  name: string
  hex: string
  className: string
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className={cn("h-16", className)} />
      <div className="bg-surface px-3 py-2">
        <div className="text-body-s font-medium text-foreground">{name}</div>
        <Numeric className="text-label uppercase tracking-label text-muted-foreground">
          {hex}
        </Numeric>
      </div>
    </div>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: "positive" | "info" | "warning" | "muted"
}) {
  const tones = {
    positive: "bg-positive-soft text-positive",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    muted: "bg-surface-subtle text-muted-foreground",
  } as const
  const dot = {
    positive: "bg-positive",
    info: "bg-info",
    warning: "bg-warning",
    muted: "bg-muted-foreground",
  } as const
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-body-s font-medium",
        tones[tone]
      )}
    >
      <span className={cn("size-1.5 rounded-pill", dot[tone])} aria-hidden />
      {label}
    </span>
  )
}

function Movement({
  direction,
  value,
}: {
  direction: "up" | "down" | "flat"
  value: string
}) {
  const map = {
    up: { Icon: TrendUpIcon, cls: "text-positive", label: "up" },
    down: { Icon: TrendDownIcon, cls: "text-negative", label: "down" },
    flat: { Icon: TrendFlatIcon, cls: "text-muted-foreground", label: "unchanged" },
  } as const
  const { Icon, cls, label } = map[direction]
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", cls)}>
      <Icon />
      <span>{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

const colorGroups: {
  title: string
  swatches: { name: string; hex: string; className: string }[]
}[] = [
  {
    title: "Surfaces",
    swatches: [
      { name: "background", hex: "#F7F4EF", className: "bg-background" },
      { name: "surface", hex: "#FFFFFF", className: "bg-surface" },
      { name: "surface-muted", hex: "#F2EEE7", className: "bg-surface-muted" },
      { name: "surface-subtle", hex: "#EDE8DF", className: "bg-surface-subtle" },
    ],
  },
  {
    title: "Brand",
    swatches: [
      { name: "primary", hex: "#2457D6", className: "bg-primary" },
      { name: "primary-hover", hex: "#1E40AF", className: "bg-primary-hover" },
      { name: "primary-soft", hex: "#E3ECFD", className: "bg-primary-soft" },
      { name: "orange", hex: "#E26D2D", className: "bg-orange" },
    ],
  },
  {
    title: "Editorial darks",
    swatches: [
      { name: "mineral", hex: "#1D2A35", className: "bg-mineral" },
      { name: "mineral-2", hex: "#2A3C49", className: "bg-mineral-2" },
      { name: "orange-soft", hex: "#FAE7DB", className: "bg-orange-soft" },
      { name: "foreground", hex: "#1E2833", className: "bg-foreground" },
    ],
  },
  {
    title: "Semantic status",
    swatches: [
      { name: "positive", hex: "#23784E", className: "bg-positive" },
      { name: "negative", hex: "#B33E31", className: "bg-negative" },
      { name: "warning", hex: "#A86D10", className: "bg-warning" },
      { name: "info", hex: "#1B6D92", className: "bg-info" },
    ],
  },
]

const surfaceMatrix: {
  name: string
  surface: string
  fg: string
  muted: string
  border: string
}[] = [
  {
    name: "background",
    surface: "bg-background",
    fg: "text-foreground",
    muted: "text-muted-foreground",
    border: "border-border",
  },
  {
    name: "surface",
    surface: "bg-surface",
    fg: "text-foreground",
    muted: "text-muted-foreground",
    border: "border-border",
  },
  {
    name: "surface-muted",
    surface: "bg-surface-muted",
    fg: "text-foreground",
    muted: "text-muted-foreground",
    border: "border-border-strong",
  },
  {
    name: "surface-subtle",
    surface: "bg-surface-subtle",
    fg: "text-foreground",
    muted: "text-muted-foreground",
    border: "border-border-strong",
  },
  {
    name: "mineral",
    surface: "bg-mineral",
    fg: "text-mineral-foreground",
    muted: "text-mineral-foreground/70",
    border: "border-white/15",
  },
  {
    name: "mineral-2",
    surface: "bg-mineral-2",
    fg: "text-mineral-foreground",
    muted: "text-mineral-foreground/70",
    border: "border-white/15",
  },
]

export default function StyleGuidePage() {
  // Disabled in production: this internal route 404s outside development.
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  return (
    <main>
      <Section spacing="compact" surface="muted">
        <Label>Internal · development only</Label>
        <Display className="mt-3">Design tokens & primitives</Display>
        <Lead className="mt-4">
          Phase 1 foundation verification surface. Not indexed and disabled in
          production. Every value here comes from the Design System tokens in
          globals.css.
        </Lead>
      </Section>

      {/* COLOR */}
      <Section>
        <H2>Color</H2>
        <Body className="mt-2">
          Light mode is the default. No purple, no gradients. Signal Orange is a
          sparse material accent.
        </Body>
        <div className="mt-8 space-y-8">
          {colorGroups.map((group) => (
            <div key={group.title}>
              <H4 className="mb-3">{group.title}</H4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {group.swatches.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SURFACE / CONTRAST MATRIX */}
      <Section surface="muted">
        <H2>Surface & contrast matrix</H2>
        <Body className="mt-2">
          Representative foreground, muted text, border, primary action, and icon
          treatment on each surface.
        </Body>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surfaceMatrix.map((row) => (
            <div
              key={row.name}
              className={cn(
                "rounded-lg border p-5",
                row.surface,
                row.border
              )}
            >
              <div className={cn("text-label uppercase tracking-label", row.muted)}>
                {row.name}
              </div>
              <div className={cn("mt-2 text-h4 tracking-normal", row.fg)}>
                Foreground text
              </div>
              <div className={cn("mt-1 text-body-s", row.muted)}>
                Muted supporting text
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Button size="sm">Primary</Button>
                <MetalIcon className={cn("size-5", row.fg)} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* TYPOGRAPHY */}
      <Section>
        <H2>Typography</H2>
        <Body className="mt-2">
          Geist Sans. Headlines tight; body open. Tabular numerals for market
          values.
        </Body>
        <div className="mt-8 space-y-6 border-t border-border pt-8">
          <div>
            <Label>Display</Label>
            <Display className="mt-1">From source to buyer</Display>
          </div>
          <div>
            <Label>H1</Label>
            <H1 className="mt-1">Connecting global metal supply</H1>
          </div>
          <div>
            <Label>H2</Label>
            <H2 className="mt-1">Market benchmarks with provenance</H2>
          </div>
          <div>
            <Label>H3</Label>
            <H3 className="mt-1">Copper cathodes and concentrates</H3>
          </div>
          <div>
            <Label>H4</Label>
            <H4 className="mt-1">Specifications and documentation</H4>
          </div>
          <div className="max-w-[70ch]">
            <Label>Lead</Label>
            <Lead className="mt-1">
              Evidence-based supporting copy that stays readable at a comfortable
              measure of roughly forty-five to seventy characters per line.
            </Lead>
          </div>
          <div className="max-w-[70ch]">
            <Label>Body</Label>
            <Body className="mt-1">
              Default reading copy. Trust must come from grade, purity, origin,
              assay, inspection, documentation, Incoterm, and delivery — not from
              unsupported adjectives.
            </Body>
          </div>
          <div>
            <Label>Body S</Label>
            <BodyS className="mt-1">Supporting copy and table cell text.</BodyS>
          </div>
        </div>
      </Section>

      {/* BUTTONS */}
      <Section surface="muted">
        <H2>Buttons</H2>
        <Body className="mt-2">
          Hierarchy per Design System §11.3. Tab to any button to see the focus
          ring.
        </Body>

        <H4 className="mt-8 mb-3">Variants</H4>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Submit supply details</Button>
          <Button variant="secondary">Request a conversation</Button>
          <Button variant="outline">View copper market</Button>
          <Button variant="ghost">Company</Button>
          <Button variant="destructive">Withdraw enquiry</Button>
          <Button variant="link">Read the disclaimer</Button>
        </div>

        <H4 className="mt-8 mb-3">With icons (via barrels)</H4>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            Discuss a requirement
            <ArrowRightIcon />
          </Button>
          <Button variant="secondary">
            <SearchIcon />
            Search metals
          </Button>
          <Button variant="outline">
            Provider docs
            <ExternalLinkIcon />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <MenuIcon />
          </Button>
        </div>

        <H4 className="mt-8 mb-3">Sizes</H4>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <PlusControlIcon />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Confirm">
            <CheckIconGlyph />
          </Button>
        </div>

        <H4 className="mt-8 mb-3">Disabled</H4>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Primary</Button>
          <Button variant="secondary" disabled>
            Secondary
          </Button>
          <Button variant="outline" disabled>
            Outline
          </Button>
        </div>
      </Section>

      {/* MARKET NUMERIC HIERARCHY */}
      <Section>
        <H2>Market numeric hierarchy</H2>
        <Body className="mt-2">
          Token demonstration only — not a market component. Movement always
          pairs colour with an arrow and text, never colour alone.
        </Body>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5">
            <Label>Copper · reference benchmark</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <PriceXL>8,420</PriceXL>
              <Numeric className="text-body-s text-muted-foreground">
                USD / MT
              </Numeric>
            </div>
            <div className="mt-2">
              <Movement direction="up" value="+1.21%" />
            </div>
            <Numeric className="mt-3 block text-label uppercase tracking-label text-muted-foreground">
              Updated 2026-09-08 14:30 UTC
            </Numeric>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <Label>Card price</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <Price>1,932.40</Price>
              <Numeric className="text-body-s text-muted-foreground">
                USD / oz
              </Numeric>
            </div>
            <div className="mt-2">
              <Movement direction="down" value="-0.42%" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <Label>Neutral movement & unavailable value</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <Price>—</Price>
              <Numeric className="text-body-s text-muted-foreground">
                USD / kg
              </Numeric>
            </div>
            <div className="mt-2">
              <Movement direction="flat" value="0.00%" />
            </div>
            <BodyS className="mt-3 text-muted-foreground">
              Unavailable values show an em dash, never a fake zero.
            </BodyS>
          </div>
        </div>

        <H4 className="mt-8 mb-3">Market statuses</H4>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label="Live" tone="positive" />
          <StatusBadge label="Delayed" tone="info" />
          <StatusBadge label="Stale" tone="warning" />
          <StatusBadge label="Unavailable" tone="muted" />
        </div>
      </Section>

      {/* ICONS */}
      <Section surface="muted">
        <H2>Icon barrels</H2>
        <Body className="mt-2">
          Chrome uses Heroicons (via <code>@/components/ui/icon</code>); domain
          uses Phosphor <em>regular</em> (via{" "}
          <code>@/components/ui/domain-icon</code>). Components never import icon
          libraries directly.
        </Body>

        <H4 className="mt-8 mb-3">Chrome (Heroicons)</H4>
        <div className="flex flex-wrap items-center gap-5 text-foreground">
          <MenuIcon />
          <CloseIcon />
          <SearchIcon />
          <ChevronDown />
          <SortIcon />
          <ArrowRightIcon />
          <ExternalLinkIcon />
          <span className="inline-flex items-center gap-1 text-positive">
            <TrendUpIcon /> up
          </span>
          <span className="inline-flex items-center gap-1 text-negative">
            <TrendDownIcon /> down
          </span>
        </div>

        <H4 className="mt-8 mb-3">Domain (Phosphor regular)</H4>
        <div className="flex flex-wrap items-center gap-5 text-foreground">
          <SourceIcon />
          <MetalIcon />
          <FormsIcon />
          <SeaFreightIcon />
          <RoadFreightIcon />
          <ContainerIcon />
          <WarehouseIcon />
          <VerifiedIcon />
          <CertificateIcon />
          <AssayIcon />
          <DocumentationIcon />
          <ProcessIcon />
          <CounterpartyIcon />
        </div>
      </Section>

      {/* LAYOUT PRIMITIVES */}
      <Section>
        <H2>Layout primitives</H2>
        <Body className="mt-2">
          <code>Container</code> centers content to 1440px with responsive
          gutters; <code>Section</code> sets vertical rhythm and surface. This
          band and the mineral band below are both <code>Section</code>s.
        </Body>

        <H4 className="mt-8 mb-3">Breadcrumb</H4>
        <Breadcrumb
          items={[
            { label: "Markets", href: "/markets" },
            { label: "Copper", href: "/markets/copper" },
            { label: "Specifications" },
          ]}
        />
      </Section>
      <Section surface="mineral" spacing="loose">
        <Label className="text-mineral-foreground/70">Editorial chapter</Label>
        <H2 className="mt-3 text-mineral-foreground">
          Mineral surface for deliberate dark chapters
        </H2>
        <Body className="mt-3 text-mineral-foreground/80">
          Warm-white text on a mineral background — an editorial chapter, not a
          separate dark theme.
        </Body>
        <div className="mt-6">
          <Button>
            Discuss a requirement
            <ArrowRightIcon />
          </Button>
        </div>
      </Section>

      <Container as="footer" className="border-t border-border py-8">
        <BodyS className="text-muted-foreground">
          Internal style guide · Phase 1 foundation.
        </BodyS>
      </Container>
    </main>
  )
}
