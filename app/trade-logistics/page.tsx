import type { Metadata } from "next"
import Link from "next/link"

import { lifecycleNote } from "@/data/config/logistics"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/editorial/section-heading"
import { Body, H2, Lead } from "@/components/ui/typography"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRightIcon } from "@/components/ui/icon"
import { LogisticsHero } from "@/components/trade/logistics-hero"
import { LogisticsTimeline } from "@/components/trade/logistics-timeline"
import { CapabilityModules } from "@/components/trade/capability-modules"
import { TransportModes } from "@/components/trade/transport-modes"
import { IncotermExplainer } from "@/components/trade/incoterm-explainer"
import { ScopeBoundaries } from "@/components/trade/scope-boundaries"
import { LogisticsFaq } from "@/components/trade/logistics-faq"

export const metadata: Metadata = {
  title: "Trade & Logistics",
  description:
    "How physical metal trades move from source to destination: the trade lifecycle, coordination, transport modes, and Incoterms. General references; scope is agreed per transaction.",
}

export default function TradeLogisticsPage() {
  return (
    <>
      <LogisticsHero />

      {/* Trade lifecycle — the primary story */}
      <Section>
        <SectionHeading
          eyebrow="The trade lifecycle"
          title="A typical trade, stage by stage"
          lead="Physical metal moves through a coordinated sequence, from confirmation and verification to freight, customs, and delivery."
        />
        <div className="mt-8">
          <LogisticsTimeline />
        </div>
        <Body className="mt-6 text-body-s text-muted-foreground">
          {lifecycleNote}
        </Body>
      </Section>

      {/* Capabilities — supporting information */}
      <Section surface="muted">
        <SectionHeading
          eyebrow="Coordination"
          title="What the trade desk coordinates"
          lead="Supporting capability categories, arranged where agreed in the transaction."
        />
        <div className="mt-8">
          <CapabilityModules />
        </div>
      </Section>

      {/* Transport modes + Incoterms */}
      <Section>
        <SectionHeading
          eyebrow="Movement & terms"
          title="Transport modes and Incoterms"
        />
        <div className="mt-8">
          <TransportModes />
        </div>
        <div className="mt-12">
          <IncotermExplainer />
        </div>
      </Section>

      {/* Scope boundaries */}
      <Section surface="muted">
        <SectionHeading eyebrow="Scope" title="Clear boundaries" />
        <div className="mt-8">
          <ScopeBoundaries />
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        <div className="mt-8">
          <LogisticsFaq />
        </div>
      </Section>

      {/* Route enquiry CTA */}
      <section className="bg-mineral text-mineral-foreground">
        <Container className="py-20 md:py-24">
          <div className="max-w-[46ch]">
            <H2 className="text-mineral-foreground">Planning a route?</H2>
            <Lead className="mt-4 text-mineral-foreground/80">
              Share origin, destination, commodity, quantity, and timing, and the
              trade desk will review feasibility with you.
            </Lead>
          </div>
          <div className="mt-8">
            <Link
              href="/enquire/logistics"
              className={buttonVariants({ size: "lg" })}
            >
              Discuss a route
              <ArrowRightIcon />
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
