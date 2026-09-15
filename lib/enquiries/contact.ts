import {
  CONTACT_ENQUIRY_TYPES,
  type ContactEnquiryType,
} from "@/lib/validation/enquiry"
import { CATALOGUE_METAL_SLUGS } from "@/data/config/enquiry"

/*
  Pure Contact-form logic (Contact redesign, Phase 1). No `server-only`, no React —
  so the branching used by the client form is unit-testable in Node and defined in
  ONE place. Commodity options come from the canonical catalogue via
  data/config/enquiry (never hard-coded here).
*/

export type ContactEnquiryOption = {
  value: ContactEnquiryType
  label: string
  description: string
}

/** The single "What can we help with?" option list (radio-card group). */
export const enquiryTypeOptions: ContactEnquiryOption[] = [
  {
    value: "buy",
    label: "I want to buy / source material",
    description: "Source a commodity to a destination.",
  },
  {
    value: "supply",
    label: "I want to supply / sell material",
    description: "Offer material you can supply.",
  },
  {
    value: "logistics",
    label: "I need logistics support",
    description: "Move a commodity along a route.",
  },
  {
    value: "general",
    label: "General enquiry",
    description: "Any other question for the desk.",
  },
  {
    value: "partnership",
    label: "Partnership / other",
    description: "Explore working together.",
  },
]

/** Conditional (progressive-disclosure) fields, by enquiry type. `commodity` is a
 *  COMMON field (always shown) whose required-ness is handled separately, so it is
 *  not listed here. */
export type ConditionalField = "quantity" | "origin" | "destination"

export function conditionalFieldsFor(
  type: ContactEnquiryType | ""
): ConditionalField[] {
  switch (type) {
    case "buy":
      return ["quantity", "destination"]
    case "supply":
      return ["quantity", "origin"]
    case "logistics":
      return ["origin", "destination"]
    case "general":
    case "partnership":
    default:
      return []
  }
}

/** Type-specific helper/placeholder for the "Requirement details" textarea. */
export function messageHelperFor(type: ContactEnquiryType | ""): string {
  switch (type) {
    case "buy":
      return "Tell us the specification, expected volume, frequency, target price or any other requirement."
    case "supply":
      return "Tell us about the material, available quantity, location, specifications and any supporting information."
    case "logistics":
      return "Tell us the commodity, route, volume and expected timing."
    case "general":
    case "partnership":
    default:
      return "Share the details of your enquiry and how we can help."
  }
}

/** Validate a `?type=` query param against the allowlist; returns a valid enquiry
 *  type or `undefined` (safe fallback to no preselection). */
export function enquiryTypeFromParam(
  param: string | string[] | undefined
): ContactEnquiryType | undefined {
  const value = Array.isArray(param) ? param[0] : param
  return value && (CONTACT_ENQUIRY_TYPES as readonly string[]).includes(value)
    ? (value as ContactEnquiryType)
    : undefined
}

/** Validate a commodity prefill (legacy `?metal=` or new `?commodity=`) against the
 *  canonical 12-commodity catalogue (CATALOGUE_METAL_SLUGS — no duplicate list).
 *  Returns a valid catalogue slug or `undefined` (invalid → no preselection). */
export function commodityFromParam(
  param: string | string[] | undefined
): string | undefined {
  const value = Array.isArray(param) ? param[0] : param
  return value && CATALOGUE_METAL_SLUGS.includes(value) ? value : undefined
}
