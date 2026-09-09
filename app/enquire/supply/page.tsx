import type { Metadata } from "next"

import { CATALOGUE_METAL_SLUGS } from "@/data/config/enquiry"
import { SupplierForm } from "@/components/forms/supplier-form"

export const metadata: Metadata = {
  title: "Sell metal",
  description:
    "Bring a supply position to qualified demand. Development demo — no CRM or email submission occurs.",
}

export default async function SupplyEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const raw = typeof sp.metal === "string" ? sp.metal : undefined
  // Validate the ?metal= prefill against the catalogue (amendment 7).
  const defaultMetal =
    raw && CATALOGUE_METAL_SLUGS.includes(raw) ? raw : undefined
  return <SupplierForm defaultMetal={defaultMetal} />
}
