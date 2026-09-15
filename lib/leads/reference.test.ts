import { describe, it, expect } from "vitest"
import {
  newInternalId,
  newPublicReference,
  PUBLIC_REFERENCE_PATTERN,
} from "@/lib/leads/reference"

/*
  Backend Phase 2A — id/reference generation shape + practical uniqueness.
*/

describe("newInternalId", () => {
  it("returns opaque UUID-shaped ids", () => {
    expect(newInternalId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  it("is practically unique across many calls", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => newInternalId()))
    expect(ids.size).toBe(2000)
  })
})

describe("newPublicReference", () => {
  it("matches OEML-YYYY-XXXXXX with an unambiguous alphabet", () => {
    const ref = newPublicReference(new Date("2026-09-16T00:00:00.000Z"))
    expect(ref).toMatch(PUBLIC_REFERENCE_PATTERN)
    expect(ref.startsWith("OEML-2026-")).toBe(true)
    // The most ambiguous glyphs are excluded (no I/O/0/1).
    expect(ref.slice(10)).not.toMatch(/[IO01]/)
  })

  it("uses the provided year", () => {
    expect(newPublicReference(new Date("2030-01-01T00:00:00.000Z"))).toMatch(/^OEML-2030-/)
  })

  it("has low collision rate but is NOT assumed unique (collisions handled elsewhere)", () => {
    const refs = Array.from({ length: 500 }, () => newPublicReference())
    const unique = new Set(refs)
    // ~1B space; 500 samples should not collide, but the code never relies on this.
    expect(unique.size).toBe(refs.length)
  })
})
