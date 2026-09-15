import type { Lead } from "@/lib/leads/types"
import {
  LeadReferenceCollisionError,
  type CreateOrGetResult,
  type LeadRepository,
} from "@/lib/leads/repository/types"

/*
  In-memory LeadRepository (Backend Phase 2A). Per server instance; leads do NOT
  survive a cold start (no database yet — a durable Postgres impl swaps in behind
  the same interface later). The check-and-insert runs in a single synchronous
  critical section (no `await` between read and write), so it is atomic under
  JavaScript's single-threaded model — the same create-or-return-existing semantics
  a UNIQUE(submission_token) constraint will enforce in Postgres.
*/
export class InMemoryLeadRepository implements LeadRepository {
  private readonly byToken = new Map<string, Lead>()
  private readonly references = new Set<string>()

  async createOrGet(lead: Lead): Promise<CreateOrGetResult> {
    // --- atomic critical section (synchronous) ---
    const existing = this.byToken.get(lead.submissionToken)
    if (existing) return { created: false, lead: existing }

    if (this.references.has(lead.reference)) {
      throw new LeadReferenceCollisionError()
    }

    this.byToken.set(lead.submissionToken, lead)
    this.references.add(lead.reference)
    return { created: true, lead }
    // --- end critical section ---
  }

  /** Test/ops helper — number of stored leads. */
  size(): number {
    return this.byToken.size
  }
}
