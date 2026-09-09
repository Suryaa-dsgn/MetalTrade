"use client"

import { SelectField, TextField } from "@/components/forms/fields"
import { unitOptions } from "@/data/config/enquiry"

/*
  Coherent quantity + unit pair (amendment 12). Quantity is a decimal-inputmode
  text field coerced/validated as a positive number by the schema; unit is a
  controlled taxonomy Select.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
export function QuantityUnitField({
  register,
  control,
  quantityError,
  unitError,
  label = "Estimated quantity",
  required,
}: {
  register: any
  control: any
  quantityError?: string
  unitError?: string
  label?: string
  required?: boolean
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
      <TextField
        name="quantity"
        label={label}
        register={register}
        error={quantityError}
        required={required}
        inputMode="decimal"
        placeholder="e.g. 500"
      />
      <SelectField
        name="unit"
        label="Unit"
        control={control}
        error={unitError}
        required={required}
        options={unitOptions}
        placeholder="Select"
      />
    </div>
  )
}
