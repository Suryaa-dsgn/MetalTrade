import { permanentRedirect } from "next/navigation"

/*
  Consolidated into the unified Contact page (Contact redesign, Phase 1). Retained
  for backward compatibility; permanently (308) redirects to /contact with the
  supply enquiry type preselected. A legacy `?metal=` prefill is normalized to the
  canonical `commodity` param and validated on /contact. No form logic lives here.
*/
export default async function SupplyEnquiryRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const metal = typeof sp.metal === "string" ? sp.metal : undefined
  permanentRedirect(
    metal
      ? `/contact?type=supply&commodity=${encodeURIComponent(metal)}`
      : "/contact?type=supply"
  )
}
