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

export const metadata: Metadata = {
  title: "Company",
  description:
    "How the trade desk connects verified metal supply with qualified demand — the operating model, trade assurance, responsible sourcing, and due diligence. Working copy; details confirmed per engagement.",
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
          lead="A trade desk between qualified supply and qualified demand — evaluating, connecting, and coordinating each transaction."
        />
        <div className="mt-8">
          <OperatingModel />
        </div>
      </Section>

      {/* Market categories — link list */}
      <Section surface="muted">
        <SectionHeading
          eyebrow="Materials"
          title="Market categories"
        />
        <div className="mt-8 max-w-2xl">
          <MetalCategories />
        </div>
      </Section>

      {/* Trade assurance — reused stepper */}
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

      {/* Responsible sourcing — checklist */}
      <Section surface="muted">
        <SectionHeading
          eyebrow="Responsible sourcing"
          title="Provenance and material evidence"
          lead="Process and documentation applied where relevant to the counterparty and material."
        />
        <div className="mt-8">
          <ResponsibleSourcing />
        </div>
      </Section>

      {/* Due diligence — compact policy rows */}
      <Section>
        <SectionHeading
          eyebrow="Due diligence"
          title="Counterparty and document review"
          lead="Applied per transaction and jurisdiction. The scope of any review is transaction-specific."
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
            <H2 className="text-mineral-foreground">
              Work with the trade desk
            </H2>
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
