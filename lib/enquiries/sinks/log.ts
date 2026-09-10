import "server-only"

import type { EnquirySink } from "@/lib/enquiries/sink"

/*
  Default enquiry sink (Phase 10, amendment 4). Records ONLY redacted operational
  metadata — intent, the DEMO reference, a timestamp, the delivery result, and an
  attachment boolean. It deliberately never reads `record.values`, so name,
  email, phone, message, origin/destination, commercial notes, and any document
  content never reach the server logs. No external delivery occurs.
*/
export const logEnquirySink: EnquirySink = {
  name: "log",
  async deliver({ intent, referenceId, submittedAt, hasAttachments }) {
    console.info("[enquiry] received", {
      intent,
      referenceId,
      submittedAt,
      hasAttachments,
      result: "accepted",
    })
    return { ok: true }
  },
}
