import "server-only"

import { getLeadReader } from "@/lib/leads/repository"
import { getLeadNotificationDeliveryRepository } from "@/lib/leads/notification/delivery"
import { resolveSendableEmail } from "@/lib/leads/notification/delivery/first-attempt.factory"
import {
  drainNotificationDeliveries,
  type DrainSummary,
} from "@/lib/leads/notification/delivery/drain"

/*
  Backend Phase 2E-3 — server-only drain wiring. Composes the durable delivery
  repository, the internal lead reader, and the config-resolved sendable providers into
  the host-agnostic drain dispatcher. Kept out of the pure dispatcher so that stays
  testable without config/`server-only`.
*/
export async function runNotificationDrain(workerId: string): Promise<DrainSummary> {
  return drainNotificationDeliveries({
    repository: getLeadNotificationDeliveryRepository(),
    leadReader: getLeadReader(),
    resolveSendable: resolveSendableEmail,
    workerId,
  })
}
