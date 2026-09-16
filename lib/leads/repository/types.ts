import type { Lead } from "@/lib/leads/types"

/*
  Minimal submission repository (Backend Phase 2A). ONLY the write/idempotency
  contract the public form needs — no admin/read methods (those live in separate
  future interfaces: LeadQueryRepository, LeadManagementRepository).

  Idempotency must be ATOMIC: `createOrGet` is a single operation, never a
  find-then-create (which races). The future Postgres impl relies on
  UNIQUE(submission_token) (INSERT … ON CONFLICT DO NOTHING RETURNING …, or catch the
  unique violation and re-select); the in-memory impl runs its check-and-insert in a
  single synchronous critical section to simulate the same semantics.
*/

export type CreateOrGetResult = {
  /** true when this call inserted the lead; false when an existing lead was returned
   *  for the same submissionToken (idempotent retry). */
  created: boolean
  lead: Lead
}

/** Thrown when a lead's public reference collides with a DIFFERENT existing lead, so
 *  the caller regenerates the reference and retries. */
export class LeadReferenceCollisionError extends Error {
  constructor() {
    super("lead public reference collision")
    this.name = "LeadReferenceCollisionError"
  }
}

/** Persistence durability capability — lets the service enforce production safety
 *  without inspecting an implementation by filename/class. "ephemeral" stores lose
 *  data on restart / are not shared across instances (dev/test only). */
export type RepositoryDurability = "ephemeral" | "durable"

export interface LeadRepository {
  /** Whether this store is safe for production (durable) or dev/test only. */
  readonly durability: RepositoryDurability
  /** Atomically insert the lead, or return the existing lead with the same
   *  submissionToken. Throws LeadReferenceCollisionError on a reference clash with a
   *  different lead; throws on any other persistence failure. */
  createOrGet(lead: Lead): Promise<CreateOrGetResult>
}

/** Minimal internal read port (Backend Phase 2E-3). Used by the notification drain to
 *  rebuild email content from the durable lead (the delivery table holds no PII). NOT
 *  an admin listing/search API — that stays a separate future interface. */
export interface LeadReader {
  getById(id: string): Promise<Lead | null>
}
