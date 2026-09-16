import { serverConfig } from "@/lib/config/env"
import { runNotificationDrain } from "@/lib/leads/notification/delivery/drain.factory"
import { handleDrainRequest } from "@/lib/leads/notification/delivery/drain-route"

/*
  Backend Phase 2E-3 — protected, host-agnostic drain entry point. A platform scheduler
  (undecided; NOT wired here) will POST to this route on an interval with the shared
  secret. The route is intentionally THIN: it only supplies the server-only secret, the
  drain runner, and an opaque per-invocation worker id — all logic lives in the handler
  and dispatcher. Not statically cached.
*/
export const dynamic = "force-dynamic"

export function POST(request: Request): Promise<Response> {
  return handleDrainRequest(request, {
    expectedSecret: serverConfig.notificationDrainSecret,
    runDrain: runNotificationDrain,
    makeWorkerId: () => crypto.randomUUID(),
  })
}
