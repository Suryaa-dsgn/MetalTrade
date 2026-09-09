import type { ReactNode } from "react"

import { Section } from "@/components/layout/section"
import { Breadcrumb, type Crumb } from "@/components/ui/breadcrumb"
import { H1, Lead } from "@/components/ui/typography"

/*
  Presentational framing shared by every enquiry form (amendment 2): breadcrumb,
  heading, intro, and the constrained reading column. The form (or the success
  panel) is passed as children; state lives in the form component.
*/
export function EnquiryShell({
  breadcrumb,
  title,
  intro,
  children,
}: {
  breadcrumb: Crumb[]
  title: string
  intro: string
  children: ReactNode
}) {
  return (
    <Section spacing="compact">
      <div className="mx-auto max-w-2xl">
        <Breadcrumb items={breadcrumb} />
        <H1 className="mt-6 text-h1">{title}</H1>
        <Lead className="mt-4">{intro}</Lead>
        <div className="mt-8">{children}</div>
      </div>
    </Section>
  )
}
