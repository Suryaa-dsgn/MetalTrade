import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"

/*
  Backend Phase 2E — durable notification-delivery repository port.

  2E-1 added the atomic intent write (`createIntent`). 2E-2 adds EXPLICIT, validated
  state-transition methods for persisting a first-attempt outcome — deliberately not a
  generic `update()`, so the contract can only move a row through the allowed
  transitions. Each terminal transition increments `attempts` exactly once (a real
  provider send occurred) and stamps `last_attempt_at`; a transition is never called
  for a config problem (disabled/misconfigured/unsupported), so `attempts` only ever
  counts genuine send attempts.

  NOT here yet (final drain slice): `claimDue` / lease / FOR UPDATE SKIP LOCKED.
*/

export type CreateIntentResult = {
  /** true when this call inserted the intent; false when an existing one was
   *  returned for the same (lead, channel, purpose). */
  created: boolean
  delivery: LeadNotificationDelivery
}

export interface LeadNotificationDeliveryRepository {
  /** Atomic create-or-return-existing keyed by (lead, channel, purpose). Runs inside
   *  the lead transaction (transactional outbox). */
  createIntent(delivery: LeadNotificationDelivery): Promise<CreateIntentResult>

  /** Terminal success: status→sent, attempts+1, last_attempt_at=at,
   *  provider_message_id set, last_error_class + lock fields cleared. */
  markSent(id: string, at: string, providerMessageId?: string): Promise<void>

  /** Retryable outcome: status→pending, attempts+1, last_attempt_at=at,
   *  last_error_class set, next_attempt_at set (data only — no scheduler yet),
   *  lock fields cleared. */
  markRetry(
    id: string,
    at: string,
    errorClass: string,
    nextAttemptAt: string
  ): Promise<void>

  /** Terminal failure: status→failed, attempts+1, last_attempt_at=at,
   *  last_error_class set, lock fields cleared. No retry scheduled. */
  markFailed(id: string, at: string, errorClass: string): Promise<void>
}
