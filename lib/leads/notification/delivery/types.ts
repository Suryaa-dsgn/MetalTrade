/*
  Persistent notification-delivery domain (Backend Phase 2E-1). This is the DURABLE
  outbox record — separate from the `Lead` entity (notification state never returns to
  Lead) and from the lightweight in-flight `NotificationDelivery` the 2D dispatch loop
  produces for observability. One row per (lead, channel, purpose).

  Phase 2E-1 persists the INTENT only (`status:"pending"`). Attempt/claim/retry fields
  exist on the type but are driven in 2E-2/2E-3. The row holds NO PII — email content
  is rebuilt at send time from the leads row.
*/

/** Channels that can be durably delivered (excludes the no-op "log" channel). */
export type PersistedNotificationChannel = "email" | "crm" | "webhook"

/** The logical notification. Only `internal_lead_alert` is produced in Phase 2E; the
 *  others are reserved (forward-compatible) and NOT emitted yet. */
export type NotificationPurpose =
  | "internal_lead_alert"
  | "customer_acknowledgement"
  | "assignment_alert"

/** The single purpose produced in Phase 2E. */
export const INTERNAL_LEAD_ALERT = "internal_lead_alert" satisfies NotificationPurpose

export type PersistedDeliveryStatus = "pending" | "processing" | "sent" | "failed"

export type LeadNotificationDelivery = {
  /** Opaque delivery id (also the stable provider idempotency-key seed in 2E-2). */
  id: string
  /** FK → leads.id. */
  leadId: string
  channel: PersistedNotificationChannel
  purpose: NotificationPurpose
  /** Resolved provider name at intent time (e.g. "ses"/"resend"). Never "none". */
  provider: string
  status: PersistedDeliveryStatus
  /** Real delivery attempts made (config problems never increment this). */
  attempts: number
  /** When the row becomes due for (re)attempt. */
  nextAttemptAt: string
  lastAttemptAt?: string
  /** Failure classification only — never an error message, never PII. */
  lastErrorClass?: string
  providerMessageId?: string
  /** Claim lease (2E-3): set while `processing`. */
  lockedAt?: string
  lockedBy?: string
  createdAt: string
  updatedAt: string
}
