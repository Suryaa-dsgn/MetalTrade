import { describe, it, expect } from "vitest"
import {
  buildLeadEmail,
  buildLeadEmailSubject,
} from "@/lib/leads/notification/email/content"
import type { Lead } from "@/lib/leads/types"

/* Backend Phase 2D — internal lead-email content builder (pure/deterministic). */

const config = { from: "desk@oeml.example", to: "leads@oeml.example" }

const fullLead: Lead = {
  id: "lead-1",
  reference: "OEML-2026-ABC234",
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
  origin: "Chile",
  destination: "Rotterdam",
  message: "Please quote copper cathode.",
  source: "contact-form",
  submissionToken: "tok-1",
}

const minimalLead: Lead = {
  id: "lead-2",
  reference: "OEML-2026-ZZZ999",
  createdAt: "2026-09-16T11:00:00.000Z",
  updatedAt: "2026-09-16T11:00:00.000Z",
  status: "new",
  enquiryType: "general",
  contact: { name: "Grace Hopper", email: "grace@example.com", country: "United States" },
  message: "Just a general question.",
  source: "contact-form",
  submissionToken: "tok-2",
}

describe("buildLeadEmailSubject", () => {
  it("uses controlled type + catalogue commodity name", () => {
    expect(buildLeadEmailSubject(fullLead)).toBe("New OEML Lead: Buy - Copper")
  })

  it("falls back to 'General' when there is no commodity", () => {
    expect(buildLeadEmailSubject(minimalLead)).toBe("New OEML Lead: General - General")
  })

  it("maps the 'other' sentinel to a controlled 'Other' label", () => {
    expect(buildLeadEmailSubject({ ...fullLead, commodity: "other" })).toBe(
      "New OEML Lead: Buy - Other"
    )
  })

  it("never places PII (name/email/company/message) in the subject", () => {
    const subject = buildLeadEmailSubject(fullLead)
    expect(subject).not.toContain("Ada Lovelace")
    expect(subject).not.toContain("ada@example.com")
    expect(subject).not.toContain("Analytical Engines")
    expect(subject).not.toContain("copper cathode")
  })
})

describe("buildLeadEmail — complete lead", () => {
  const msg = buildLeadEmail(fullLead, config)

  it("takes from/to ONLY from config, never from the lead", () => {
    expect(msg.from).toBe("desk@oeml.example")
    expect(msg.to).toBe("leads@oeml.example")
    // The lead's own email is never the sender or recipient.
    expect(msg.from).not.toBe(fullLead.contact.email)
    expect(msg.to).not.toBe(fullLead.contact.email)
  })

  it("has no reply-to unless the caller passes one", () => {
    expect(msg.replyTo).toBeUndefined()
  })

  it("includes reply-to only when explicitly provided", () => {
    const withReply = buildLeadEmail(fullLead, { ...config, replyTo: fullLead.contact.email })
    expect(withReply.replyTo).toBe("ada@example.com")
  })

  it("renders all present fields in the plain-text body", () => {
    expect(msg.text).toContain("Reference: OEML-2026-ABC234")
    expect(msg.text).toContain("Submitted at: 2026-09-16T10:00:00.000Z")
    expect(msg.text).toContain("Enquiry Type: Buy")
    expect(msg.text).toContain("Commodity: Copper")
    expect(msg.text).toContain("Name: Ada Lovelace")
    expect(msg.text).toContain("Company: Analytical Engines")
    expect(msg.text).toContain("Email: ada@example.com")
    expect(msg.text).toContain("Phone / WhatsApp: +44 20 7946 0000")
    expect(msg.text).toContain("Country: United Kingdom")
    expect(msg.text).toContain("Quantity: 500 MT")
    expect(msg.text).toContain("Origin: Chile")
    expect(msg.text).toContain("Destination: Rotterdam")
    expect(msg.text).toContain("Requirement details: Please quote copper cathode.")
  })

  it("produces restrained, email-safe HTML (no images/JS/tracking)", () => {
    expect(msg.html).toBeDefined()
    expect(msg.html).toContain("<table")
    expect(msg.html).not.toContain("<img")
    expect(msg.html).not.toContain("<script")
    expect(msg.html).not.toMatch(/https?:\/\//) // no remote resources / tracking URLs
  })
})

describe("buildLeadEmail — optional fields omitted cleanly", () => {
  const msg = buildLeadEmail(minimalLead, config)

  it("omits absent optional fields (no 'undefined'/'null' labels)", () => {
    expect(msg.text).not.toContain("Company:")
    expect(msg.text).not.toContain("Phone")
    expect(msg.text).not.toContain("Commodity:")
    expect(msg.text).not.toContain("Quantity:")
    expect(msg.text).not.toContain("Origin:")
    expect(msg.text).not.toContain("Destination:")
    expect(msg.text).not.toContain("undefined")
    expect(msg.text).not.toContain("null")
  })

  it("still includes required fields", () => {
    expect(msg.text).toContain("Name: Grace Hopper")
    expect(msg.text).toContain("Email: grace@example.com")
    expect(msg.text).toContain("Country: United States")
    expect(msg.text).toContain("Requirement details: Just a general question.")
  })
})

describe("buildLeadEmail — HTML escaping / injection safety", () => {
  const malicious: Lead = {
    ...minimalLead,
    contact: {
      name: '<script>alert("xss")</script>',
      email: "evil@example.com",
      company: "<b>Injected</b> & Co",
      country: "Nowhere",
    },
    message: '<img src=x onerror="alert(1)">',
  }
  const msg = buildLeadEmail(malicious, config)

  it("escapes every lead-controlled value rendered into HTML", () => {
    expect(msg.html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;")
    expect(msg.html).toContain("&lt;b&gt;Injected&lt;/b&gt; &amp; Co")
    expect(msg.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
  })

  it("never emits the raw markup into HTML", () => {
    expect(msg.html).not.toContain("<script>")
    expect(msg.html).not.toContain("<b>Injected</b>")
    expect(msg.html).not.toContain("<img src=x")
  })

  it("keeps the raw value in plain text (text is not HTML and needs no escaping)", () => {
    expect(msg.text).toContain('<script>alert("xss")</script>')
  })
})
