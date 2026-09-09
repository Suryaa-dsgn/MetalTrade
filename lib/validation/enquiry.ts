import { z } from "zod"

/*
  Enquiry validation schemas (Blueprint §7). Per-intent schemas — NOT one shared
  contactSchema that forces company/phone/website/role on every form
  (amendment 14). We capture enough to qualify an enquiry, not to draft a
  contract: advanced commercial fields stay optional (amendment 11). Quantity is
  coerced from the form string and must be positive; unit is required alongside
  (amendment 12). No passport/bank/wallet fields (Blueprint §16).
*/

const required = (label: string) => z.string().trim().min(1, `${label} is required`)
const optionalText = z.string().trim().optional()
const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address")
const quantity = z.coerce
  .number({ message: "Enter a quantity" })
  .positive("Quantity must be greater than zero")
const unit = z.string().trim().min(1, "Select a unit")

// Required privacy acknowledgement (must be true); optional marketing consent.
const privacyConsent = z
  .boolean()
  .refine((v) => v === true, "You must acknowledge the privacy notice")
const marketingConsent = z.boolean().optional()

export const supplierSchema = z.object({
  company: required("Company or legal entity"),
  name: required("Contact name"),
  email,
  phone: optionalText,
  role: optionalText,
  website: optionalText,
  metal: required("Metal"),
  form: optionalText,
  purity: optionalText,
  quantity,
  unit,
  availability: optionalText,
  origin: optionalText,
  destination: optionalText,
  incoterm: optionalText,
  message: optionalText,
  privacyConsent,
  marketingConsent,
})

export const buyerSchema = z.object({
  company: required("Company or legal entity"),
  name: required("Contact name"),
  email,
  phone: optionalText,
  role: optionalText,
  metal: required("Metal"),
  specification: optionalText,
  quantity,
  unit,
  frequency: optionalText,
  destination: optionalText,
  deliveryWindow: optionalText,
  incoterm: optionalText,
  requirements: optionalText,
  message: optionalText,
  privacyConsent,
  marketingConsent,
})

export const logisticsSchema = z.object({
  name: required("Contact name"),
  email,
  company: optionalText,
  commodity: required("Commodity"),
  quantity,
  unit,
  origin: required("Origin / pickup"),
  destination: required("Destination / delivery point"),
  targetDate: optionalText,
  mode: optionalText,
  incoterm: optionalText,
  packaging: optionalText,
  message: optionalText,
  privacyConsent,
  marketingConsent,
})

export const generalSchema = z.object({
  name: required("Name"),
  email,
  company: optionalText,
  message: z.string().trim().min(10, "Please enter a message of at least 10 characters"),
  privacyConsent,
  marketingConsent,
})

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
