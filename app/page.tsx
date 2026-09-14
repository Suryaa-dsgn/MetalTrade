import type { Metadata } from "next"

import { getMarketOverview } from "@/lib/market/service"
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
    "Oriental Energy and Minerals Limited is a licensed mineral aggregator connecting physical commodity supply with vetted corporate and institutional demand, with material inspection and coordinated origin logistics.",
}

export default async function HomePage() {
  const { data: metals } = await getMarketOverview()

  return (
    <>
      <HomeHero />
      <MarketTicker metals={metals} />

      {/* What we trade */}
      <Section>
        <SectionHeading
          eyebrow="What we trade"
          title="Minerals and commodities across precious, base, battery, and energy categories"
          lead="Indicative sample benchmarks shown below are for demonstration only, not live prices. Forms and specifications are confirmed per enquiry."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {metals.map((metal) => (
            <MetalCard key={metal.slug} metal={metal} />
          ))}
        </div>
      </Section>

      {/* How we operate */}
      <Section surface="muted">
        <SectionHeading
          eyebrow="How we operate"
          title="From reviewed supply to vetted demand"
          lead="As the aggregator, we sit between reviewed supply and vetted demand, coordinating review, inspection, documentation, and origin logistics. Suppliers and buyers are not introduced to each other."
        />
        <div className="mt-8">
          <NetworkFlow />
        </div>
      </Section>

      {/* Supplier proposition */}
      <Section>
        <ValueProposition
          eyebrow="For suppliers"
          title="Bring material to vetted demand"
          lead="Present a supply position to a reviewed, inspected process, without exposing your material to a public market."
          points={[
            "Structured review of material type, quantity, location, and documents",
            "Inspection of your facility and goods by our engineer",
            "Independent third-party inspection and testing when a vetted buyer is in place",
            "Coordination of freight and customs at the origin airport or port",
          ]}
          cta={{ label: "I have material to supply", href: "/enquire/supply" }}
          image={homeAssets.supplier}
          imageSide="end"
        />
      </Section>

      {/* Buyer proposition */}
      <Section surface="muted">
        <ValueProposition
          eyebrow="For buyers"
          title="Source commodities to your specification"
          lead="Send your specification, volume, frequency, target price, and destination. We confirm details, propose suitable supply, and provide a price quote."
          points={[
            "Send specification, target volume, order frequency, target price, and destination",
            "Requirements confirmed and suitable supply proposed",
            "A price quote provided for the confirmed requirement",
            "Independent inspection coordinated; you handle customs at the destination",
          ]}
          cta={{
            label: "I want to source material",
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
          lead="Counterparty verification, material review, origin documentation, independent inspection, and coordinated origin logistics: a sequence applied to each transaction."
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
