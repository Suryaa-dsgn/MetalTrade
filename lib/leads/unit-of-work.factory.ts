import "server-only"

import { serverConfig } from "@/lib/config/env"
import type { RepositoryDurability } from "@/lib/leads/repository/types"
import { getLeadRepository } from "@/lib/leads/repository"
import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import { PostgresLeadRepository } from "@/lib/leads/repository/postgres"
import { PostgresLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.pg"
import { getSharedMemoryDeliveryRepository } from "@/lib/leads/notification/delivery"
import { withPgTransaction } from "@/lib/leads/db/pg-executor"
import {
  InMemoryLeadUnitOfWork,
  type LeadTxRepositories,
  type LeadUnitOfWork,
} from "@/lib/leads/unit-of-work"

/*
  Backend Phase 2E-1 — Lead Unit of Work factory. Selects by the validated, server-only
  `LEAD_STORE`, mirroring the lead-repository factory:

    - "postgres" → PostgresLeadUnitOfWork (a real transaction over a pooled client)
    - "memory"   → InMemoryLeadUnitOfWork (ephemeral; dev/test)

  There is NO silent fallback: a "postgres" selection that is unconfigured fails every
  query (fail closed). Production safety against an ephemeral store is enforced at the
  service boundary via the `durability` capability.
*/

/** Postgres Unit of Work — runs the callback inside one BEGIN/COMMIT transaction,
 *  constructing transaction-scoped repositories bound to that transaction. */
class PostgresLeadUnitOfWork implements LeadUnitOfWork {
  readonly durability: RepositoryDurability = "durable"

  run<T>(fn: (repos: LeadTxRepositories) => Promise<T>): Promise<T> {
    return withPgTransaction((tx) =>
      fn({
        leads: new PostgresLeadRepository(tx),
        deliveries: new PostgresLeadNotificationDeliveryRepository(tx),
      })
    )
  }
}

let postgresInstance: LeadUnitOfWork | null = null
let memoryInstance: LeadUnitOfWork | null = null

export function getLeadUnitOfWork(): LeadUnitOfWork {
  if (serverConfig.leadStore === "postgres") {
    if (!postgresInstance) postgresInstance = new PostgresLeadUnitOfWork()
    return postgresInstance
  }
  if (!memoryInstance) {
    // Share the SAME in-memory lead store the repository factory hands out, so the
    // direct-repository view and the Unit of Work never diverge in memory mode.
    const shared = getLeadRepository()
    const leads =
      shared instanceof InMemoryLeadRepository ? shared : new InMemoryLeadRepository()
    memoryInstance = new InMemoryLeadUnitOfWork(
      leads,
      getSharedMemoryDeliveryRepository()
    )
  }
  return memoryInstance
}
