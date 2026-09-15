import type { Lead, LeadInput, LeadSource } from "@/lib/leads/types"

/*
  Normalize a validated Contact payload into a Lead (Backend Phase 2A). Pure and
  deterministic — all identity/time inputs are injected so the service (and tests)
  control them. Optional string fields collapse empty values to `undefined` (the
  form sends "" for unfilled optionals); required fields are already trimmed by the
  Zod schema. No fabrication, no defaults invented.
*/

const optional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export type NormalizeContext = {
  id: string
  reference: string
  now: string // ISO 8601 UTC
  submissionToken: string
  source: LeadSource
}

export function buildLead(input: LeadInput, ctx: NormalizeContext): Lead {
  return {
    id: ctx.id,
    reference: ctx.reference,
    createdAt: ctx.now,
    updatedAt: ctx.now,
    status: "new",
    enquiryType: input.enquiryType,
    contact: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: optional(input.phone),
      company: optional(input.company),
      country: input.country.trim(),
    },
    commodity: optional(input.commodity),
    quantity: optional(input.quantity),
    origin: optional(input.origin),
    destination: optional(input.destination),
    message: input.message.trim(),
    source: ctx.source,
    submissionToken: ctx.submissionToken,
  }
}
