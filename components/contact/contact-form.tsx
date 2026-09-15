"use client"

import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  contactEnquirySchema,
  isCommodityRequired,
  type ContactEnquiryInput,
  type ContactEnquiryValues,
  type ContactEnquiryType,
} from "@/lib/validation/enquiry"
import { messageHelperFor } from "@/lib/enquiries/contact"
import { metalOptions } from "@/data/config/enquiry"
import { Button } from "@/components/ui/button"
import {
  TextField,
  TextareaField,
  SelectField,
} from "@/components/forms/fields"
import { ErrorSummary, focusErrorSummary } from "@/components/forms/error-summary"
import { EnquiryTypeField } from "@/components/contact/enquiry-type-field"
import { ConditionalFields } from "@/components/contact/conditional-fields"
import { ContactSuccess } from "@/components/contact/contact-success"
import { useContactSubmit } from "@/components/contact/use-contact-submit"

/*
  Unified Contact form (Contact redesign, Phase 1). One RHF form for every enquiry
  purpose; progressive disclosure keeps it short. Server-side `contactEnquirySchema`
  stays authoritative (bounded + strict + conditional); client validation is UX
  only. Submission goes through the existing security + log-sink stub — no live
  email/CRM/database.
*/
const FIELD_ORDER = [
  "enquiryType",
  "name",
  "email",
  "country",
  "company",
  "phone",
  "commodity",
  "quantity",
  "origin",
  "destination",
  "message",
]

export function ContactForm({
  defaultEnquiryType = "",
  defaultCommodity = "",
}: {
  defaultEnquiryType?: ContactEnquiryType | ""
  defaultCommodity?: string
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactEnquiryInput, unknown, ContactEnquiryValues>({
    // The form's `enquiryType` is widened to allow "" (unselected) until chosen;
    // the schema's input is the strict enum, so cast the resolver to the form type
    // (RHF's generics are invariant). Validation still rejects "" at submit.
    resolver: zodResolver(contactEnquirySchema) as Resolver<
      ContactEnquiryInput,
      unknown,
      ContactEnquiryValues
    >,
    shouldFocusError: false,
    defaultValues: {
      enquiryType: defaultEnquiryType,
      name: "",
      email: "",
      country: "",
      company: "",
      phone: "",
      commodity: defaultCommodity,
      quantity: "",
      origin: "",
      destination: "",
      message: "",
    },
  })

  const { submit, isSubmitting, isSuccess, submissionError } = useContactSubmit()

  // useWatch is the memo-safe subscription API (vs the returned watch()).
  const enquiryType = useWatch({ control, name: "enquiryType" })
  const commodityRequired = isCommodityRequired(enquiryType)

  const onValid = async (values: ContactEnquiryValues) => {
    const res = await submit(values)
    if (!res.ok && res.kind === "validation") {
      for (const [key, message] of Object.entries(res.fieldErrors)) {
        setError(key as keyof ContactEnquiryInput, { message })
      }
      focusErrorSummary()
    }
  }

  if (isSuccess) return <ContactSuccess />

  return (
    <form
      onSubmit={handleSubmit(onValid, focusErrorSummary)}
      noValidate
      className="flex flex-col gap-6"
      aria-describedby="contact-form-status"
    >
      <p id="contact-form-status" aria-live="polite" className="sr-only">
        {isSubmitting ? "Submitting your enquiry" : ""}
      </p>

      <ErrorSummary errors={errors} order={FIELD_ORDER} />

      {submissionError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-negative-soft p-4 text-body-s text-negative"
        >
          We couldn&rsquo;t submit your enquiry. Please check the form and try again.
        </div>
      ) : null}

      <EnquiryTypeField
        register={register}
        value={enquiryType}
        error={errors.enquiryType?.message}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="name"
          label="Full name"
          register={register}
          error={errors.name?.message}
          required
          autoComplete="name"
        />
        <TextField
          name="company"
          label="Company"
          register={register}
          error={errors.company?.message}
          autoComplete="organization"
        />
        <TextField
          name="email"
          label="Work email"
          type="email"
          register={register}
          error={errors.email?.message}
          required
          autoComplete="email"
          inputMode="email"
        />
        <TextField
          name="phone"
          label="Phone / WhatsApp"
          type="tel"
          register={register}
          error={errors.phone?.message}
          autoComplete="tel"
          inputMode="tel"
        />
        <TextField
          name="country"
          label="Country / location"
          register={register}
          error={errors.country?.message}
          required
          autoComplete="country-name"
        />
        <SelectField
          name="commodity"
          label="Commodity / material"
          control={control}
          error={errors.commodity?.message}
          required={commodityRequired}
          options={metalOptions}
          placeholder="Select a commodity"
        />
      </div>

      <ConditionalFields
        enquiryType={enquiryType}
        register={register}
        errors={errors}
      />

      <TextareaField
        name="message"
        label="Requirement details"
        register={register}
        error={errors.message?.message}
        required
        rows={5}
        hint={messageHelperFor(enquiryType)}
      />

      <div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit enquiry"}
        </Button>
      </div>

      <p className="text-body-s text-muted-foreground">
        Your information will only be used to review and respond to your enquiry.
      </p>
    </form>
  )
}
