import { describe, it, expect } from "vitest"
import { rowToLead, leadToParams, LEAD_COLUMNS } from "@/lib/leads/repository/mapping"
import type { Lead } from "@/lib/leads/types"

/*
  Backend Phase 2C — pure row ↔ Lead mapping (no database).
*/

const lead: Lead = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  reference: "OEML-2026-ABC234",
  submissionToken: "223e4567-e89b-12d3-a456-426614174000",
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T10:00:00.000Z",
  status: "new",
  enquiryType: "buy",
  contact: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+44 20 7946 0000",
    company: "Analytical Engines",
    country: "United Kingdom",
  },
  commodity: "copper",
  quantity: "500 MT",
  destination: "Rotterdam",
  message: "Please quote copper cathode.",
  source: "contact-form",
}

describe("leadToParams", () => {
  it("produces one param per column, in column order", () => {
    const params = leadToParams(lead)
    expect(params).toHaveLength(LEAD_COLUMNS.length)
    expect(params[0]).toBe(lead.id)
    expect(params[1]).toBe(lead.reference)
    expect(params[2]).toBe(lead.submissionToken)
    expect(params[16]).toBe(lead.message)
    expect(params[17]).toBe(lead.source)
  })

  it("maps omitted optionals to null (never undefined/empty string)", () => {
    const minimal: Lead = { ...lead, commodity: undefined, quantity: undefined, origin: undefined, destination: undefined, contact: { ...lead.contact, phone: undefined, company: undefined } }
    const params = leadToParams(minimal)
    // contact_phone, company, commodity, quantity, origin, destination → null
    expect(params[9]).toBeNull() // contact_phone
    expect(params[10]).toBeNull() // company
    expect(params[12]).toBeNull() // commodity
    expect(params[13]).toBeNull() // quantity
    expect(params[14]).toBeNull() // origin
    expect(params[15]).toBeNull() // destination
  })
})

describe("rowToLead", () => {
  it("maps a DB row (snake_case, Date timestamps, null optionals) to a Lead", () => {
    const row = {
      id: lead.id,
      reference: lead.reference,
      submission_token: lead.submissionToken,
      created_at: new Date(lead.createdAt),
      updated_at: new Date(lead.updatedAt),
      status: "new",
      enquiry_type: "buy",
      contact_name: "Ada Lovelace",
      contact_email: "ada@example.com",
      contact_phone: null,
      company: null,
      country: "United Kingdom",
      commodity: null,
      quantity: null,
      origin: null,
      destination: null,
      message: "Please quote copper cathode.",
      source: "contact-form",
    }
    const mapped = rowToLead(row)
    expect(mapped.id).toBe(lead.id)
    expect(mapped.reference).toBe(lead.reference)
    expect(mapped.submissionToken).toBe(lead.submissionToken)
    expect(mapped.createdAt).toBe("2026-09-16T10:00:00.000Z")
    expect(mapped.status).toBe("new")
    expect(mapped.enquiryType).toBe("buy")
    expect(mapped.contact.phone).toBeUndefined()
    expect(mapped.contact.company).toBeUndefined()
    expect(mapped.commodity).toBeUndefined()
    expect(mapped.message).toBe("Please quote copper cathode.")
  })
})
