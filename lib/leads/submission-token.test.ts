import { describe, it, expect } from "vitest"
import {
  createSubmissionToken,
  isValidSubmissionToken,
  tokenFingerprint,
  SubmissionTokenLifecycle,
  SUBMISSION_TOKEN_MAX,
} from "@/lib/leads/submission-token"

/*
  Backend Phase 2B — submission token generation, lifecycle, and validation.
*/

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe("createSubmissionToken", () => {
  it("generates a valid UUID-shaped token", () => {
    const token = createSubmissionToken()
    expect(token).toMatch(UUID)
    expect(isValidSubmissionToken(token)).toBe(true)
  })

  it("is unique across calls", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => createSubmissionToken()))
    expect(tokens.size).toBe(1000)
  })
})

describe("SubmissionTokenLifecycle", () => {
  it("(A) exposes a valid token for the current lifecycle", () => {
    const lifecycle = new SubmissionTokenLifecycle()
    expect(isValidSubmissionToken(lifecycle.current())).toBe(true)
  })

  it("(B) keeps the SAME token across a validation failure (no renew)", () => {
    let n = 0
    const lifecycle = new SubmissionTokenLifecycle(() => `tok-${n++}`)
    const before = lifecycle.current()
    // a validation failure does not renew the token
    expect(lifecycle.current()).toBe(before)
    expect(lifecycle.current()).toBe("tok-0")
  })

  it("(C) keeps the SAME token across a transient failure / double submit", () => {
    let n = 0
    const lifecycle = new SubmissionTokenLifecycle(() => `tok-${n++}`)
    const t1 = lifecycle.current()
    const t2 = lifecycle.current() // retry
    const t3 = lifecycle.current() // second click
    expect(t1).toBe(t2)
    expect(t2).toBe(t3)
  })

  it("(D) issues a NEW token only when a new enquiry is started (renew)", () => {
    let n = 0
    const lifecycle = new SubmissionTokenLifecycle(() => `tok-${n++}`)
    const first = lifecycle.current()
    const renewed = lifecycle.renew()
    expect(renewed).not.toBe(first)
    expect(lifecycle.current()).toBe(renewed)
    expect(first).toBe("tok-0")
    expect(renewed).toBe("tok-1")
  })
})

describe("isValidSubmissionToken (H — malformed rejected)", () => {
  it("accepts a well-formed UUID", () => {
    expect(isValidSubmissionToken("123e4567-e89b-12d3-a456-426614174000")).toBe(true)
  })
  it("rejects non-UUID, empty, non-string and oversized values", () => {
    expect(isValidSubmissionToken("")).toBe(false)
    expect(isValidSubmissionToken("not-a-token")).toBe(false)
    expect(isValidSubmissionToken("12345")).toBe(false)
    expect(isValidSubmissionToken(undefined)).toBe(false)
    expect(isValidSubmissionToken(null)).toBe(false)
    expect(isValidSubmissionToken(42)).toBe(false)
    expect(isValidSubmissionToken("x".repeat(SUBMISSION_TOKEN_MAX + 1))).toBe(false)
    // UUID with trailing junk (would exceed shape) is rejected
    expect(
      isValidSubmissionToken("123e4567-e89b-12d3-a456-426614174000-extra")
    ).toBe(false)
  })
})

describe("tokenFingerprint", () => {
  it("is a short, stable, non-reversible digest", () => {
    const token = "123e4567-e89b-12d3-a456-426614174000"
    const fp = tokenFingerprint(token)
    expect(fp).toMatch(/^[0-9a-f]{8}$/)
    expect(tokenFingerprint(token)).toBe(fp) // stable
    expect(fp).not.toContain(token.slice(0, 8)) // not the raw token
    expect(tokenFingerprint("different-value")).not.toBe(fp)
  })
})
