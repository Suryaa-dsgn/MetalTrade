import { describe, it, expect } from "vitest"
import { getProvider, isProviderImplemented } from "@/lib/market/providers/router"

describe("provider router", () => {
  it("resolves implemented providers", () => {
    expect(getProvider("metalpriceapi")?.id).toBe("metalpriceapi")
    expect(getProvider("metalpriceapi")?.sourceType).toBe("live")
    expect(getProvider("mock")?.id).toBe("mock")
    expect(getProvider("mock")?.sourceType).toBe("sample")
  })

  it("returns null for not-yet-integrated providers (fails safe)", () => {
    expect(getProvider("metalsdev")).toBeNull()
    expect(getProvider("eia")).toBeNull()
  })

  it("reports implementation status", () => {
    expect(isProviderImplemented("metalpriceapi")).toBe(true)
    expect(isProviderImplemented("mock")).toBe(true)
    expect(isProviderImplemented("metalsdev")).toBe(false)
    expect(isProviderImplemented("eia")).toBe(false)
  })
})
