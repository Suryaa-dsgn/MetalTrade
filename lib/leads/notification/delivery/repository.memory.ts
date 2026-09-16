import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"
import type {
  ClaimDueOptions,
  ClaimedDelivery,
  CreateIntentResult,
  LeadNotificationDeliveryRepository,
} from "@/lib/leads/notification/delivery/repository"

/*
  In-memory delivery repository (Backend Phase 2E-1). Dev/test only; ephemeral. The
  check-and-insert runs in a single synchronous critical section (no `await` between
  read and write), so it is atomic under JS's single-threaded model — the same
  create-or-return-existing semantics UNIQUE(lead_id, channel, purpose) enforces in
  Postgres. `snapshot`/`restore` let the in-memory Unit of Work model transactional
  rollback.
*/

function key(d: Pick<LeadNotificationDelivery, "leadId" | "channel" | "purpose">): string {
  return `${d.leadId}|${d.channel}|${d.purpose}`
}

export class InMemoryLeadNotificationDeliveryRepository
  implements LeadNotificationDeliveryRepository
{
  private readonly byIdentity = new Map<string, LeadNotificationDelivery>()

  async createIntent(
    delivery: LeadNotificationDelivery
  ): Promise<CreateIntentResult> {
    // --- atomic critical section (synchronous) ---
    const existing = this.byIdentity.get(key(delivery))
    if (existing) return { created: false, delivery: existing }
    this.byIdentity.set(key(delivery), delivery)
    return { created: true, delivery }
    // --- end critical section ---
  }

  private mutate(id: string, fn: (d: LeadNotificationDelivery) => void): void {
    for (const d of this.byIdentity.values()) {
      if (d.id === id) {
        fn(d)
        return
      }
    }
    throw new Error(`notification delivery not found: ${id}`)
  }

  async markSent(id: string, at: string, providerMessageId?: string): Promise<void> {
    this.mutate(id, (d) => {
      d.status = "sent"
      d.attempts += 1
      d.lastAttemptAt = at
      d.providerMessageId = providerMessageId
      d.lastErrorClass = undefined
      d.lockedAt = undefined
      d.lockedBy = undefined
      d.updatedAt = at
    })
  }

  async markRetry(
    id: string,
    at: string,
    errorClass: string,
    nextAttemptAt: string
  ): Promise<void> {
    this.mutate(id, (d) => {
      d.status = "pending"
      d.attempts += 1
      d.lastAttemptAt = at
      d.lastErrorClass = errorClass
      d.nextAttemptAt = nextAttemptAt
      d.lockedAt = undefined
      d.lockedBy = undefined
      d.updatedAt = at
    })
  }

  async markFailed(id: string, at: string, errorClass: string): Promise<void> {
    this.mutate(id, (d) => {
      d.status = "failed"
      d.attempts += 1
      d.lastAttemptAt = at
      d.lastErrorClass = errorClass
      d.lockedAt = undefined
      d.lockedBy = undefined
      d.updatedAt = at
    })
  }

  async claimDue(options: ClaimDueOptions): Promise<ClaimedDelivery[]> {
    const { batchSize, workerId, leaseDurationMs, now, sendableProviders } = options
    if (sendableProviders.length === 0) return []

    const nowMs = now.getTime()
    const nowIso = now.toISOString()
    const leaseCutoffMs = nowMs - leaseDurationMs
    const sendable = new Set(sendableProviders)

    // --- atomic critical section (synchronous claim + transition) ---
    const eligible = [...this.byIdentity.values()].filter((d) => {
      if (!sendable.has(d.provider)) return false
      if (d.status === "pending") return new Date(d.nextAttemptAt).getTime() <= nowMs
      if (d.status === "processing") {
        return d.lockedAt !== undefined && new Date(d.lockedAt).getTime() < leaseCutoffMs
      }
      return false
    })
    eligible.sort(
      (a, b) => new Date(a.nextAttemptAt).getTime() - new Date(b.nextAttemptAt).getTime()
    )

    const claimed: ClaimedDelivery[] = []
    for (const d of eligible.slice(0, batchSize)) {
      const reclaimed = d.status === "processing"
      d.status = "processing"
      d.lockedAt = nowIso
      d.lockedBy = workerId
      d.updatedAt = nowIso
      claimed.push({ ...d, reclaimed })
    }
    return claimed
    // --- end critical section ---
  }

  /** Test/ops helper — number of stored delivery intents. */
  size(): number {
    return this.byIdentity.size
  }

  /** Test helper — all stored deliveries. */
  all(): LeadNotificationDelivery[] {
    return [...this.byIdentity.values()]
  }

  /** Opaque snapshot for Unit-of-Work rollback. */
  snapshot(): Map<string, LeadNotificationDelivery> {
    return new Map(this.byIdentity)
  }

  restore(snapshot: Map<string, LeadNotificationDelivery>): void {
    this.byIdentity.clear()
    for (const [k, v] of snapshot) this.byIdentity.set(k, v)
  }
}
