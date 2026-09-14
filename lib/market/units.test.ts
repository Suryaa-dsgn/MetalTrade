import { describe, it, expect } from "vitest"
import {
  convertMassPrice,
  isMassUnit,
  isVolumeUnit,
  isMarketUnit,
} from "@/lib/market/units"

describe("convertMassPrice", () => {
  it("is identity for the same unit", () => {
    expect(convertMassPrice(8420, "t", "t")).toBe(8420)
  })

  it("converts USD/troy-oz to USD/tonne with the exact factor", () => {
    // 1 t = 1_000_000 g / 31.1034768 g per troy oz = 32150.7466... troy oz
    expect(convertMassPrice(1, "oz", "t")).toBeCloseTo(32150.7466, 3)
  })

  it("converts USD/tonne to USD/kg", () => {
    expect(convertMassPrice(8420, "t", "kg")).toBeCloseTo(8.42, 6)
  })

  it("round-trips oz -> t -> oz", () => {
    const perTonne = convertMassPrice(0.2954, "oz", "t")!
    expect(convertMassPrice(perTonne, "t", "oz")).toBeCloseTo(0.2954, 9)
  })

  it("returns null for a null price (never fabricates)", () => {
    expect(convertMassPrice(null, "oz", "t")).toBeNull()
  })

  it("returns null for an unknown unit (never guesses)", () => {
    expect(convertMassPrice(100, "barrel", "t")).toBeNull()
    expect(convertMassPrice(100, "t", "barrel")).toBeNull()
  })

  it("returns null for NaN", () => {
    expect(convertMassPrice(Number.NaN, "oz", "t")).toBeNull()
  })
})

describe("isMassUnit", () => {
  it("recognises known mass units", () => {
    expect(isMassUnit("oz")).toBe(true)
    expect(isMassUnit("t")).toBe(true)
    expect(isMassUnit("MT")).toBe(true)
  })
  it("rejects unknown units", () => {
    expect(isMassUnit("barrel")).toBe(false)
    expect(isMassUnit("")).toBe(false)
  })
})

describe("volume vs mass units", () => {
  it("bbl is a volume unit, not a mass unit", () => {
    expect(isVolumeUnit("bbl")).toBe(true)
    expect(isMassUnit("bbl")).toBe(false)
  })

  it("isMarketUnit accepts both mass and volume, rejects unknown", () => {
    expect(isMarketUnit("t")).toBe(true)
    expect(isMarketUnit("oz")).toBe(true)
    expect(isMarketUnit("bbl")).toBe(true)
    expect(isMarketUnit("barrel")).toBe(false)
    expect(isMarketUnit("")).toBe(false)
  })

  it("bbl can NEVER pass through mass conversion (explicit refusal)", () => {
    expect(convertMassPrice(109.51, "bbl", "t")).toBeNull()
    expect(convertMassPrice(109.51, "t", "bbl")).toBeNull()
    expect(convertMassPrice(109.51, "bbl", "bbl")).toBeNull() // bbl not in mass table
  })
})
