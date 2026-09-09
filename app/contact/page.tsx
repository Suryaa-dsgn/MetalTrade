import type { ComponentType } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { enquiryIntents } from "@/data/config/enquiry"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/editorial/section-heading"
import { Body, Label } from "@/components/ui/typography"
import { ArrowRightIcon } from "@/components/ui/icon"
import {
  ContainerIcon,
  CounterpartyIcon,
  DocumentationIcon,
  SourceIcon,
} from "@/components/ui/domain-icon"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How can we help? Route a supply position, a buying requirement, a logistics question, or a general enquiry to the trade desk.",
}

const intentIcons: Record<string, ComponentType<{ className?: string }>> = {
  supply: SourceIcon,
  buying: CounterpartyIcon,
  logistics: ContainerIcon,
  general: DocumentationIcon,
}

export default function ContactPage() {
  return (
    <Section spacing="compact">
      <SectionHeading
        eyebrow="Contact"
        title="How can we help?"
        lead="Choose the enquiry that fits. Each routes to the trade desk with the right context."
      />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {enquiryIntents.map((intent) => {
          const Icon = intentIcons[intent.iconKey]
          return (
            <li key={intent.id}>
              <Link
                href={intent.href}
                className="group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-primary" />
                  <ArrowRightIcon className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <span className="mt-4 text-h4 font-semibold text-foreground">
                  {intent.title}
                </span>
                <span className="mt-1 text-body-s text-muted-foreground">
                  {intent.description}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Monitored contact channels — placeholders (no invented details). */}
      <div className="mt-10 grid gap-6 rounded-lg border border-border bg-surface-muted p-6 sm:grid-cols-2">
        <div>
          <Label>Contact channels</Label>
          <Body className="mt-2 text-muted-foreground">
            Monitored phone and email will be published here once confirmed.
          </Body>
        </div>
        <div>
          <Label>Response &amp; hours</Label>
          <Body className="mt-2 text-muted-foreground">
            Response time and business hours are confirmed once the desk is
            contactable.
          </Body>
        </div>
        <div className="sm:col-span-2">
          <Label>Privacy</Label>
          <Body className="mt-2 text-muted-foreground">
            Details you share are used only to review and respond to your
            enquiry.
          </Body>
        </div>
      </div>
    </Section>
  )
}
