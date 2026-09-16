import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"

import { PostgresLeadRepository } from "@/lib/leads/repository/postgres"
import { PostgresLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.pg"
import type { SqlExecutor, SqlRow } from "@/lib/leads/db/executor"
import type { Lead } from "@/lib/leads/types"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"

/*
  Backend Phase 2E-1 — durable delivery adapter against a real Postgres engine
  in-process (PGlite), applying BOTH migrations. Exercises the actual SQL: the
  (lead_id, channel, purpose) unique identity, ON CONFLICT idempotency, that a second
  PURPOSE on the same channel is allowed, ON DELETE CASCADE, and row↔domain mapping.
*/

function migration(name: string): string {
  return readFileSync(join(process.cwd(), "db", "migrations", name), "utf8")
}

let db: PGlite
let exec: SqlExecutor
let leadRepo: PostgresLeadRepository
let deliveryRepo: PostgresLeadNotificationDeliveryRepository

async function countDeliveries(): Promise<number> {
  const r = await db.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM lead_notification_deliveries"
  )
  return r.rows[0].n
}

let seq = 0
function lead(overrides: Partial<Lead> = {}): Lead {
  seq++
  return {
    id: crypto.randomUUID(),
    reference: `OEML-2026-R${String(seq).padStart(5, "0")}`,
    submissionToken: crypto.randomUUID(),
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    status: "new",
    enquiryType: "general",
    contact: { name: "Ada", email: "ada@example.com", country: "UK" },
    message: "Hello there.",
    source: "contact-form",
    ...overrides,
  }
}

function intent(
  leadId: string,
  overrides: Partial<LeadNotificationDelivery> = {}
): LeadNotificationDelivery {
  return {
    id: crypto.randomUUID(),
    leadId,
    channel: "email",
    purpose: "internal_lead_alert",
    provider: "resend",
    status: "pending",
    attempts: 0,
    nextAttemptAt: "2026-09-16T10:00:00.000Z",
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    ...overrides,
  }
}

beforeEach(async () => {
  db = new PGlite()
  await db.exec(migration("0001_create_leads.sql"))
  await db.exec(migration("0002_create_lead_notification_deliveries.sql"))
  exec = {
    async query<T extends SqlRow = SqlRow>(text: string, params?: readonly unknown[]) {
      const r = await db.query(text, params ? [...params] : undefined)
      return { rows: r.rows as T[] }
    },
  }
  leadRepo = new PostgresLeadRepository(exec)
  deliveryRepo = new PostgresLeadNotificationDeliveryRepository(exec)
  seq = 0
})

describe("PostgresLeadNotificationDeliveryRepository.createIntent", () => {
  it("inserts a new pending intent and maps the row back", async () => {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    const result = await deliveryRepo.createIntent(intent(stored.id))
    expect(result.created).toBe(true)
    expect(result.delivery).toMatchObject({
      leadId: stored.id,
      channel: "email",
      purpose: "internal_lead_alert",
      provider: "resend",
      status: "pending",
      attempts: 0,
    })
    expect(result.delivery.lastAttemptAt).toBeUndefined()
    expect(result.delivery.providerMessageId).toBeUndefined()
    expect(await countDeliveries()).toBe(1)
  })

  it("(6) is idempotent on the same (lead, channel, purpose) — one row", async () => {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    const first = await deliveryRepo.createIntent(intent(stored.id))
    const second = await deliveryRepo.createIntent(intent(stored.id)) // different id, same identity
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.delivery.id).toBe(first.delivery.id) // the original row is returned
    expect(await countDeliveries()).toBe(1)
  })

  it("(7) allows a second PURPOSE on the same channel for the same lead", async () => {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    const a = await deliveryRepo.createIntent(intent(stored.id, { purpose: "internal_lead_alert" }))
    const b = await deliveryRepo.createIntent(
      intent(stored.id, { purpose: "customer_acknowledgement" })
    )
    expect(a.created).toBe(true)
    expect(b.created).toBe(true)
    expect(await countDeliveries()).toBe(2)
  })

  it("distinct leads get separate intents", async () => {
    const { lead: l1 } = await leadRepo.createOrGet(lead())
    const { lead: l2 } = await leadRepo.createOrGet(lead())
    await deliveryRepo.createIntent(intent(l1.id))
    await deliveryRepo.createIntent(intent(l2.id))
    expect(await countDeliveries()).toBe(2)
  })

  it("(11) ON DELETE CASCADE removes deliveries when the lead is deleted", async () => {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    await deliveryRepo.createIntent(intent(stored.id))
    expect(await countDeliveries()).toBe(1)
    await exec.query("DELETE FROM leads WHERE id = $1", [stored.id])
    expect(await countDeliveries()).toBe(0)
  })
})

describe("PostgresLeadNotificationDeliveryRepository.claimDue", () => {
  const NOW = new Date("2026-09-16T12:00:00.000Z")
  const LEASE = 60_000
  const claimOpts = (over: Record<string, unknown> = {}) => ({
    batchSize: 10,
    workerId: "worker-A",
    leaseDurationMs: LEASE,
    now: NOW,
    sendableProviders: ["resend"],
    ...over,
  })

  async function seed(over: Partial<LeadNotificationDelivery> = {}) {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    const { delivery } = await deliveryRepo.createIntent(intent(stored.id, over))
    return delivery
  }
  async function readRow(id: string) {
    const r = await exec.query(
      "SELECT * FROM lead_notification_deliveries WHERE id = $1",
      [id]
    )
    return r.rows[0]
  }

  it("(1) claims a due pending row", async () => {
    const d = await seed({ nextAttemptAt: "2026-09-16T11:59:00.000Z" })
    const claimed = await deliveryRepo.claimDue(claimOpts())
    expect(claimed.map((c) => c.id)).toContain(d.id)
    expect(claimed[0].reclaimed).toBe(false)
  })

  it("(2) does not claim a future-scheduled pending row", async () => {
    await seed({ nextAttemptAt: "2026-09-16T13:00:00.000Z" })
    const claimed = await deliveryRepo.claimDue(claimOpts())
    expect(claimed).toHaveLength(0)
  })

  it("(3) reclaims a processing row with an expired lease", async () => {
    const d = await seed({
      status: "processing",
      lockedAt: "2026-09-16T11:58:00.000Z", // 2 min ago > 60s lease
      lockedBy: "dead-worker",
    })
    const claimed = await deliveryRepo.claimDue(claimOpts())
    expect(claimed.map((c) => c.id)).toContain(d.id)
    expect(claimed[0].reclaimed).toBe(true)
  })

  it("(4) skips a processing row with an active lease", async () => {
    await seed({
      status: "processing",
      lockedAt: "2026-09-16T11:59:45.000Z", // 15s ago < 60s lease
      lockedBy: "live-worker",
    })
    const claimed = await deliveryRepo.claimDue(claimOpts())
    expect(claimed).toHaveLength(0)
  })

  it("(5) sets processing + locked_at + locked_by on claim (attempts untouched)", async () => {
    const d = await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    await deliveryRepo.claimDue(claimOpts({ workerId: "worker-XYZ" }))
    const row = await readRow(d.id)
    expect(row.status).toBe("processing")
    expect(new Date(String(row.locked_at)).toISOString()).toBe(NOW.toISOString())
    expect(row.locked_by).toBe("worker-XYZ")
    expect(Number(row.attempts)).toBe(0) // claiming is NOT a send
  })

  it("(6) a terminal outcome clears the lease fields", async () => {
    const d = await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    await deliveryRepo.claimDue(claimOpts())
    await deliveryRepo.markSent(d.id, NOW.toISOString(), "msg-1")
    const row = await readRow(d.id)
    expect(row.status).toBe("sent")
    expect(row.locked_at).toBeNull()
    expect(row.locked_by).toBeNull()
  })

  it("(7) respects the batch size", async () => {
    await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    const claimed = await deliveryRepo.claimDue(claimOpts({ batchSize: 2 }))
    expect(claimed).toHaveLength(2)
  })

  it("(8) orders by next_attempt_at (earliest first)", async () => {
    const later = await seed({ nextAttemptAt: "2026-09-16T11:30:00.000Z" })
    const earlier = await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    const claimed = await deliveryRepo.claimDue(claimOpts({ batchSize: 1 }))
    expect(claimed[0].id).toBe(earlier.id)
    expect(claimed[0].id).not.toBe(later.id)
  })

  it("(9) two sequential claimers receive disjoint rows", async () => {
    await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    const a = await deliveryRepo.claimDue(claimOpts({ batchSize: 1, workerId: "A" }))
    const b = await deliveryRepo.claimDue(claimOpts({ batchSize: 1, workerId: "B" }))
    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
    expect(a[0].id).not.toBe(b[0].id) // B skips A's claimed (active-lease) row
  })

  it("(14) claims nothing when there are no sendable providers", async () => {
    const d = await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z" })
    const claimed = await deliveryRepo.claimDue(claimOpts({ sendableProviders: [] }))
    expect(claimed).toHaveLength(0)
    expect(Number((await readRow(d.id)).attempts)).toBe(0)
  })

  it("only claims rows whose provider is sendable", async () => {
    await seed({ nextAttemptAt: "2026-09-16T11:00:00.000Z", provider: "resend" })
    const claimed = await deliveryRepo.claimDue(claimOpts({ sendableProviders: ["ses"] }))
    expect(claimed).toHaveLength(0) // provider mismatch
  })
})

describe("PostgresLeadNotificationDeliveryRepository — state transitions", () => {
  async function seedIntent() {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    const { delivery } = await deliveryRepo.createIntent(intent(stored.id))
    return delivery
  }
  async function readRow(id: string) {
    const r = await exec.query(
      "SELECT * FROM lead_notification_deliveries WHERE id = $1",
      [id]
    )
    return r.rows[0]
  }

  it("markSent → sent, attempts=1, provider_message_id, error cleared", async () => {
    const d = await seedIntent()
    await deliveryRepo.markSent(d.id, "2026-09-16T10:05:00.000Z", "msg-42")
    const row = await readRow(d.id)
    expect(row.status).toBe("sent")
    expect(Number(row.attempts)).toBe(1)
    expect(row.provider_message_id).toBe("msg-42")
    expect(row.last_error_class).toBeNull()
  })

  it("markRetry → pending, attempts=1, next_attempt_at + error class", async () => {
    const d = await seedIntent()
    await deliveryRepo.markRetry(
      d.id,
      "2026-09-16T10:05:00.000Z",
      "provider_5xx",
      "2026-09-16T10:10:00.000Z"
    )
    const row = await readRow(d.id)
    expect(row.status).toBe("pending")
    expect(Number(row.attempts)).toBe(1)
    expect(row.last_error_class).toBe("provider_5xx")
    expect(new Date(String(row.next_attempt_at)).toISOString()).toBe(
      "2026-09-16T10:10:00.000Z"
    )
  })

  it("markFailed → failed, attempts=1, error class", async () => {
    const d = await seedIntent()
    await deliveryRepo.markFailed(d.id, "2026-09-16T10:05:00.000Z", "rejected")
    const row = await readRow(d.id)
    expect(row.status).toBe("failed")
    expect(Number(row.attempts)).toBe(1)
    expect(row.last_error_class).toBe("rejected")
  })
})

describe("lead_notification_deliveries — DB defends invariants", () => {
  it("rejects an unknown status via the CHECK constraint", async () => {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    await expect(
      exec.query(
        `INSERT INTO lead_notification_deliveries
           (id, lead_id, channel, purpose, provider, status, attempts, next_attempt_at, created_at, updated_at)
         VALUES ($1,$2,'email','internal_lead_alert','resend',$3,0,now(),now(),now())`,
        [crypto.randomUUID(), stored.id, "bogus"]
      )
    ).rejects.toBeTruthy()
  })

  it("rejects an unknown purpose via the CHECK constraint", async () => {
    const { lead: stored } = await leadRepo.createOrGet(lead())
    await expect(
      exec.query(
        `INSERT INTO lead_notification_deliveries
           (id, lead_id, channel, purpose, provider, status, attempts, next_attempt_at, created_at, updated_at)
         VALUES ($1,$2,'email',$3,'resend','pending',0,now(),now(),now())`,
        [crypto.randomUUID(), stored.id, "spam_blast"]
      )
    ).rejects.toBeTruthy()
  })

  it("rejects an orphan delivery (no such lead) via the FK", async () => {
    await expect(
      deliveryRepo.createIntent(intent(crypto.randomUUID()))
    ).rejects.toBeTruthy()
  })
})
