import { describe, it, expect } from "vitest"
import {
  supplierSchema,
  buyerSchema,
  logisticsSchema,
  generalSchema,
  FIELD_MAX,
} from "@/lib/validation/enquiry"

/*
  Sec Phase 1 — bounded + strict enquiry input. Server-side parsing is
  authoritative: every string field is length-capped, and unexpected fields are
  rejected (`.strict()`) rather than silently stripped.
*/

const validGeneral = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  message: "We would like to discuss a supply arrangement.",
  privacyConsent: true,
}

const validSupplier = {
  company: "Origin Minerals",
  name: "Sam Buyer",
  email: "sam@example.com",
  metal: "Copper",
  quantity: "100",
  unit: "MT",
  privacyConsent: true,
}

describe("enquiry schemas — length caps", () => {
  it("accepts a valid submission at normal lengths", () => {
    expect(generalSchema.safeParse(validGeneral).success).toBe(true)
    expect(supplierSchema.safeParse(validSupplier).success).toBe(true)
  })

  it("rejects a message longer than the field maximum", () => {
    const result = generalSchema.safeParse({
      ...validGeneral,
      message: "x".repeat(FIELD_MAX.message + 1),
    })
    expect(result.success).toBe(false)
  })

  it("rejects an over-long name across intents", () => {
    const name = "n".repeat(FIELD_MAX.name + 1)
    expect(buyerSchema.safeParse({ ...validSupplier, name }).success).toBe(false)
    expect(
      logisticsSchema.safeParse({
        name,
        email: "a@b.com",
        commodity: "Tin",
        quantity: "5",
        unit: "MT",
        origin: "Lagos",
        destination: "Rotterdam",
        privacyConsent: true,
      }).success
    ).toBe(false)
  })

  it("rejects an email over the RFC length even if otherwise valid-looking", () => {
    const local = "a".repeat(FIELD_MAX.email)
    const result = generalSchema.safeParse({
      ...validGeneral,
      email: `${local}@example.com`,
    })
    expect(result.success).toBe(false)
  })

  it("rejects an implausibly large quantity", () => {
    const result = supplierSchema.safeParse({
      ...validSupplier,
      quantity: "9999999999",
    })
    expect(result.success).toBe(false)
  })
})

describe("enquiry schemas — strict (reject unexpected fields)", () => {
  it("rejects an unexpected business field on the general schema", () => {
    const result = generalSchema.safeParse({
      ...validGeneral,
      isAdmin: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects an unexpected field on the supplier schema", () => {
    const result = supplierSchema.safeParse({
      ...validSupplier,
      internalPriceOverride: "1",
    })
    expect(result.success).toBe(false)
  })

  it("still accepts exactly the declared fields", () => {
    expect(generalSchema.safeParse(validGeneral).success).toBe(true)
  })
})
