import { permanentRedirect } from "next/navigation"

/*
  Consolidated into the unified Contact page (Contact redesign, Phase 1). This
  route is retained for backward compatibility and permanently (308) redirects to
  /contact with the supply enquiry type preselected. No form logic lives here.
*/
export default function SupplyEnquiryRedirect() {
  permanentRedirect("/contact?type=supply")
}
