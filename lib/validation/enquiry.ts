import { z } from "zod"

/*
  Enquiry validation schemas (Blueprint §7). Per-intent schemas — NOT one shared
  contactSchema that forces company/phone/website/role on every form
  (amendment 14). We capture enough to qualify an enquiry, not to draft a
  contract: advanced commercial fields stay optional (amendment 11). Quantity is
  coerced from the form string and must be positive; unit is required alongside
  (amendment 12). No passport/bank/wallet fields (Blueprint §16).

  SECURITY (Sec Phase 1): every string field has an explicit, field-specific
  `.max()` so a client cannot submit unbounded input, and every schema is
  `.strict()` so unexpected business fields are rejected rather than silently
  stripped. Server-side parsing here is authoritative; client validation is for
  UX only. These caps are the primary body-size guard (a Server Action body limit
  is a coarse backstop configured in next.config.ts).
*/

// Field-specific maximum lengths. Generous for real B2B input, but bounded.
export const FIELD_MAX = {
  name: 120,
  company: 160,
  email: 254, // RFC 5321 maximum length of an email address
  phone: 40,
  role: 120,
  website: 200,
  commodity: 80,
  unit: 24,
  shortSpec: 200, // form, purity, specification, incoterm, packaging, availability
  origin: 160,
  destination: 160,
  frequency: 120,
  targetPrice: 80,
  deliveryWindow: 120,
  mode: 80,
  targetDate: 40,
  country: 80,
  quantity: 60, // free-text estimated quantity, e.g. "2,000 tonnes/month"
  message: 4000,
} as const

const capped = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`)

const required = (label: string, max: number) =>
  capped(label, max).min(1, `${label} is required`)
const optional = (label: string, max: number) => capped(label, max).optional()

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(FIELD_MAX.email, `Email must be ${FIELD_MAX.email} characters or fewer`)
  .email("Enter a valid email address")
const quantity = z.coerce
  .number({ message: "Enter a quantity" })
  .positive("Quantity must be greater than zero")
  .max(1_000_000_000, "Enter a realistic quantity")
const unit = z
  .string()
  .trim()
  .min(1, "Select a unit")
  .max(FIELD_MAX.unit, "Select a valid unit")

// Required privacy acknowledgement (must be true); optional marketing consent.
const privacyConsent = z
  .boolean()
  .refine((v) => v === true, "You must acknowledge the privacy notice")
const marketingConsent = z.boolean().optional()

export const supplierSchema = z
  .object({
    company: required("Company or legal entity", FIELD_MAX.company),
    name: required("Contact name", FIELD_MAX.name),
    email,
    phone: optional("Phone", FIELD_MAX.phone),
    role: optional("Role", FIELD_MAX.role),
    website: optional("Website", FIELD_MAX.website),
    metal: required("Commodity", FIELD_MAX.commodity),
    form: optional("Form", FIELD_MAX.shortSpec),
    purity: optional("Purity", FIELD_MAX.shortSpec),
    quantity,
    unit,
    availability: optional("Availability", FIELD_MAX.shortSpec),
    origin: optional("Origin", FIELD_MAX.origin),
    destination: optional("Destination", FIELD_MAX.destination),
    incoterm: optional("Incoterm", FIELD_MAX.shortSpec),
    message: optional("Message", FIELD_MAX.message),
    privacyConsent,
    marketingConsent,
  })
  .strict()

export const buyerSchema = z
  .object({
    company: required("Company or legal entity", FIELD_MAX.company),
    name: required("Contact name", FIELD_MAX.name),
    email,
    phone: optional("Phone", FIELD_MAX.phone),
    role: optional("Role", FIELD_MAX.role),
    metal: required("Commodity", FIELD_MAX.commodity),
    specification: optional("Specification", FIELD_MAX.shortSpec),
    quantity,
    unit,
    frequency: optional("Frequency", FIELD_MAX.frequency),
    targetPrice: optional("Target price", FIELD_MAX.targetPrice),
    destination: optional("Destination", FIELD_MAX.destination),
    deliveryWindow: optional("Delivery window", FIELD_MAX.deliveryWindow),
    incoterm: optional("Incoterm", FIELD_MAX.shortSpec),
    requirements: optional("Requirements", FIELD_MAX.message),
    message: optional("Message", FIELD_MAX.message),
    privacyConsent,
    marketingConsent,
  })
  .strict()

export const logisticsSchema = z
  .object({
    name: required("Contact name", FIELD_MAX.name),
    email,
    company: optional("Company", FIELD_MAX.company),
    commodity: required("Commodity", FIELD_MAX.commodity),
    quantity,
    unit,
    origin: required("Origin / pickup", FIELD_MAX.origin),
    destination: required("Destination / delivery point", FIELD_MAX.destination),
    targetDate: optional("Target date", FIELD_MAX.targetDate),
    mode: optional("Mode", FIELD_MAX.mode),
    incoterm: optional("Incoterm", FIELD_MAX.shortSpec),
    packaging: optional("Packaging", FIELD_MAX.shortSpec),
    message: optional("Message", FIELD_MAX.message),
    privacyConsent,
    marketingConsent,
  })
  .strict()

export const generalSchema = z
  .object({
    name: required("Name", FIELD_MAX.name),
    email,
    company: optional("Company", FIELD_MAX.company),
    message: z
      .string()
      .trim()
      .min(10, "Please enter a message of at least 10 characters")
      .max(FIELD_MAX.message, `Message must be ${FIELD_MAX.message} characters or fewer`),
    privacyConsent,
    marketingConsent,
  })
  .strict()

// Output (validated/normalized) values — quantity is a number here.
export type SupplierValues = z.infer<typeof supplierSchema>
export type BuyerValues = z.infer<typeof buyerSchema>
export type LogisticsValues = z.infer<typeof logisticsSchema>
export type GeneralValues = z.infer<typeof generalSchema>

// Input values (what the form controls hold — quantity is a raw string).
export type SupplierInput = z.input<typeof supplierSchema>
export type BuyerInput = z.input<typeof buyerSchema>
export type LogisticsInput = z.input<typeof logisticsSchema>
export type GeneralInput = z.input<typeof generalSchema>

export type EnquiryIntent = "supply" | "buying" | "logistics" | "general"

export const enquirySchemas = {
  supply: supplierSchema,
  buying: buyerSchema,
  logistics: logisticsSchema,
  general: generalSchema,
} as const

/*
  Unified Contact schema (Contact redesign, Phase 1). ONE schema for the single
  Contact form; the earlier per-intent schemas above are retained (still tested)
  for the future backend-consolidation phase. Field names are shaped so the future
  backend can build a Lead directly (enquiryType, name, email, phone, company,
  country, commodity, quantity, origin, destination, message).

  Security parity with the per-intent schemas: every string is length-bounded via
  FIELD_MAX, the object is `.strict()` (unexpected fields rejected, not stripped),
  and `commodity` is conditionally required for buy/supply via superRefine.
  Quantity is a concise FREE-TEXT string (e.g. "500 MT") — no numeric coercion or
  unit component in this phase.
*/
export const CONTACT_ENQUIRY_TYPES = [
  "buy",
  "supply",
  "logistics",
  "general",
  "partnership",
] as const
export type ContactEnquiryType = (typeof CONTACT_ENQUIRY_TYPES)[number]

/** Commodity is required only for buying and supply enquiries. */
export function isCommodityRequired(type: ContactEnquiryType | ""): boolean {
  return type === "buy" || type === "supply"
}

export const contactEnquirySchema = z
  .object({
    enquiryType: z.enum(CONTACT_ENQUIRY_TYPES, {
      message: "Select what we can help with",
    }),
    name: required("Full name", FIELD_MAX.name),
    email,
    country: required("Country or location", FIELD_MAX.country),
    company: optional("Company", FIELD_MAX.company),
    phone: optional("Phone / WhatsApp", FIELD_MAX.phone),
    commodity: optional("Commodity", FIELD_MAX.commodity),
    quantity: optional("Estimated quantity", FIELD_MAX.quantity),
    origin: optional("Origin", FIELD_MAX.origin),
    destination: optional("Destination", FIELD_MAX.destination),
    message: required("Requirement details", FIELD_MAX.message),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (isCommodityRequired(val.enquiryType) && !val.commodity?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commodity"],
        message: "Select a commodity for a buying or supply enquiry",
      })
    }
  })

// What the form controls hold (enquiryType may be unset until chosen).
export type ContactEnquiryInput = Omit<
  z.input<typeof contactEnquirySchema>,
  "enquiryType"
> & { enquiryType: ContactEnquiryType | "" }
// Validated/normalized output.
export type ContactEnquiryValues = z.infer<typeof contactEnquirySchema>
