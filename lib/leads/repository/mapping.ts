import type {
  Lead,
  LeadStatus,
  LeadSource,
} from "@/lib/leads/types"
import type { ContactEnquiryType } from "@/lib/validation/enquiry"
import type { SqlRow } from "@/lib/leads/db/executor"

/*
  Backend Phase 2C — pure mapping between the `leads` DB row and the Lead domain
  entity. Column order in LEAD_COLUMNS matches leadToParams(); both are the single
  source of truth for the INSERT. Nullable columns map to `undefined` (never "").
*/

export const LEAD_COLUMNS = [
  "id",
  "reference",
  "submission_token",
  "created_at",
  "updated_at",
  "status",
  "enquiry_type",
  "contact_name",
  "contact_email",
  "contact_phone",
  "company",
  "country",
  "commodity",
  "quantity",
  "origin",
  "destination",
  "message",
  "source",
] as const

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return new Date(String(value)).toISOString()
}

function opt(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : String(value)
}

/** DB row → Lead (order-independent; reads columns by name). */
export function rowToLead(row: SqlRow): Lead {
  return {
    id: String(row.id),
    reference: String(row.reference),
    submissionToken: String(row.submission_token),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    status: String(row.status) as LeadStatus,
    enquiryType: String(row.enquiry_type) as ContactEnquiryType,
    contact: {
      name: String(row.contact_name),
      email: String(row.contact_email),
      phone: opt(row.contact_phone),
      company: opt(row.company),
      country: String(row.country),
    },
    commodity: opt(row.commodity),
    quantity: opt(row.quantity),
    origin: opt(row.origin),
    destination: opt(row.destination),
    message: String(row.message),
    source: String(row.source) as LeadSource,
  }
}

/** Lead → positional params for the INSERT (order matches LEAD_COLUMNS). */
export function leadToParams(lead: Lead): unknown[] {
  return [
    lead.id,
    lead.reference,
    lead.submissionToken,
    lead.createdAt,
    lead.updatedAt,
    lead.status,
    lead.enquiryType,
    lead.contact.name,
    lead.contact.email,
    lead.contact.phone ?? null,
    lead.contact.company ?? null,
    lead.contact.country,
    lead.commodity ?? null,
    lead.quantity ?? null,
    lead.origin ?? null,
    lead.destination ?? null,
    lead.message,
    lead.source,
  ]
}
