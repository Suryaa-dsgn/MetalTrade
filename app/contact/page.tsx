import type { Metadata } from "next"

import { ContactPage } from "@/components/contact/contact-page"
import { enquiryTypeFromParam } from "@/lib/enquiries/contact"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Discuss a requirement with Oriental Energy and Minerals — buying, supply, logistics, or a general enquiry. Share the details and our team will review it.",
}

export default async function ContactRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  // Validate ?type= against the allowlist; invalid/missing → no preselection.
  const preselectType = enquiryTypeFromParam(sp.type) ?? ""
  return <ContactPage preselectType={preselectType} />
}
