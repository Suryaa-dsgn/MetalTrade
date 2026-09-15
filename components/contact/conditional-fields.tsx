"use client"

import type { UseFormRegister, FieldErrors } from "react-hook-form"

import { conditionalFieldsFor } from "@/lib/enquiries/contact"
import type {
  ContactEnquiryInput,
  ContactEnquiryType,
} from "@/lib/validation/enquiry"
import { TextField } from "@/components/forms/fields"

/*
  Progressive disclosure: only the fields relevant to the selected enquiry type are
  shown, keeping the form short. `commodity` is a common field handled by the form
  itself; this renders the type-specific quantity/origin/destination fields.
*/
const FIELD_LABELS: Record<string, { label: string; hint?: string }> = {
  quantity: {
    label: "Estimated quantity",
    hint: 'A concise value is fine, e.g. "500 MT" or "2,000 tonnes/month".',
  },
  origin: { label: "Material location / origin" },
  destination: { label: "Destination" },
}

export function ConditionalFields({
  enquiryType,
  register,
  errors,
}: {
  enquiryType: ContactEnquiryType | ""
  register: UseFormRegister<ContactEnquiryInput>
  errors: FieldErrors<ContactEnquiryInput>
}) {
  const fields = conditionalFieldsFor(enquiryType)
  if (fields.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((name) => (
        <TextField
          key={name}
          name={name}
          label={FIELD_LABELS[name].label}
          hint={FIELD_LABELS[name].hint}
          register={register}
          error={errors[name]?.message as string | undefined}
        />
      ))}
    </div>
  )
}
