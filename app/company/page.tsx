import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/editorial/section-heading"
import { H2, Lead } from "@/components/ui/typography"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRightIcon } from "@/components/ui/icon"
import { TrustFramework } from "@/components/trade/trust-framework"
import { CompanyHero } from "@/components/company/company-hero"
import { OperatingModel } from "@/components/company/operating-model"
import { MetalCategories } from "@/components/company/metal-categories"
import { ResponsibleSourcing } from "@/components/company/responsible-sourcing"
import { DueDiligence } from "@/components/company/due-diligence"
import { ProofPoints } from "@/components/company/proof-points"
import { regionsNote } from "@/data/config/company"

export const metadata: Metadata = {
  title: "Company",
  description:
    "How Oriental Energy and Minerals Limited operates as a licensed mineral aggregator: the operating model, commodities, trade assurance, verification, and regions. Details confirmed per enquiry.",
}

export default function CompanyPage() {
  return (
    <>
      <CompanyHero />

      {/* Role in the value chain — numbered sequence */}
      <Section>
        <SectionHeading
          eyebrow="How we work"
          title="Our role in the value chain"
          lead="As the aggregator, we sit between reviewed supply and vetted demand, reviewing, inspecting, and coordinating each transaction. Suppliers and buyers are not introduced to each other."
        />
        <div className="mt-8">
          <OperatingModel />
        </div>
      </Section>

      {/* Commodities — link list */}
      <Section surface="muted">
        <SectionHeading eyebrow="Commodities" title="Commodities we handle" />
        <div className="mt-8 max-w-2xl">
          <MetalCategories />
        </div>
      </Section>

      {/* Regions and counterparties */}
      <Section>
        <SectionHeading
          eyebrow="Regions and counterparties"
          title="Where we work"
          lead={regionsNote}
        />
      </Section>

      {/* Trade assurance — reused stepper */}
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

      {/* Responsible sourcing — checklist */}
      <Section surface="muted">
        <SectionHeading
          eyebrow="Responsible sourcing"
          title="Provenance and material evidence"
          lead="The checks and documentation we apply before and during a trade."
        />
        <div className="mt-8">
          <ResponsibleSourcing />
        </div>
      </Section>

      {/* Verification on request — compact rows */}
      <Section>
        <SectionHeading
          eyebrow="Verification"
          title="Verification on request"
          lead="Verification we can provide to vetted suppliers and buyers on request. Licensing documents are not posted publicly, because they can be copied."
        />
        <div className="mt-8">
          <DueDiligence />
        </div>
      </Section>

      {/* Proof points — understated placeholder */}
      <Section surface="muted">
        <SectionHeading eyebrow="Evidence" title="Operating facts" />
        <div className="mt-8 max-w-3xl">
          <ProofPoints />
        </div>
      </Section>

      {/* Contact CTA */}
      <section className="bg-mineral text-mineral-foreground">
        <Container className="py-20 md:py-24">
          <div className="max-w-[46ch]">
            <H2 className="text-mineral-foreground">Work with our team</H2>
            <Lead className="mt-4 text-mineral-foreground/80">
              Tell us what you have or what you need, and a member of the team
              will review it with you.
            </Lead>
          </div>
          <div className="mt-8">
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              Discuss a requirement
              <ArrowRightIcon />
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
