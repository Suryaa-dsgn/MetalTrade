import type { SqlExecutor } from "@/lib/leads/db/executor"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import type {
  CreateIntentResult,
  LeadNotificationDeliveryRepository,
} from "@/lib/leads/notification/delivery/repository"
import {
  rowToDelivery,
  deliveryToParams,
} from "@/lib/leads/notification/delivery/mapping"

/*
  Backend Phase 2E-1 — durable PostgreSQL delivery repository. Depends only on the
  SqlExecutor port (a shared pool in production, a transaction-scoped executor inside
  the Unit of Work, PGlite in tests). Only parameterized queries ($1…$15).

  Atomic intent create-or-get, mirroring the lead repository:
    INSERT … ON CONFLICT ON CONSTRAINT lead_notification_deliveries_identity_unique
    DO NOTHING RETURNING *
      - a row returned → inserted → created:true
      - no row → the (lead, channel, purpose) intent already existed → SELECT it →
        created:false
  No PII is read or written beyond the lead_id foreign key.
*/

const INSERT_SQL = `
  INSERT INTO lead_notification_deliveries (
    id, lead_id, channel, purpose, provider, status, attempts, next_attempt_at,
    last_attempt_at, last_error_class, provider_message_id, locked_at, locked_by,
    created_at, updated_at
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
  ON CONFLICT ON CONSTRAINT lead_notification_deliveries_identity_unique DO NOTHING
  RETURNING *`

const SELECT_BY_IDENTITY_SQL = `
  SELECT * FROM lead_notification_deliveries
  WHERE lead_id = $1 AND channel = $2 AND purpose = $3`

export class PostgresLeadNotificationDeliveryRepository
  implements LeadNotificationDeliveryRepository
{
  constructor(private readonly exec: SqlExecutor) {}

  async createIntent(
    delivery: LeadNotificationDelivery
  ): Promise<CreateIntentResult> {
    const inserted = await this.exec.query(INSERT_SQL, deliveryToParams(delivery))
    if (inserted.rows.length === 1) {
      return { created: true, delivery: rowToDelivery(inserted.rows[0]) }
    }
    // Identity already existed (DO NOTHING → no row): return the existing intent.
    const existing = await this.exec.query(SELECT_BY_IDENTITY_SQL, [
      delivery.leadId,
      delivery.channel,
      delivery.purpose,
    ])
    if (existing.rows.length === 1) {
      return { created: false, delivery: rowToDelivery(existing.rows[0]) }
    }
    // Should not happen: conflict reported but no row present.
    throw new Error("notification delivery conflict but existing intent not found")
  }
}
