import type { Metadata } from "next"

import { getMarketOverview } from "@/lib/market/mock-adapter"
import { homeAssets } from "@/lib/assets/home"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/editorial/section-heading"
import { HomeHero } from "@/components/editorial/home-hero"
import { NetworkFlow } from "@/components/editorial/network-flow"
import { ValueProposition } from "@/components/editorial/value-proposition"
import { ProofSection } from "@/components/editorial/proof-section"
import { CtaBand } from "@/components/editorial/cta-band"
import { MarketTicker } from "@/components/market/market-ticker"
import { MetalCard } from "@/components/market/metal-card"
import { TrustFramework } from "@/components/trade/trust-framework"
import { LogisticsPreview } from "@/components/trade/logistics-preview"

export const metadata: Metadata = {
  description:
    "A physical metals intermediary connecting verified supply with qualified demand — with market benchmarks, material evidence, and logistics coordination.",
}

export default async function HomePage() {
  const metals = await getMarketOverview()

  return (
    <>
      <HomeHero />
      <MarketTicker metals={metals} />

      {/* What we trade */}
      <Section>
        <SectionHeading
          eyebrow="What we trade"
          title="Physical metals across base, precious, and battery categories"
          lead="Indicative sample benchmarks shown below are for demonstration only — not live prices. Confirmed forms and specifications are reviewed per enquiry."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {metals.map((metal) => (
            <MetalCard key={metal.slug} metal={metal} />
          ))}
        </div>
      </Section>

      {/* How the network works */}
      <Section surface="muted">
        <SectionHeading
          eyebrow="How the network works"
          title="Source to buyer, with control at every stage"
          lead="A trade desk sits between qualified supply and qualified demand — coordinating pricing context, documentation, verification, and movement."
        />
        <div className="mt-8">
          <NetworkFlow />
        </div>
      </Section>

      {/* Supplier proposition */}
      <Section>
        <ValueProposition
          eyebrow="For suppliers"
          title="Bring material to qualified demand"
          lead="Reach screened buyers with market context and a structured commercial review — without exposing your position to a public market."
          points={[
            "Access to qualified, screened buyer demand",
            "Independent market benchmark context for your material",
            "A structured commercial and documentation review",
            "Execution and logistics support through to delivery",
          ]}
          cta={{ label: "I have metal to sell", href: "/enquire/supply" }}
          image={homeAssets.supplier}
          imageSide="end"
        />
      </Section>

      {/* Buyer proposition */}
      <Section surface="muted">
        <ValueProposition
          eyebrow="For buyers"
          title="Source verified material to specification"
          lead="Define what you need and source it through qualified pathways, with inspection and logistics coordinated to your destination."
          points={[
            "Defined specification, grade, and documentation up front",
            "Verified supply pathways and counterparty qualification",
            "Independent inspection and assay coordinated where agreed",
            "Logistics and trade support to your destination",
          ]}
          cta={{
            label: "I want to source metal",
            href: "/enquire/buying-requirement",
          }}
          image={homeAssets.buyer}
          imageSide="start"
        />
      </Section>

      {/* Trust framework */}
      <Section>
        <SectionHeading
          eyebrow="Trade assurance"
          title="Trust from process and evidence"
          lead="Grade, purity, origin, assay, inspection, documentation, Incoterm, delivery — a sequence applied to each transaction."
        />
        <div className="mt-8">
          <TrustFramework />
        </div>
      </Section>

      {/* Logistics preview */}
      <Section surface="muted">
        <LogisticsPreview />
      </Section>

      {/* Proof / operating facts */}
      <Section>
        <ProofSection />
      </Section>

      {/* Final CTA */}
      <CtaBand />
    </>
  )
}
