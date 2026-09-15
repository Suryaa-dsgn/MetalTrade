/*
  Submission idempotency token (Backend Phase 2B). Isomorphic + pure (no
  `server-only`, no React) so the client form and the server action share ONE
  definition. The token is an opaque idempotency key — NOT user identity: it is not
  stored in URLs/cookies/localStorage, not analytics metadata, and never logged raw
  (log a short fingerprint instead).
*/

/** Max accepted token length — reject arbitrarily large strings server-side. */
export const SUBMISSION_TOKEN_MAX = 64

// RFC 4122 shape (any version/variant). crypto.randomUUID() produces a v4 UUID.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Cryptographically strong token via the native Web Crypto API (no npm UUID dep). */
export function createSubmissionToken(): string {
  const c: Crypto | undefined = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()
  // Fallback for older runtimes: build a v4 UUID from getRandomValues.
  const bytes = new Uint8Array(16)
  c.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  )
}

/** Server-side validation: bounded length + UUID shape. Treats input as untrusted. */
export function isValidSubmissionToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= SUBMISSION_TOKEN_MAX &&
    UUID_PATTERN.test(value)
  )
}

/** Short, non-reversible fingerprint for logs (never log the raw token). */
export function tokenFingerprint(token: string): string {
  // FNV-1a 32-bit — enough to correlate log lines without exposing the token.
  let hash = 0x811c9dc5
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

/*
  Client-side token lifecycle. ONE token per logical submission attempt lifecycle:
  it is kept across validation failures, transient server/network errors, and
  double-submits, and only renewed when a genuinely NEW enquiry begins (a form
  reset). Framework-agnostic so the rules are unit-testable without React; the
  submit hook holds one instance in a ref.
*/
export class SubmissionTokenLifecycle {
  private token: string
  constructor(private readonly generate: () => string = createSubmissionToken) {
    this.token = generate()
  }

  /** The token for the current submission lifecycle (stable across retries). */
  current(): string {
    return this.token
  }

  /** Begin a NEW logical submission (e.g. the form resets for another enquiry). */
  renew(): string {
    this.token = this.generate()
    return this.token
  }
}
