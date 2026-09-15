/*
  Sec Phase 4 — client identity derivation for rate limiting.

  Client IP headers (X-Forwarded-For, etc.) are trivially SPOOFABLE unless they
  are set by a trusted reverse proxy / host that strips any client-supplied value.
  We therefore only treat the derived key as trustworthy when the deployment
  explicitly asserts a trusted proxy (RATE_LIMIT_TRUST_PROXY=1). Otherwise the key
  is best-effort and marked untrusted, and the app limiter is defense-in-depth
  only — reliable per-client limiting depends on the edge layer.

  Pure function over a header getter so it is host-agnostic and unit-testable.
*/

export const CLIENT_IP_HEADER = "x-forwarded-for"

export type ClientIdentity = {
  /** Best-effort identity used as a rate-limit bucket key. */
  key: string
  /** True only when a trusted proxy is asserted AND a client IP was present. */
  trusted: boolean
}

export function deriveClientKey(
  getHeader: (name: string) => string | null | undefined,
  trustProxy: boolean
): ClientIdentity {
  const forwarded = getHeader(CLIENT_IP_HEADER)
  if (forwarded) {
    // Left-most entry is the original client per XFF convention. Still spoofable
    // unless a trusted proxy overwrote it.
    const first = forwarded.split(",")[0]?.trim()
    if (first) return { key: first, trusted: trustProxy }
  }
  // No usable client address: one shared bucket. Never trusted.
  return { key: "anonymous", trusted: false }
}
