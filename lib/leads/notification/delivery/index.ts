import "server-only"

import { serverConfig } from "@/lib/config/env"
import { pgExecutor } from "@/lib/leads/db/pg-executor"
import type { LeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository"
import { InMemoryLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.memory"
import { PostgresLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.pg"

/*
  Backend Phase 2E — delivery repository factory. Selects by the validated, server-only
  `LEAD_STORE`, mirroring the lead-repository factory. In memory mode it returns a
  SHARED singleton so the Unit of Work (which writes the intent) and the post-commit
  first-attempt (which writes the outcome) operate on the SAME store. In Postgres mode
  both go to the same database (the intent via the transaction, the outcome via the
  pool afterwards). No silent fallback.
*/

let memoryInstance: InMemoryLeadNotificationDeliveryRepository | null = null
let postgresInstance: LeadNotificationDeliveryRepository | null = null

/** The shared in-memory delivery store (also consumed by the in-memory Unit of Work). */
export function getSharedMemoryDeliveryRepository(): InMemoryLeadNotificationDeliveryRepository {
  if (!memoryInstance) memoryInstance = new InMemoryLeadNotificationDeliveryRepository()
  return memoryInstance
}

export function getLeadNotificationDeliveryRepository(): LeadNotificationDeliveryRepository {
  if (serverConfig.leadStore === "postgres") {
    if (!postgresInstance) {
      postgresInstance = new PostgresLeadNotificationDeliveryRepository(pgExecutor)
    }
    return postgresInstance
  }
  return getSharedMemoryDeliveryRepository()
}
