import "server-only"

import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import type { LeadRepository } from "@/lib/leads/repository/types"

/*
  LeadRepository factory (Backend Phase 2A). Returns the in-memory implementation as
  a per-instance singleton — the swap point for a durable store (Postgres) in a later
  phase, selected via an env selector then. No env var / provider selector is added
  now because only the in-memory implementation exists.
*/
let instance: LeadRepository | null = null

export function getLeadRepository(): LeadRepository {
  if (!instance) instance = new InMemoryLeadRepository()
  return instance
}
