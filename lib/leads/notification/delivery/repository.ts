import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"

/*
  Backend Phase 2E-1 — durable notification-delivery repository port.

  Phase 2E-1 exposes ONLY the atomic intent write (mirrors the lead repository's
  minimal `createOrGet`). `claimDue`/`markSent`/`markRetry`/`markFailed` are the drain
  contract added in 2E-2/2E-3 — intentionally NOT declared here yet, so 2E-1 stays
  small and no unused surface ships.

  Atomicity: `createIntent` is a single create-or-return-existing keyed by the
  (lead_id, channel, purpose) identity, so a retried/concurrent submission never
  creates a second intent. It is designed to run INSIDE the same transaction as the
  lead insert (transactional outbox) — the Postgres impl is constructed with the
  transaction-scoped executor; the in-memory impl runs a synchronous critical section.
*/

export type CreateIntentResult = {
  /** true when this call inserted the intent; false when an existing one was
   *  returned for the same (lead, channel, purpose). */
  created: boolean
  delivery: LeadNotificationDelivery
}

export interface LeadNotificationDeliveryRepository {
  createIntent(delivery: LeadNotificationDelivery): Promise<CreateIntentResult>
}
