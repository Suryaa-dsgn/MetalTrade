import type { SqlExecutor } from "@/lib/leads/db/executor"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import type {
  ClaimDueOptions,
  ClaimedDelivery,
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

const MARK_SENT_SQL = `
  UPDATE lead_notification_deliveries
  SET status = 'sent', attempts = attempts + 1, last_attempt_at = $2,
      provider_message_id = $3, last_error_class = NULL,
      locked_at = NULL, locked_by = NULL, updated_at = $2
  WHERE id = $1`

const MARK_RETRY_SQL = `
  UPDATE lead_notification_deliveries
  SET status = 'pending', attempts = attempts + 1, last_attempt_at = $2,
      last_error_class = $3, next_attempt_at = $4,
      locked_at = NULL, locked_by = NULL, updated_at = $2
  WHERE id = $1`

const MARK_FAILED_SQL = `
  UPDATE lead_notification_deliveries
  SET status = 'failed', attempts = attempts + 1, last_attempt_at = $2,
      last_error_class = $3, locked_at = NULL, locked_by = NULL, updated_at = $2
  WHERE id = $1`

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

  async markSent(id: string, at: string, providerMessageId?: string): Promise<void> {
    await this.exec.query(MARK_SENT_SQL, [id, at, providerMessageId ?? null])
  }

  async markRetry(
    id: string,
    at: string,
    errorClass: string,
    nextAttemptAt: string
  ): Promise<void> {
    await this.exec.query(MARK_RETRY_SQL, [id, at, errorClass, nextAttemptAt])
  }

  async markFailed(id: string, at: string, errorClass: string): Promise<void> {
    await this.exec.query(MARK_FAILED_SQL, [id, at, errorClass])
  }

  async claimDue(options: ClaimDueOptions): Promise<ClaimedDelivery[]> {
    const { batchSize, workerId, leaseDurationMs, now, sendableProviders } = options
    if (sendableProviders.length === 0) return [] // nothing operable → claim nothing

    const nowIso = now.toISOString()
    const leaseCutoff = new Date(now.getTime() - leaseDurationMs).toISOString()
    // Provider allow-list as parameters (from server config, not user input — still
    // parameterized). Placeholders start at $5.
    const providerPlaceholders = sendableProviders
      .map((_, i) => `$${i + 5}`)
      .join(",")

    // A CTE selects + locks the eligible rows (SKIP LOCKED = concurrent drainers get
    // disjoint rows) and captures prior status so the caller can distinguish a fresh
    // claim from a crash-recovery reclaim. The UPDATE transitions them to processing.
    // attempts is deliberately NOT touched (claiming is not a send).
    const sql = `
      WITH candidate AS (
        SELECT id, status AS prev_status
        FROM lead_notification_deliveries
        WHERE provider IN (${providerPlaceholders})
          AND (
            (status = 'pending' AND next_attempt_at <= $1)
            OR (status = 'processing' AND locked_at < $3)
          )
        ORDER BY next_attempt_at
        FOR UPDATE SKIP LOCKED
        LIMIT $4
      )
      UPDATE lead_notification_deliveries d
      SET status = 'processing', locked_at = $1, locked_by = $2, updated_at = $1
      FROM candidate
      WHERE d.id = candidate.id
      RETURNING d.*, candidate.prev_status`

    const params = [nowIso, workerId, leaseCutoff, batchSize, ...sendableProviders]
    const result = await this.exec.query(sql, params)
    return result.rows.map((row) => ({
      ...rowToDelivery(row),
      reclaimed: String(row.prev_status) === "processing",
    }))
  }
}
