import "server-only"

import type { EnquiryIntent } from "@/lib/validation/enquiry"
import { serverConfig } from "@/lib/config/env"
import { logEnquirySink } from "@/lib/enquiries/sinks/log"

/*
  Enquiry delivery seam (Phase 10). `submitEnquiry` hands a validated enquiry to
  the selected sink; a real email/CRM integration implements this same interface
  and is chosen via ENQUIRY_SINK — the form contracts never change.

  No live email/CRM is connected in this phase. The default `log` sink records
  REDACTED operational metadata only (amendment 4); the `disabled` sink returns a
  submission error to exercise that path.

  The record carries the full validated `values` because a real sink needs them
  to deliver — but a sink MUST NOT log or leak them (the log sink never reads
  `values`).
*/
export type EnquiryDeliveryRecord = {
  intent: EnquiryIntent
  referenceId: string
  /** Correlates this submission's log lines (no PII). */
  correlationId?: string
  values: unknown
  submittedAt: string
  /** Attachments are never received server-side in this build; always false. */
  hasAttachments: boolean
}

export type EnquiryDeliveryResult = { ok: true } | { ok: false; error: string }

export interface EnquirySink {
  readonly name: string
  deliver(record: EnquiryDeliveryRecord): Promise<EnquiryDeliveryResult>
}

const disabledEnquirySink: EnquirySink = {
  name: "disabled",
  async deliver() {
    return { ok: false, error: "delivery_disabled" }
  },
}

export function getEnquirySink(): EnquirySink {
  switch (serverConfig.enquirySink) {
    case "disabled":
      return disabledEnquirySink
    case "log":
    default:
      return logEnquirySink
  }
}
