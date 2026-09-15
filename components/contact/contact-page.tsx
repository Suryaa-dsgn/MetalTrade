import { Section } from "@/components/layout/section"
import { ContactIntro } from "@/components/contact/contact-intro"
import { ContactForm } from "@/components/contact/contact-form"
import type { ContactEnquiryType } from "@/lib/validation/enquiry"

/*
  Contact page shell. Balanced two-column layout on desktop (~1/3 intro, ~2/3 form);
  stacks to intro-above-form on tablet/mobile. The form is the interactive client
  island; the intro is static.
*/
export function ContactPage({
  preselectType = "",
  preselectCommodity = "",
}: {
  preselectType?: ContactEnquiryType | ""
  preselectCommodity?: string
}) {
  return (
    <Section spacing="compact">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <ContactIntro />
        </div>
        <div className="lg:col-span-8">
          <ContactForm
            defaultEnquiryType={preselectType}
            defaultCommodity={preselectCommodity}
          />
        </div>
      </div>
    </Section>
  )
}
