import type { ProviderErrorCode } from "@/lib/market/providers/types"

/*
  Sec Phase 3 — bounded retry.

  AT MOST ONE retry, and ONLY for transient failures: a network error, a request
  timeout, or a vendor 5xx (server_error). Everything else fails immediately —
  auth, authorization, rate_limit, quota, bad_request, not_found, paid_gated,
  malformed, unknown — because retrying them is useless or harmful (e.g. a 429/quota
  retry only deepens the problem; those are handled by the circuit breaker + its
  cooldown instead). A single short jittered backoff, combined with the breaker and
  single-flight, prevents retry storms.
*/

export const RETRYABLE_CODES: ReadonlySet<ProviderErrorCode> = new Set<ProviderErrorCode>(
  ["network", "timeout", "server_error"]
)

function codeOf(err: unknown): string {
  return err && typeof err === "object" && "code" in err
    ? String((err as { code: unknown }).code)
    : "unknown"
}

export function isRetryable(err: unknown): boolean {
  return RETRYABLE_CODES.has(codeOf(err) as ProviderErrorCode)
}

export type RetryOptions = {
  /** Fixed base backoff before the single retry (ms). */
  baseDelayMs?: number
  /** Random jitter added to the base backoff (ms). */
  jitterMs?: number
  /** Injectable sleep for deterministic tests. */
  sleep?: (ms: number) => Promise<void>
  /** Notified once if a retry is attempted (for observability). */
  onRetry?: (code: string) => void
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Run `fn`, and on a transient failure retry it EXACTLY once after a short
 * jittered delay. A non-transient failure (or a second failure) propagates
 * without further attempts.
 */
export async function withSingleRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    baseDelayMs = 150,
    jitterMs = 150,
    sleep = defaultSleep,
    onRetry,
  } = opts

  try {
    return await fn()
  } catch (err) {
    if (!isRetryable(err)) throw err
    onRetry?.(codeOf(err))
    await sleep(baseDelayMs + Math.floor(Math.random() * jitterMs))
    // Single retry only: a further failure here propagates as-is.
    return await fn()
  }
}
