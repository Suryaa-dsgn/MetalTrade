/*
  Sec Phase 6 — lightweight correlation IDs.

  A correlation ID ties the log lines of a single logical operation together
  (incoming request → application service → provider/sink → success/failure)
  WITHOUT logging any PII. Deliberately minimal: a short opaque id, no
  AsyncLocalStorage, no distributed-tracing infrastructure (deferred).

  It is passed explicitly to the code paths that want it (currently the enquiry
  write path). Market reads already correlate via structured provider/benchmarkId/
  event fields; request-scoped correlation there would need context propagation and
  is intentionally out of scope for now.
*/

/** A short, opaque, non-guessable id. Carries no user data. */
export function newCorrelationId(): string {
  // Randomness source is available in the Node and edge server runtimes.
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid.replace(/-/g, "").slice(0, 12)
  // Fallback (should not be needed on supported runtimes).
  return Math.random().toString(36).slice(2, 14)
}
