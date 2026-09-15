import "server-only"

import type { EnquirySink } from "@/lib/enquiries/sink"
import { logger } from "@/lib/observability/logger"

/*
  Default enquiry sink (Phase 10, amendment 4). Records ONLY redacted operational
  metadata — intent, the DEMO reference, a timestamp, the delivery result, and an
  attachment boolean. It deliberately never reads `record.values`, so name,
  email, phone, message, origin/destination, commercial notes, and any document
  content never reach the server logs. No external delivery occurs.

  SECURITY (Sec Phase 1): emitted through the single structured logger so it
  passes the same secret-redaction backstop as the rest of the app instead of a
  raw `console.info`. Only non-PII metadata is passed; redaction is a safety net,
  not a licence to log payload fields.
*/
export const logEnquirySink: EnquirySink = {
  name: "log",
  async deliver({ intent, referenceId, correlationId, submittedAt, hasAttachments }) {
    logger.info("enquiry.received", {
      correlationId,
      intent,
      referenceId,
      submittedAt,
      hasAttachments,
      result: "accepted",
    })
    return { ok: true }
  },
}
