import { describe, it, expect } from "vitest"
import {
  enquiryTypeOptions,
  conditionalFieldsFor,
  messageHelperFor,
  enquiryTypeFromParam,
} from "@/lib/enquiries/contact"
import { CONTACT_ENQUIRY_TYPES } from "@/lib/validation/enquiry"

/*
  Contact redesign, Phase 1 — pure form branching. Drives progressive disclosure,
  the enquiry-type options, and query-param preselection.
*/

describe("enquiryTypeOptions", () => {
  it("offers exactly the five allow-listed types in order", () => {
    expect(enquiryTypeOptions.map((o) => o.value)).toEqual([
      "buy",
      "supply",
      "logistics",
      "general",
      "partnership",
    ])
    // every option value is a valid enquiry type
    for (const o of enquiryTypeOptions) {
      expect(CONTACT_ENQUIRY_TYPES).toContain(o.value)
    }
  })
})

describe("conditionalFieldsFor (progressive disclosure)", () => {
  it("shows quantity + destination for buy", () => {
    expect(conditionalFieldsFor("buy")).toEqual(["quantity", "destination"])
  })
  it("shows quantity + origin for supply", () => {
    expect(conditionalFieldsFor("supply")).toEqual(["quantity", "origin"])
  })
  it("shows origin + destination for logistics", () => {
    expect(conditionalFieldsFor("logistics")).toEqual(["origin", "destination"])
  })
  it("shows no extra commercial fields for general or partnership", () => {
    expect(conditionalFieldsFor("general")).toEqual([])
    expect(conditionalFieldsFor("partnership")).toEqual([])
  })
  it("shows nothing when no type is selected", () => {
    expect(conditionalFieldsFor("")).toEqual([])
  })
})

describe("messageHelperFor", () => {
  it("returns a type-specific helper for buy/supply/logistics", () => {
    expect(messageHelperFor("buy")).toMatch(/specification/i)
    expect(messageHelperFor("supply")).toMatch(/available quantity|material/i)
    expect(messageHelperFor("logistics")).toMatch(/route/i)
  })
  it("returns a generic helper otherwise", () => {
    expect(messageHelperFor("general")).toMatch(/details/i)
    expect(messageHelperFor("")).toMatch(/details/i)
  })
})

describe("enquiryTypeFromParam (route preselection allowlist)", () => {
  it("accepts each valid type", () => {
    for (const type of CONTACT_ENQUIRY_TYPES) {
      expect(enquiryTypeFromParam(type)).toBe(type)
    }
  })
  it("maps the old /enquire routes' params", () => {
    // /enquire/supply → type=supply, buying-requirement → buy, etc.
    expect(enquiryTypeFromParam("supply")).toBe("supply")
    expect(enquiryTypeFromParam("buy")).toBe("buy")
    expect(enquiryTypeFromParam("logistics")).toBe("logistics")
    expect(enquiryTypeFromParam("general")).toBe("general")
  })
  it("falls back to undefined for invalid, missing or array params", () => {
    expect(enquiryTypeFromParam("buying")).toBeUndefined() // not an allow-listed value
    expect(enquiryTypeFromParam("")).toBeUndefined()
    expect(enquiryTypeFromParam(undefined)).toBeUndefined()
    expect(enquiryTypeFromParam(["buy", "supply"])).toBe("buy") // first, validated
    expect(enquiryTypeFromParam(["nope"])).toBeUndefined()
  })
})
