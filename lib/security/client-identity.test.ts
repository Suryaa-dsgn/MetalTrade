import { describe, it, expect } from "vitest"
import { deriveClientKey, CLIENT_IP_HEADER } from "@/lib/security/client-identity"

/*
  Sec Phase 4 — client identity. Spoofable headers are only trusted when a trusted
  proxy is explicitly asserted.
*/

function headerGetter(map: Record<string, string>) {
  return (name: string) => map[name.toLowerCase()] ?? null
}

describe("deriveClientKey", () => {
  it("uses the left-most XFF entry as the key", () => {
    const id = deriveClientKey(
      headerGetter({ [CLIENT_IP_HEADER]: "203.0.113.7, 10.0.0.1" }),
      true
    )
    expect(id.key).toBe("203.0.113.7")
  })

  it("marks the identity untrusted when no trusted proxy is asserted", () => {
    const id = deriveClientKey(headerGetter({ [CLIENT_IP_HEADER]: "203.0.113.7" }), false)
    expect(id.key).toBe("203.0.113.7")
    expect(id.trusted).toBe(false)
  })

  it("marks the identity trusted only when a trusted proxy is asserted", () => {
    const id = deriveClientKey(headerGetter({ [CLIENT_IP_HEADER]: "203.0.113.7" }), true)
    expect(id.trusted).toBe(true)
  })

  it("falls back to a shared, untrusted 'anonymous' bucket without a client IP", () => {
    const id = deriveClientKey(headerGetter({}), true)
    expect(id).toEqual({ key: "anonymous", trusted: false })
  })
})
