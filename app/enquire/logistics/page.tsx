import type { Metadata } from "next"

import { LogisticsForm } from "@/components/forms/logistics-form"

export const metadata: Metadata = {
  title: "Discuss logistics",
  description:
    "Share a route for the trade desk to review. Development demo — no CRM or email submission occurs.",
}

export default function LogisticsEnquiryPage() {
  return <LogisticsForm />
}
