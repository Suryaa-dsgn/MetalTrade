import type { Lead } from "@/lib/leads/types"
import type { ContactEnquiryType } from "@/lib/validation/enquiry"
import type { EmailMessage } from "@/lib/leads/notification/email/types"
import { escapeHtml } from "@/lib/leads/notification/email/escape"
import { metalOptions } from "@/data/config/enquiry"

/*
  Internal OEML lead-notification email formatter (Backend Phase 2D).

  PURE and DETERMINISTIC: given the same lead + config it produces the same message.
  It is responsible ONLY for presentation. It does NOT persist, change status,
  retry, select a provider, or read the environment (point 9). It never decides the
  sender or recipient — those arrive already validated in `config` (point 6/10). The
  lead contributes body content and, optionally, a reply-to that the CALLER has
  already validated and chosen to include.

  Every lead-controlled value rendered into HTML is escaped (leads are untrusted
  content even after validation). The plain-text version is body text only and is
  never used to construct raw mail headers.
*/

export type LeadEmailConfig = {
  /** Verified OEML/system sender — server configuration only. */
  from: string
  /** Configured OEML trade-desk recipient — server configuration only. */
  to: string
  /** Optional reply-to (the caller decides whether to pass the lead's validated
   *  email). Never influences `from`/`to`. */
  replyTo?: string
}

/** Controlled, human-friendly labels for the enquiry type. Never raw user input. */
const ENQUIRY_TYPE_LABELS: Record<ContactEnquiryType, string> = {
  buy: "Buy",
  supply: "Supply",
  logistics: "Logistics",
  general: "General",
  partnership: "Partnership",
}

/** Subject-line phrase per enquiry type (controlled). */
const ENQUIRY_SUBJECT_LABELS: Record<ContactEnquiryType, string> = {
  buy: "Buying Requirement",
  supply: "Supply Enquiry",
  logistics: "Logistics Enquiry",
  general: "General Enquiry",
  partnership: "Partnership Enquiry",
}

/** Enquiry types whose subject carries the commodity (when one was provided). */
const COMMODITY_IN_SUBJECT: ReadonlySet<ContactEnquiryType> = new Set<ContactEnquiryType>([
  "buy",
  "supply",
  "logistics",
])

/** slug → catalogue display name (e.g. "copper" → "Copper (cathode)"). Static,
 *  deterministic; no env access. */
const COMMODITY_LABELS = new Map(metalOptions.map((o) => [o.value, o.label]))

/** Resolve a commodity to a predictable label, preferring the canonical catalogue
 *  display name over arbitrary free text (point 7). Returns undefined when absent. */
function resolveCommodityLabel(commodity: string | undefined): string | undefined {
  const value = commodity?.trim()
  if (!value) return undefined
  if (value === "other") return "Other"
  return COMMODITY_LABELS.get(value) ?? value
}

/** Subject uses only controlled values — no name/email/company/message (point 7).
 *  e.g. "New OEML Supply Enquiry — Copper (cathode)", "New OEML General Enquiry". */
export function buildLeadEmailSubject(lead: Lead): string {
  const label = ENQUIRY_SUBJECT_LABELS[lead.enquiryType]
  const commodity = resolveCommodityLabel(lead.commodity)
  if (commodity && COMMODITY_IN_SUBJECT.has(lead.enquiryType)) {
    return `New OEML ${label} — ${commodity}`
  }
  return `New OEML ${label}`
}

type Field = { label: string; value: string | undefined }
type Section = { heading: string; fields: Field[] }

/** Grouped, ordered sections. Optional fields with no value are dropped cleanly so
 *  the output never shows "Phone: undefined" / "Destination: null". */
function leadSections(lead: Lead): Section[] {
  const present = (fields: Field[]) => fields.filter((f) => Boolean(f.value))
  return [
    {
      heading: "ENQUIRY",
      fields: present([
        { label: "Enquiry type", value: ENQUIRY_TYPE_LABELS[lead.enquiryType] },
        { label: "Submitted", value: lead.createdAt },
        { label: "Reference", value: lead.reference },
      ]),
    },
    {
      heading: "CONTACT",
      fields: present([
        { label: "Name", value: lead.contact.name },
        { label: "Company", value: lead.contact.company },
        { label: "Email", value: lead.contact.email },
        { label: "Phone / WhatsApp", value: lead.contact.phone },
        { label: "Country", value: lead.contact.country },
      ]),
    },
    {
      heading: "REQUIREMENT",
      fields: present([
        { label: "Commodity", value: resolveCommodityLabel(lead.commodity) },
        { label: "Quantity", value: lead.quantity },
        { label: "Origin", value: lead.origin },
        { label: "Destination", value: lead.destination },
        { label: "Requirement details", value: lead.message },
      ]),
    },
  ].filter((s) => s.fields.length > 0)
}

function buildText(lead: Lead): string {
  const intro = "A new enquiry was submitted through the OEML contact form.\n"
  const body = leadSections(lead)
    .map((s) => {
      const lines = s.fields.map((f) => `  ${f.label}: ${f.value}`).join("\n")
      return `${s.heading}\n${lines}`
    })
    .join("\n\n")
  return `${intro}\n${body}`
}

/*
  Restrained, transactional, email-safe HTML: simple tables per section, system-safe
  fonts, minimal inline styling, no remote images, no JavaScript, no tracking pixels.
  This is an internal operational notification, NOT marketing email, and deliberately
  does NOT recreate the website design system. Every lead value is escaped.
*/
function buildHtml(lead: Lead): string {
  const sections = leadSections(lead)
    .map((s) => {
      const rows = s.fields
        .map((f) => {
          const label = escapeHtml(f.label)
          const value = escapeHtml(f.value as string) // present (filtered above)
          return (
            `<tr>` +
            `<td style="padding:4px 12px 4px 0;vertical-align:top;color:#555;white-space:nowrap;font-weight:bold;">${label}</td>` +
            `<td style="padding:4px 0;vertical-align:top;color:#111;">${value}</td>` +
            `</tr>`
          )
        })
        .join("")
      return (
        `<h2 style="margin:20px 0 6px;font-size:13px;letter-spacing:0.04em;color:#666;">${escapeHtml(s.heading)}</h2>` +
        `<table style="border-collapse:collapse;">${rows}</table>`
      )
    })
    .join("")

  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111;">` +
    `<p style="margin:0 0 4px;">A new enquiry was submitted through the OEML contact form.</p>` +
    sections +
    `</div>`
  )
}

/** Build the complete internal notification message. `from`/`to` come only from
 *  `config`; the lead never influences them. */
export function buildLeadEmail(lead: Lead, config: LeadEmailConfig): EmailMessage {
  const message: EmailMessage = {
    to: config.to,
    from: config.from,
    subject: buildLeadEmailSubject(lead),
    text: buildText(lead),
    html: buildHtml(lead),
  }
  if (config.replyTo) message.replyTo = config.replyTo
  return message
}
