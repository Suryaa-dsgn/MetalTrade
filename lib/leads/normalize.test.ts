import { describe, it, expect } from "vitest"
import { buildLead } from "@/lib/leads/normalize"
import type { LeadInput } from "@/lib/leads/types"

/*
  Backend Phase 2A — Lead normalization. Maps validated form values to the Lead
  entity; optional empty fields collapse to undefined; status defaults to "new".
*/

const ctx = {
  id: "id-1",
  reference: "OEML-2026-ABC234",
  now: "2026-09-16T10:00:00.000Z",
  submissionToken: "tok-1",
  source: "contact-form" as const,
}

const fullInput: LeadInput = {
  enquiryType: "buy",
  name: "Ada Lovelace",
  email: "ada@example.com",
  country: "United Kingdom",
  company: "Analytical Engines",
  phone: "+44 20 7946 0000",
  commodity: "copper",
  quantity: "500 MT",
  origin: "",
  destination: "Rotterdam",
  message: "We need copper cathode.",
}

describe("buildLead", () => {
  it("maps identity, timestamps, status and source from context", () => {
    const lead = buildLead(fullInput, ctx)
    expect(lead.id).toBe("id-1")
    expect(lead.reference).toBe("OEML-2026-ABC234")
    expect(lead.createdAt).toBe(ctx.now)
    expect(lead.updatedAt).toBe(ctx.now)
    expect(lead.status).toBe("new")
    expect(lead.source).toBe("contact-form")
    expect(lead.submissionToken).toBe("tok-1")
  })

  it("maps contact + commercial fields", () => {
    const lead = buildLead(fullInput, ctx)
    expect(lead.enquiryType).toBe("buy")
    expect(lead.contact).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+44 20 7946 0000",
      company: "Analytical Engines",
      country: "United Kingdom",
    })
    expect(lead.commodity).toBe("copper")
    expect(lead.quantity).toBe("500 MT")
    expect(lead.destination).toBe("Rotterdam")
    expect(lead.message).toBe("We need copper cathode.")
  })

  it("collapses empty optional fields to undefined (no empty strings stored)", () => {
    const lead = buildLead(fullInput, ctx)
    expect(lead.origin).toBeUndefined() // "" in input
    const minimal = buildLead(
      {
        enquiryType: "general",
        name: "Grace",
        email: "grace@example.com",
        country: "US",
        company: "",
        phone: "",
        commodity: "",
        quantity: "",
        origin: "",
        destination: "",
        message: "Hello",
      },
      ctx
    )
    expect(minimal.contact.company).toBeUndefined()
    expect(minimal.contact.phone).toBeUndefined()
    expect(minimal.commodity).toBeUndefined()
    expect(minimal.quantity).toBeUndefined()
    expect(minimal.origin).toBeUndefined()
    expect(minimal.destination).toBeUndefined()
  })
})
