import type { ContactEnquiryType, ContactEnquiryValues } from "@/lib/validation/enquiry"

/*
  Lead domain (Backend Phase 2A). The Lead entity holds ONLY business/customer
  enquiry data. Operational delivery state (email/CRM/webhook) is a SEPARATE concept
  (`NotificationDelivery`) so future channels are never forced into one Lead object.
  `correlationId` is observability metadata (submission context + logs), not a Lead
  business field.
*/

/** Flat business labels — not a workflow state machine (set by admins later). */
export type LeadStatus = "new" | "contacted" | "qualified" | "closed"

/** Where a lead originated; extensible (e.g. "api", "import") without a schema change. */
export type LeadSource = "contact-form"

export type LeadContact = {
  name: string
  email: string
  phone?: string
  company?: string
  country: string
}

export type Lead = {
  /** Internal, opaque id — never exposed publicly, never a sequential DB id. */
  id: string
  /** Public, human-friendly, unique reference (OEML-YYYY-XXXXXX). */
  reference: string
  createdAt: string
  updatedAt: string
  status: LeadStatus
  enquiryType: ContactEnquiryType
  contact: LeadContact
  commodity?: string
  quantity?: string
  origin?: string
  destination?: string
  message: string
  source: LeadSource
  /** Idempotency key for atomic create-or-return-existing. */
  submissionToken: string
  /** Small, non-PII, optional operational tags. */
  metadata?: Record<string, string>
}

/** The validated form payload the submission service accepts. */
export type LeadInput = ContactEnquiryValues

/** Observability + idempotency context for one submission (kept off the Lead). */
export type LeadSubmissionContext = {
  submissionToken: string
  correlationId: string
  source: LeadSource
}

// --- Notification delivery (separate operational concept) --------------------

export type NotificationChannel = "log" | "email" | "crm" | "webhook"
export type NotificationDeliveryStatus = "pending" | "sent" | "failed"

/** Operational record of a notification attempt for a lead over one channel. A lead
 *  may have many deliveries (one per channel). Kept out of the Lead entity. */
export type NotificationDelivery = {
  leadId: string
  channel: NotificationChannel
  provider: string
  status: NotificationDeliveryStatus
  attempts: number
  lastAttemptAt?: string
  lastErrorClass?: string
}
