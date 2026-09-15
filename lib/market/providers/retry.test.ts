import { describe, it, expect, vi } from "vitest"
import { withSingleRetry, isRetryable, RETRYABLE_CODES } from "@/lib/market/providers/retry"

/*
  Sec Phase 3 — bounded retry. At most one retry, transient codes only.
*/

const noSleep = () => Promise.resolve()

function failWith(code: string) {
  return Object.assign(new Error(code), { code })
}

describe("isRetryable", () => {
  it("permits only network, timeout and server_error", () => {
    expect([...RETRYABLE_CODES].sort()).toEqual(["network", "server_error", "timeout"])
    for (const code of ["network", "timeout", "server_error"]) {
      expect(isRetryable(failWith(code))).toBe(true)
    }
  })

  it("never permits auth, quota, rate_limit, bad_request, malformed, not_found, unknown", () => {
    for (const code of [
      "auth",
      "quota",
      "rate_limit",
      "bad_request",
      "malformed",
      "not_found",
      "paid_gated",
      "unknown",
    ]) {
      expect(isRetryable(failWith(code))).toBe(false)
    }
  })
})

describe("withSingleRetry", () => {
  it("does not retry a successful call", async () => {
    const fn = vi.fn().mockResolvedValue("ok")
    const out = await withSingleRetry(fn, { sleep: noSleep })
    expect(out).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries a transient failure exactly once, then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(failWith("network"))
      .mockResolvedValueOnce("recovered")
    const onRetry = vi.fn()
    const out = await withSingleRetry(fn, { sleep: noSleep, onRetry })
    expect(out).toBe("recovered")
    expect(fn).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledWith("network")
  })

  it("retries at most once — a second transient failure propagates", async () => {
    const fn = vi.fn().mockRejectedValue(failWith("timeout"))
    await expect(withSingleRetry(fn, { sleep: noSleep })).rejects.toMatchObject({
      code: "timeout",
    })
    expect(fn).toHaveBeenCalledTimes(2) // original + one retry, no more
  })

  it("does NOT retry a non-transient failure (auth/quota/malformed)", async () => {
    for (const code of ["auth", "quota", "malformed"]) {
      const fn = vi.fn().mockRejectedValue(failWith(code))
      await expect(withSingleRetry(fn, { sleep: noSleep })).rejects.toMatchObject({ code })
      expect(fn).toHaveBeenCalledTimes(1)
    }
  })
})
