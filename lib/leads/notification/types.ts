import type { Lead, NotificationChannel } from "@/lib/leads/types"

/*
  Notification provider seam (Backend Phase 2A). Provider-neutral: email/CRM/webhook
  are future adapters implementing this same contract, selected behind the seam. No
  provider is finalized and no SDK is added in this phase; the log provider is the
  only implementation.
*/

export type NotificationResult =
  | { ok: true }
  | { ok: false; code: string; retryable: boolean }

export interface NotificationProvider {
  readonly name: string
  readonly channel: NotificationChannel
  /** Whether the provider has everything it needs (e.g. credentials) to run. */
  isConfigured(): boolean
  /** Attempt to deliver a notification for the lead. Must not throw for expected
   *  failures — return a typed NotificationResult instead. */
  notify(lead: Lead): Promise<NotificationResult>
}
