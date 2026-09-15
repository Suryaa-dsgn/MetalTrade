import { describe, it, expect } from "vitest"
import { getBotVerifier, disabledBotVerifier } from "@/lib/security/bot-verification"

/*
  Sec Phase 4 — bot-verification seam. Default is the disabled no-op verifier: it
  never blocks and adds no UX. Only the seam exists in this phase.
*/

describe("bot verification seam", () => {
  it("defaults to the disabled verifier", () => {
    expect(getBotVerifier().name).toBe("disabled")
  })

  it("the disabled verifier always passes (blocks nothing)", async () => {
    await expect(disabledBotVerifier.verify(null)).resolves.toEqual({ ok: true })
    await expect(disabledBotVerifier.verify("any-token")).resolves.toEqual({ ok: true })
  })
})
