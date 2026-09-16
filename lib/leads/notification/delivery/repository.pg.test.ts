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
