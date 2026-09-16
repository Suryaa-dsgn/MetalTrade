import type { LeadRepository, RepositoryDurability } from "@/lib/leads/repository/types"
import type { LeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository"
import { InMemoryLeadRepository } from "@/lib/leads/repository/memory"
import { InMemoryLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery/repository.memory"

/*
  Backend Phase 2E-1 — Lead Unit of Work: the smallest clean transaction abstraction
  the application layer uses to persist a lead and its notification INTENT atomically
  (transactional outbox). The service orchestrates the work through this port and
  holds no raw SQL; the concrete implementation owns the transaction boundary.

    uow.run(async ({ leads, deliveries }) => {
      const outcome = await leads.createOrGet(lead)
      if (outcome.created && intent) await deliveries.createIntent(intent)
      return outcome
    })

  Either both writes commit, or neither does (a throw inside `fn` rolls back). This
  interface is driver-agnostic and pure (no `server-only`) so it is testable in Node;
  the Postgres implementation + factory live in `unit-of-work.factory.ts`.
*/

export type LeadTxRepositories = {
  leads: LeadRepository
  deliveries: LeadNotificationDeliveryRepository
}

export interface LeadUnitOfWork {
  /** Production-safety capability (mirrors LeadRepository.durability). */
  readonly durability: RepositoryDurability
  /** Run `fn` in a single atomic scope; commit on resolve, roll back on throw. */
  run<T>(fn: (repos: LeadTxRepositories) => Promise<T>): Promise<T>
}

/*
  In-memory Unit of Work (dev/test). Models atomic rollback by snapshotting both
  stores before `fn` and restoring them if `fn` throws — the same all-or-nothing
  semantics a Postgres transaction provides.
*/
export class InMemoryLeadUnitOfWork implements LeadUnitOfWork {
  readonly durability: RepositoryDurability = "ephemeral"

  constructor(
    readonly leads: InMemoryLeadRepository = new InMemoryLeadRepository(),
    readonly deliveries: InMemoryLeadNotificationDeliveryRepository = new InMemoryLeadNotificationDeliveryRepository()
  ) {}

  async run<T>(fn: (repos: LeadTxRepositories) => Promise<T>): Promise<T> {
    const leadSnapshot = this.leads.snapshot()
    const deliverySnapshot = this.deliveries.snapshot()
    try {
      return await fn({ leads: this.leads, deliveries: this.deliveries })
    } catch (err) {
      this.leads.restore(leadSnapshot)
      this.deliveries.restore(deliverySnapshot)
      throw err
    }
  }
}

/*
  A Unit of Work wrapping a caller-supplied LeadRepository (+ optional delivery repo).
  Convenience for tests/composition that inject a single repository and do not need
  transactional rollback (e.g. a repository that throws before any write). It runs
  `fn` directly against the provided repositories.
*/
export class SingleRepositoryUnitOfWork implements LeadUnitOfWork {
  readonly durability: RepositoryDurability

  constructor(
    private readonly leads: LeadRepository,
    private readonly deliveries: LeadNotificationDeliveryRepository = new InMemoryLeadNotificationDeliveryRepository()
  ) {
    this.durability = leads.durability
  }

  run<T>(fn: (repos: LeadTxRepositories) => Promise<T>): Promise<T> {
    return fn({ leads: this.leads, deliveries: this.deliveries })
  }
}
