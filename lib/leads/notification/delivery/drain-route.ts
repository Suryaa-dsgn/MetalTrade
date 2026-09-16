import { timingSafeEqual } from "node:crypto"

import type { DrainSummary } from "@/lib/leads/notification/delivery/drain"

/*
  Backend Phase 2E-3 — testable drain-route handler, decoupled from Next and config so
  the auth + response contract can be unit-tested with any secret. The thin App Router
  route supplies the real secret + drain runner + worker-id generator.

  Auth: a fixed `Authorization: Bearer <secret>` compared in constant time. A missing
  configured secret, a missing header, or a mismatch all reject with 401. The secret is
  never echoed, never logged, and never read from the query string. The response
  carries only operational counts — no leads, emails, bodies, credentials, or DB info.
*/

const BEARER = /^Bearer (.+)$/

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  // Length is not itself the secret; unequal lengths cannot be timing-safe compared.
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** True only when the request carries the exact expected bearer secret. A falsy
 *  `expectedSecret` (unconfigured) always returns false → fail closed. */
export function authorizeDrainRequest(
  request: Request,
  expectedSecret: string | undefined
): boolean {
  if (!expectedSecret) return false
  const header = request.headers.get("authorization")
  if (!header) return false
  const match = BEARER.exec(header)
  if (!match) return false
  return safeEqual(match[1], expectedSecret)
}

export type DrainRouteDeps = {
  expectedSecret: string | undefined
  runDrain: (workerId: string) => Promise<DrainSummary>
  makeWorkerId: () => string
}

/** Handle a drain request: authorize, run the drain with a fresh worker id, and return
 *  a minimal JSON summary. Never throws to the caller for an auth failure. */
export async function handleDrainRequest(
  request: Request,
  deps: DrainRouteDeps
): Promise<Response> {
  if (!authorizeDrainRequest(request, deps.expectedSecret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const summary = await deps.runDrain(deps.makeWorkerId())
  return Response.json({
    claimed: summary.claimed,
    sent: summary.sent,
    retryScheduled: summary.retryScheduled,
    failed: summary.failed,
  })
}
