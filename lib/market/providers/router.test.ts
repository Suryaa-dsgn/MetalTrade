import { describe, it, expect } from "vitest"
import { getProvider, isProviderImplemented } from "@/lib/market/providers/router"

describe("provider router", () => {
  it("resolves implemented providers", () => {
    expect(getProvider("metalpriceapi")?.id).toBe("metalpriceapi")
    expect(getProvider("metalpriceapi")?.sourceType).toBe("live")
    expect(getProvider("mock")?.id).toBe("mock")
    expect(getProvider("mock")?.sourceType).toBe("sample")
  })

  it("resolves the integrated Metals.Dev provider", () => {
    expect(getProvider("metalsdev")?.id).toBe("metalsdev")
    expect(getProvider("metalsdev")?.sourceType).toBe("live")
  })

  it("returns null for not-yet-integrated providers (fails safe)", () => {
    expect(getProvider("eia")).toBeNull()
  })

  it("reports implementation status", () => {
    expect(isProviderImplemented("metalpriceapi")).toBe(true)
    expect(isProviderImplemented("metalsdev")).toBe(true)
    expect(isProviderImplemented("mock")).toBe(true)
    expect(isProviderImplemented("eia")).toBe(false)
  })
})
