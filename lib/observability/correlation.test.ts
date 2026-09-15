import { describe, it, expect } from "vitest"
import { newCorrelationId } from "@/lib/observability/correlation"

/*
  Sec Phase 6 — correlation IDs. Short, opaque, unique; carries no user data.
*/

describe("newCorrelationId", () => {
  it("returns a short opaque token", () => {
    const id = newCorrelationId()
    expect(id).toMatch(/^[a-z0-9]{12}$/)
  })

  it("is (practically) unique across calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newCorrelationId()))
    expect(ids.size).toBe(1000)
  })
})
