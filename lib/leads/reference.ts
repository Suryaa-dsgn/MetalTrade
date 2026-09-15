/*
  ID + reference generation (Backend Phase 2A). Pure and testable.

  - Internal id: opaque UUID — never exposed, never sequential.
  - Public reference: OEML-YYYY-XXXXXX (year + 6 unambiguous chars). Six random
    characters CAN collide, so uniqueness is enforced at the repository and the
    service regenerates on collision — this generator never assumes uniqueness.

  The idempotency submission token lives in `submission-token.ts` (client-generated
  from Phase 2B).
*/

// Alphabet excludes the most ambiguous glyphs (I, O, 0, 1) for readable refs.
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const REFERENCE_LENGTH = 6

function uuid(): string {
  const fromCrypto = globalThis.crypto?.randomUUID?.()
  if (fromCrypto) return fromCrypto
  // Fallback (should not be needed on supported runtimes).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
}

/** Opaque internal id (UUID). */
export function newInternalId(): string {
  return uuid()
}

/** Public reference OEML-YYYY-XXXXXX (uniqueness enforced elsewhere). */
export function newPublicReference(now: Date = new Date()): string {
  const year = now.getUTCFullYear()
  let code = ""
  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    code += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)]
  }
  return `OEML-${year}-${code}`
}

/** Shape check for a public reference (used in tests + defensive validation). */
export const PUBLIC_REFERENCE_PATTERN =
  /^OEML-\d{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
