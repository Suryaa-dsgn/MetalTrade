import type { Metadata } from "next"

import { GeneralForm } from "@/components/forms/general-form"

export const metadata: Metadata = {
  title: "General enquiry",
  description:
    "Any other question for the trade desk. Development demo. No CRM or email submission occurs.",
}

export default function GeneralEnquiryPage() {
  return <GeneralForm />
}
