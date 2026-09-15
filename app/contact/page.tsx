import type { Metadata } from "next"

import { ContactPage } from "@/components/contact/contact-page"
import {
  enquiryTypeFromParam,
  commodityFromParam,
} from "@/lib/enquiries/contact"

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
  // Commodity prefill: accept the new ?commodity= or the legacy ?metal= (normalized
  // to one canonical field), validated against the catalogue; invalid → none.
  const preselectCommodity = commodityFromParam(sp.commodity ?? sp.metal) ?? ""
  return (
    <ContactPage
      preselectType={preselectType}
      preselectCommodity={preselectCommodity}
    />
  )
}
