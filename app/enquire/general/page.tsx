import { permanentRedirect } from "next/navigation"

/*
  Consolidated into the unified Contact page (Contact redesign, Phase 1). Retained
  for backward compatibility; permanently (308) redirects to /contact with the
  general enquiry type preselected. No form logic lives here.
*/
export default function GeneralEnquiryRedirect() {
  permanentRedirect("/contact?type=general")
}
