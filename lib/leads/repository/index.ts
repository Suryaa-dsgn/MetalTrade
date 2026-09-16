import "server-only"

import { serverConfig } from "@/lib/config/env"
import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import { PostgresLeadRepository } from "@/lib/leads/repository/postgres"
import { pgExecutor } from "@/lib/leads/db/pg-executor"
import type { LeadRepository } from "@/lib/leads/repository/types"

/*
  LeadRepository factory (Backend Phase 2C). Selects the implementation from the
  validated, server-only config `LEAD_STORE`:

    - "postgres" → durable PostgresLeadRepository (over the shared pg pool)
    - "memory"   → in-memory (ephemeral; dev/test only)

  There is NO silent fallback: if "postgres" is selected but unconfigured, the
  Postgres repository's queries fail (fail closed) — we never quietly return the
  in-memory store, which would risk losing leads. Production safety against an
  ephemeral store is additionally enforced at the service boundary via the
  repository's `durability` capability.
*/
let memoryInstance: LeadRepository | null = null
let postgresInstance: LeadRepository | null = null

export function getLeadRepository(): LeadRepository {
  if (serverConfig.leadStore === "postgres") {
    if (!postgresInstance) postgresInstance = new PostgresLeadRepository(pgExecutor)
    return postgresInstance
  }
  if (!memoryInstance) memoryInstance = new InMemoryLeadRepository()
  return memoryInstance
}
