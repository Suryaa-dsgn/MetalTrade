import type { SqlRow } from "@/lib/leads/db/executor"
import type {
  LeadNotificationDelivery,
  NotificationPurpose,
  PersistedDeliveryStatus,
  PersistedNotificationChannel,
} from "@/lib/leads/notification/delivery/types"

/*
  Backend Phase 2E-1 — pure mapping between the `lead_notification_deliveries` row and
  the LeadNotificationDelivery domain record. DELIVERY_COLUMNS order matches
  deliveryToParams(); both are the single source of truth for the INSERT. Nullable
  columns map to `undefined` (never "").
*/

export const DELIVERY_COLUMNS = [
  "id",
  "lead_id",
  "channel",
  "purpose",
  "provider",
  "status",
  "attempts",
  "next_attempt_at",
  "last_attempt_at",
  "last_error_class",
  "provider_message_id",
  "locked_at",
  "locked_by",
  "created_at",
  "updated_at",
] as const

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return new Date(String(value)).toISOString()
}

function optIso(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : toIso(value)
}

function opt(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : String(value)
}

/** DB row → LeadNotificationDelivery (order-independent; reads columns by name). */
export function rowToDelivery(row: SqlRow): LeadNotificationDelivery {
  return {
    id: String(row.id),
    leadId: String(row.lead_id),
    channel: String(row.channel) as PersistedNotificationChannel,
    purpose: String(row.purpose) as NotificationPurpose,
    provider: String(row.provider),
    status: String(row.status) as PersistedDeliveryStatus,
    attempts: Number(row.attempts),
    nextAttemptAt: toIso(row.next_attempt_at),
    lastAttemptAt: optIso(row.last_attempt_at),
    lastErrorClass: opt(row.last_error_class),
    providerMessageId: opt(row.provider_message_id),
    lockedAt: optIso(row.locked_at),
    lockedBy: opt(row.locked_by),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

/** LeadNotificationDelivery → positional params (order matches DELIVERY_COLUMNS). */
export function deliveryToParams(d: LeadNotificationDelivery): unknown[] {
  return [
    d.id,
    d.leadId,
    d.channel,
    d.purpose,
    d.provider,
    d.status,
    d.attempts,
    d.nextAttemptAt,
    d.lastAttemptAt ?? null,
    d.lastErrorClass ?? null,
    d.providerMessageId ?? null,
    d.lockedAt ?? null,
    d.lockedBy ?? null,
    d.createdAt,
    d.updatedAt,
  ]
}
