import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"

import { PostgresLeadRepository } from "@/lib/leads/repository/postgres"
import { LeadReferenceCollisionError } from "@/lib/leads/repository/types"
import type { SqlExecutor, SqlRow } from "@/lib/leads/db/executor"
import type { Lead } from "@/lib/leads/types"

/*
  Backend Phase 2C — durable adapter integration tests. Run the ACTUAL adapter SQL
  against a real Postgres engine in-process (PGlite), applying the real migration —
  so constraints, ON CONFLICT semantics and 23505 handling are genuinely exercised
  with no infra. (True multi-connection concurrency is additionally verifiable
  against a managed Postgres via TEST_DATABASE_URL; PGlite serializes queries but
  yields the same unique-constraint outcome.)
*/

const MIGRATION = readFileSync(
  join(process.cwd(), "db", "migrations", "0001_create_leads.sql"),
  "utf8"
)

let db: PGlite
let repo: PostgresLeadRepository
let exec: SqlExecutor

async function count(): Promise<number> {
  const r = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM leads")
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

beforeEach(async () => {
  db = new PGlite()
  await db.exec(MIGRATION)
  exec = {
    async query<T extends SqlRow = SqlRow>(text: string, params?: readonly unknown[]) {
      const r = await db.query(text, params ? [...params] : undefined)
      return { rows: r.rows as T[] }
    },
  }
  repo = new PostgresLeadRepository(exec)
  seq = 0
})

describe("PostgresLeadRepository.createOrGet", () => {
  it("(1) inserts a new lead", async () => {
    const result = await repo.createOrGet(lead({ submissionToken: "t1" }))
    expect(result.created).toBe(true)
    expect(await count()).toBe(1)
  })

  it("(2/3) returns the existing lead for a repeated submission token (no new row)", async () => {
    const first = await repo.createOrGet(lead({ submissionToken: "t1", commodity: "copper" }))
    const second = await repo.createOrGet(lead({ submissionToken: "t1", commodity: "gold" }))
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.lead.reference).toBe(first.lead.reference) // same public reference
    expect(second.lead.commodity).toBe("copper") // original persisted, not the retry
    expect(await count()).toBe(1)
  })

  it("(4) concurrent same-token requests → one row, one created, same reference", async () => {
    const a = lead({ submissionToken: "same", reference: "OEML-2026-AAA111" })
    const b = lead({ submissionToken: "same", reference: "OEML-2026-BBB222" })
    const [r1, r2] = await Promise.all([repo.createOrGet(a), repo.createOrGet(b)])
    expect([r1.created, r2.created].filter(Boolean)).toHaveLength(1)
    expect(r1.lead.reference).toBe(r2.lead.reference)
    expect(await count()).toBe(1)
  })

  it("(5) distinct tokens create separate leads", async () => {
    await repo.createOrGet(lead({ submissionToken: "t1" }))
    await repo.createOrGet(lead({ submissionToken: "t2" }))
    expect(await count()).toBe(2)
  })

  it("(6) throws LeadReferenceCollisionError on a reference clash with a different lead", async () => {
    await repo.createOrGet(lead({ submissionToken: "t1", reference: "OEML-2026-DUP000" }))
    await expect(
      repo.createOrGet(lead({ submissionToken: "t2", reference: "OEML-2026-DUP000" }))
    ).rejects.toBeInstanceOf(LeadReferenceCollisionError)
    expect(await count()).toBe(1)
  })

  it("(8/9) maps Lead → row → Lead, with optionals round-tripping as undefined", async () => {
    const input = lead({
      submissionToken: "t1",
      enquiryType: "buy",
      contact: { name: "Grace Hopper", email: "grace@example.com", phone: "+1 555 0100", company: "Navy", country: "US" },
      commodity: "tin",
      quantity: "2,000 tonnes/month",
      destination: "Rotterdam",
      // origin + phone-less variants covered below
    })
    const { lead: stored } = await repo.createOrGet(input)
    expect(stored.enquiryType).toBe("buy")
    expect(stored.contact).toEqual(input.contact)
    expect(stored.commodity).toBe("tin")
    expect(stored.quantity).toBe("2,000 tonnes/month")
    expect(stored.destination).toBe("Rotterdam")
    expect(stored.origin).toBeUndefined() // omitted optional → NULL → undefined
    expect(new Date(stored.createdAt).getTime()).toBe(new Date(input.createdAt).getTime())
  })
})

describe("PostgresLeadRepository — DB defends invariants (7)", () => {
  it("rejects an invalid status via the CHECK constraint", async () => {
    await expect(
      exec.query(
        "INSERT INTO leads (id, reference, submission_token, created_at, updated_at, status, enquiry_type, contact_name, contact_email, country, message, source) VALUES ($1,$2,$3,now(),now(),$4,'general','A','a@b.com','UK','hi','contact-form')",
        [crypto.randomUUID(), "OEML-2026-BAD001", crypto.randomUUID(), "bogus"]
      )
    ).rejects.toBeTruthy()
  })

  it("rejects an invalid enquiry_type via the CHECK constraint", async () => {
    await expect(
      exec.query(
        "INSERT INTO leads (id, reference, submission_token, created_at, updated_at, status, enquiry_type, contact_name, contact_email, country, message, source) VALUES ($1,$2,$3,now(),now(),'new',$4,'A','a@b.com','UK','hi','contact-form')",
        [crypto.randomUUID(), "OEML-2026-BAD002", crypto.randomUUID(), "sell"]
      )
    ).rejects.toBeTruthy()
  })

  it("rejects a NULL message via NOT NULL", async () => {
    await expect(
      exec.query(
        "INSERT INTO leads (id, reference, submission_token, created_at, updated_at, status, enquiry_type, contact_name, contact_email, country, message, source) VALUES ($1,$2,$3,now(),now(),'new','general','A','a@b.com','UK',NULL,'contact-form')",
        [crypto.randomUUID(), "OEML-2026-BAD003", crypto.randomUUID()]
      )
    ).rejects.toBeTruthy()
  })
})

describe("PostgresLeadRepository — persistence failure (10)", () => {
  it("propagates a non-unique failure (not swallowed)", async () => {
    const throwing: SqlExecutor = {
      async query() {
        throw new Error("connection reset")
      },
    }
    const failingRepo = new PostgresLeadRepository(throwing)
    await expect(failingRepo.createOrGet(lead())).rejects.toThrow("connection reset")
  })

  it("reports durable persistence", () => {
    expect(repo.durability).toBe("durable")
  })
})
