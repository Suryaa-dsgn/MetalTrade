import { describe, it, expect } from "vitest"
import { InMemoryLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.memory"
import type { LeadNotificationDelivery } from "@/lib/leads/notification/delivery/types"

/* Backend Phase 2E-1 — in-memory delivery repository: identity idempotency +
   snapshot/restore (the primitive the in-memory Unit of Work uses to roll back). */

let n = 0
function intent(over: Partial<LeadNotificationDelivery> = {}): LeadNotificationDelivery {
  n++
  return {
    id: `d-${n}`,
    leadId: "lead-1",
    channel: "email",
    purpose: "internal_lead_alert",
    provider: "resend",
    status: "pending",
    attempts: 0,
    nextAttemptAt: "2026-09-16T10:00:00.000Z",
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    ...over,
  }
}

describe("InMemoryLeadNotificationDeliveryRepository", () => {
  it("createIntent returns the existing row for the same identity (no duplicate)", async () => {
    const repo = new InMemoryLeadNotificationDeliveryRepository()
    const a = await repo.createIntent(intent({ id: "d-a" }))
    const b = await repo.createIntent(intent({ id: "d-b" })) // same lead/channel/purpose
    expect(a.created).toBe(true)
    expect(b.created).toBe(false)
    expect(b.delivery.id).toBe("d-a")
    expect(repo.size()).toBe(1)
  })

  it("distinguishes a different purpose on the same channel", async () => {
    const repo = new InMemoryLeadNotificationDeliveryRepository()
    await repo.createIntent(intent({ purpose: "internal_lead_alert" }))
    await repo.createIntent(intent({ purpose: "customer_acknowledgement" }))
    expect(repo.size()).toBe(2)
  })

  it("restore reverts to a prior snapshot", async () => {
    const repo = new InMemoryLeadNotificationDeliveryRepository()
    const snap = repo.snapshot()
    await repo.createIntent(intent())
    expect(repo.size()).toBe(1)
    repo.restore(snap)
    expect(repo.size()).toBe(0)
  })
})

describe("InMemoryLeadNotificationDeliveryRepository.claimDue (2E-3)", () => {
  const NOW = new Date("2026-09-16T12:00:00.000Z")
  const opts = (over: Record<string, unknown> = {}) => ({
    batchSize: 10,
    workerId: "w1",
    leaseDurationMs: 60_000,
    now: NOW,
    sendableProviders: ["resend"],
    ...over,
  })

  it("claims a due pending row and marks it processing/locked (fresh, not reclaimed)", async () => {
    const repo = new InMemoryLeadNotificationDeliveryRepository()
    await repo.createIntent(intent({ leadId: "L1", nextAttemptAt: "2026-09-16T11:00:00.000Z" }))
    const claimed = await repo.claimDue(opts())
    expect(claimed).toHaveLength(1)
    expect(claimed[0].reclaimed).toBe(false)
    expect(claimed[0].status).toBe("processing")
    expect(claimed[0].lockedBy).toBe("w1")
  })

  it("does not claim a future pending row", async () => {
    const repo = new InMemoryLeadNotificationDeliveryRepository()
    await repo.createIntent(intent({ leadId: "L1", nextAttemptAt: "2026-09-16T13:00:00.000Z" }))
    expect(await repo.claimDue(opts())).toHaveLength(0)
  })

  it("reclaims an expired-lease processing row, skips an active one", async () => {
    const repo = new InMemoryLeadNotificationDeliveryRepository()
    await repo.createIntent(intent({ leadId: "L1", purpose: "internal_lead_alert", status: "processing", lockedAt: "2026-09-16T11:58:00.000Z" }))
    await repo.createIntent(intent({ leadId: "L2", purpose: "internal_lead_alert", status: "processing", lockedAt: "2026-09-16T11:59:50.000Z" }))
    const claimed = await repo.claimDue(opts())
    expect(claimed).toHaveLength(1)
    expect(claimed[0].reclaimed).toBe(true)
  })

  it("respects batch size and claims nothing without sendable providers", async () => {
    const repo = new InMemoryLeadNotificationDeliveryRepository()
    await repo.createIntent(intent({ leadId: "L1", nextAttemptAt: "2026-09-16T11:00:00.000Z" }))
    await repo.createIntent(intent({ leadId: "L2", nextAttemptAt: "2026-09-16T11:00:00.000Z" }))
    expect(await repo.claimDue(opts({ batchSize: 1 }))).toHaveLength(1)
    expect(await repo.claimDue(opts({ sendableProviders: [] }))).toHaveLength(0)
  })
})
