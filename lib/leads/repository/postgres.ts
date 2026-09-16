import type { Lead } from "@/lib/leads/types"
import {
  LeadReferenceCollisionError,
  type CreateOrGetResult,
  type LeadReader,
  type LeadRepository,
} from "@/lib/leads/repository/types"
import {
  type SqlExecutor,
  isUniqueViolation,
  violatesConstraint,
} from "@/lib/leads/db/executor"
import { rowToLead, leadToParams } from "@/lib/leads/repository/mapping"

/*
  Backend Phase 2C — durable PostgreSQL LeadRepository. Depends only on the
  SqlExecutor port (a `pg.Pool` in production, PGlite in tests) — this is the only
  layer that knows SQL. All queries are parameterized ($1…$18).

  Atomic idempotency: a single `INSERT … ON CONFLICT ON CONSTRAINT
  leads_submission_token_unique DO NOTHING RETURNING *`.
    - a row returned → we inserted it → created:true
    - no row → the submission_token already existed → SELECT + return it → created:false
  A `reference` collision is a DIFFERENT unique constraint (not the ON CONFLICT
  target), so it raises 23505 on leads_reference_unique → LeadReferenceCollisionError,
  which the service resolves by regenerating the reference and retrying. Token
  conflicts are therefore never mistaken for reference conflicts.
*/

const INSERT_SQL = `
  INSERT INTO leads (
    id, reference, submission_token, created_at, updated_at, status, enquiry_type,
    contact_name, contact_email, contact_phone, company, country, commodity,
    quantity, origin, destination, message, source
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
  ON CONFLICT ON CONSTRAINT leads_submission_token_unique DO NOTHING
  RETURNING *`

const SELECT_BY_TOKEN_SQL =
  "SELECT * FROM leads WHERE submission_token = $1"

const SELECT_BY_ID_SQL = "SELECT * FROM leads WHERE id = $1"

export class PostgresLeadRepository implements LeadRepository, LeadReader {
  readonly durability = "durable" as const

  constructor(private readonly exec: SqlExecutor) {}

  async getById(id: string): Promise<Lead | null> {
    const result = await this.exec.query(SELECT_BY_ID_SQL, [id])
    return result.rows.length === 1 ? rowToLead(result.rows[0]) : null
  }

  async createOrGet(lead: Lead): Promise<CreateOrGetResult> {
    try {
      const inserted = await this.exec.query(INSERT_SQL, leadToParams(lead))
      if (inserted.rows.length === 1) {
        return { created: true, lead: rowToLead(inserted.rows[0]) }
      }
      // submission_token already existed (DO NOTHING → no row): return the original.
      const existing = await this.exec.query(SELECT_BY_TOKEN_SQL, [lead.submissionToken])
      if (existing.rows.length === 1) {
        return { created: false, lead: rowToLead(existing.rows[0]) }
      }
      // Should not happen: conflict reported but no row present.
      throw new Error("submission_token conflict but existing lead not found")
    } catch (err) {
      if (isUniqueViolation(err) && violatesConstraint(err, "leads_reference_unique")) {
        throw new LeadReferenceCollisionError()
      }
      throw err // any other failure propagates → persistence failure upstream
    }
  }
}
