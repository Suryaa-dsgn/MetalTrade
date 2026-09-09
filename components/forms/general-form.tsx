"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  generalSchema,
  type GeneralInput,
  type GeneralValues,
} from "@/lib/validation/enquiry"
import { Button } from "@/components/ui/button"
import { EnquiryShell } from "@/components/forms/enquiry-shell"
import { ErrorSummary, focusErrorSummary } from "@/components/forms/error-summary"
import { ConsentFields } from "@/components/forms/consent-fields"
import { EnquirySuccess } from "@/components/forms/enquiry-success"
import { useEnquirySubmit } from "@/components/forms/use-enquiry-submit"
import { TextField, TextareaField } from "@/components/forms/fields"

// General enquiry is intentionally simpler than the others (amendment 13).
const fieldOrder = ["name", "email", "company", "message", "privacyConsent"]

export function GeneralForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GeneralInput, unknown, GeneralValues>({
    resolver: zodResolver(generalSchema),
    shouldFocusError: false,
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
      privacyConsent: false,
      marketingConsent: false,
    },
  })
  const { submit, isSubmitting, isSuccess, referenceId, submissionError } =
    useEnquirySubmit("general")

  const onValid = async (values: GeneralValues) => {
    const res = await submit(values)
    if (!res.ok && res.kind === "validation") {
      for (const [key, message] of Object.entries(res.fieldErrors)) {
        setError(key as keyof GeneralInput, { message })
      }
      focusErrorSummary()
    }
  }

  return (
    <EnquiryShell
      breadcrumb={[{ label: "Contact", href: "/contact" }, { label: "General" }]}
      title="General enquiry"
      intro="Any other question for the trade desk."
    >
      {isSuccess && referenceId ? (
        <EnquirySuccess referenceId={referenceId} />
      ) : (
        <form
          onSubmit={handleSubmit(onValid, focusErrorSummary)}
          noValidate
          className="flex flex-col gap-6"
        >
          <ErrorSummary errors={errors} order={fieldOrder} />
          {submissionError ? (
            <div
              role="alert"
              className="rounded-md border border-destructive bg-negative-soft p-4 text-body-s text-negative"
            >
              {submissionError}. Please try again.
            </div>
          ) : null}

          <TextField
            name="name"
            label="Name"
            register={register}
            error={errors.name?.message}
            required
            autoComplete="name"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="email"
              label="Email"
              type="email"
              register={register}
              error={errors.email?.message}
              required
              autoComplete="email"
              inputMode="email"
            />
            <TextField
              name="company"
              label="Company"
              register={register}
              error={errors.company?.message}
              autoComplete="organization"
            />
          </div>
          <TextareaField
            name="message"
            label="Message"
            register={register}
            error={errors.message?.message}
            required
            rows={5}
          />

          <ConsentFields
            register={register}
            privacyError={errors.privacyConsent?.message}
          />

          <div>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Send enquiry"}
            </Button>
          </div>
        </form>
      )}
    </EnquiryShell>
  )
}
