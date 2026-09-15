"use client"

import type { UseFormRegister } from "react-hook-form"

import { cn } from "@/lib/utils"
import { enquiryTypeOptions } from "@/lib/enquiries/contact"
import type { ContactEnquiryInput } from "@/lib/validation/enquiry"

/*
  "What can we help with?" — an accessible radio-card group (native radios inside a
  fieldset), NOT the four large navigation cards of the old page. Native radios
  give correct keyboard behaviour (arrow keys move within the group) and grouping
  for assistive tech; the card is purely the visual affordance. Restrained borders
  + a cobalt selected state, consistent with the design system.
*/
export function EnquiryTypeField({
  register,
  value,
  error,
}: {
  register: UseFormRegister<ContactEnquiryInput>
  value: string
  error?: string
}) {
  return (
    <fieldset aria-describedby={error ? "enquiryType-error" : undefined}>
      <legend className="text-body-s font-medium text-foreground">
        What can we help with?
        <span aria-hidden="true" className="text-negative"> *</span>
        <span className="sr-only"> (required)</span>
      </legend>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {enquiryTypeOptions.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
                selected
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:border-border-strong"
              )}
            >
              <input
                type="radio"
                value={option.value}
                className="mt-0.5 size-4 accent-primary"
                {...register("enquiryType")}
              />
              <span>
                <span className="block text-body-s font-medium text-foreground">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-body-s text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {error ? (
        <p id="enquiryType-error" className="mt-1.5 text-body-s text-negative">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
