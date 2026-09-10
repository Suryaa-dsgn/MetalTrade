import type { Metadata } from "next"

import { CATALOGUE_METAL_SLUGS } from "@/data/config/enquiry"
import { BuyerForm } from "@/components/forms/buyer-form"

export const metadata: Metadata = {
  title: "Source metal",
  description:
    "Define a buying requirement for the trade desk. Development demo. No CRM or email submission occurs.",
}

export default async function BuyingEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const raw = typeof sp.metal === "string" ? sp.metal : undefined
  const defaultMetal =
    raw && CATALOGUE_METAL_SLUGS.includes(raw) ? raw : undefined
  return <BuyerForm defaultMetal={defaultMetal} />
}
