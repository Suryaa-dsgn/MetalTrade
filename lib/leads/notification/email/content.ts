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

/** Subject uses only controlled values — no name/email/company/message (point 7). */
export function buildLeadEmailSubject(lead: Lead): string {
  const type = ENQUIRY_TYPE_LABELS[lead.enquiryType]
  const commodity = resolveCommodityLabel(lead.commodity) ?? "General"
  return `New OEML Lead: ${type} - ${commodity}`
}

type Field = { label: string; value: string | undefined }

/** Ordered field list. Optional fields with no value are dropped cleanly so the
 *  output never shows "Phone: undefined" / "Destination: null". */
function leadFields(lead: Lead): Field[] {
  return [
    { label: "Reference", value: lead.reference },
    { label: "Submitted at", value: lead.createdAt },
    { label: "Enquiry Type", value: ENQUIRY_TYPE_LABELS[lead.enquiryType] },
    { label: "Commodity", value: resolveCommodityLabel(lead.commodity) },
    { label: "Name", value: lead.contact.name },
    { label: "Company", value: lead.contact.company },
    { label: "Email", value: lead.contact.email },
    { label: "Phone / WhatsApp", value: lead.contact.phone },
    { label: "Country", value: lead.contact.country },
    { label: "Quantity", value: lead.quantity },
    { label: "Origin", value: lead.origin },
    { label: "Destination", value: lead.destination },
    { label: "Requirement details", value: lead.message },
  ].filter((f): f is Field => Boolean(f.value))
}

function buildText(lead: Lead): string {
  return leadFields(lead)
    .map((f) => `${f.label}: ${f.value}`)
    .join("\n")
}

/*
  Restrained, transactional, email-safe HTML: a single table, system-safe fonts,
  minimal inline styling, no remote images, no JavaScript, no tracking pixels. This
  is an internal operational notification, NOT marketing email, and deliberately
  does NOT recreate the website design system. Every value is escaped.
*/
function buildHtml(lead: Lead): string {
  const rows = leadFields(lead)
    .map((f) => {
      const label = escapeHtml(f.label)
      // f.value is present here (leadFields filtered out empties).
      const value = escapeHtml(f.value as string)
      return (
        `<tr>` +
        `<td style="padding:4px 12px 4px 0;vertical-align:top;color:#555;white-space:nowrap;font-weight:bold;">${label}</td>` +
        `<td style="padding:4px 0;vertical-align:top;color:#111;">${value}</td>` +
        `</tr>`
      )
    })
    .join("")

  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111;">` +
    `<p style="margin:0 0 12px;">A new enquiry was submitted through the OEML contact form.</p>` +
    `<table style="border-collapse:collapse;">${rows}</table>` +
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
