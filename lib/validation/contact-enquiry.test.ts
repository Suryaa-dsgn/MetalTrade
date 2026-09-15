import { describe, it, expect } from "vitest"
import {
  contactEnquirySchema,
  isCommodityRequired,
  FIELD_MAX,
  CONTACT_ENQUIRY_TYPES,
} from "@/lib/validation/enquiry"

/*
  Contact redesign, Phase 1 — unified schema. Security parity with the per-intent
  schemas (bounds + strict) plus the conditional commodity rule.
*/

const base = {
  enquiryType: "general" as const,
  name: "Ada Lovelace",
  email: "ada@example.com",
  country: "United Kingdom",
  message: "We would like to discuss a requirement.",
}

describe("contactEnquirySchema — required common fields", () => {
  it("accepts a minimal valid general enquiry (no commodity needed)", () => {
    expect(contactEnquirySchema.safeParse(base).success).toBe(true)
  })

  it("requires name, email, country, message and a valid enquiry type", () => {
    for (const field of ["name", "email", "country", "message"] as const) {
      const result = contactEnquirySchema.safeParse({ ...base, [field]: "" })
      expect(result.success).toBe(false)
    }
    expect(contactEnquirySchema.safeParse({ ...base, enquiryType: "" }).success).toBe(false)
    expect(
      contactEnquirySchema.safeParse({ ...base, enquiryType: "nope" }).success
    ).toBe(false)
  })

  it("accepts every allow-listed enquiry type", () => {
    for (const type of CONTACT_ENQUIRY_TYPES) {
      const commodity = isCommodityRequired(type) ? "copper" : ""
      expect(
        contactEnquirySchema.safeParse({ ...base, enquiryType: type, commodity }).success
      ).toBe(true)
    }
  })
})

describe("contactEnquirySchema — conditional commodity", () => {
  it("requires commodity for buy and supply", () => {
    expect(contactEnquirySchema.safeParse({ ...base, enquiryType: "buy" }).success).toBe(false)
    expect(
      contactEnquirySchema.safeParse({ ...base, enquiryType: "supply" }).success
    ).toBe(false)
    expect(isCommodityRequired("buy")).toBe(true)
    expect(isCommodityRequired("supply")).toBe(true)
  })

  it("accepts buy/supply once a commodity is provided", () => {
    expect(
      contactEnquirySchema.safeParse({ ...base, enquiryType: "buy", commodity: "tin" }).success
    ).toBe(true)
    expect(
      contactEnquirySchema.safeParse({ ...base, enquiryType: "supply", commodity: "gold" })
        .success
    ).toBe(true)
  })

  it("leaves commodity optional for logistics, general and partnership", () => {
    for (const type of ["logistics", "general", "partnership"] as const) {
      expect(isCommodityRequired(type)).toBe(false)
      expect(
        contactEnquirySchema.safeParse({ ...base, enquiryType: type }).success
      ).toBe(true)
    }
  })
})

describe("contactEnquirySchema — bounds, strict, quantity", () => {
  it("rejects over-long fields", () => {
    expect(
      contactEnquirySchema.safeParse({ ...base, name: "n".repeat(FIELD_MAX.name + 1) }).success
    ).toBe(false)
    expect(
      contactEnquirySchema.safeParse({ ...base, message: "m".repeat(FIELD_MAX.message + 1) })
        .success
    ).toBe(false)
  })

  it("rejects unexpected fields (strict)", () => {
    const result = contactEnquirySchema.safeParse({ ...base, isAdmin: true })
    expect(result.success).toBe(false)
  })

  it("accepts a concise free-text quantity and bounds it", () => {
    expect(
      contactEnquirySchema.safeParse({
        ...base,
        enquiryType: "buy",
        commodity: "copper",
        quantity: "2,000 tonnes/month",
      }).success
    ).toBe(true)
    expect(
      contactEnquirySchema.safeParse({
        ...base,
        quantity: "q".repeat(FIELD_MAX.quantity + 1),
      }).success
    ).toBe(false)
  })
})
