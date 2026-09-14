"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  logisticsSchema,
  type LogisticsInput,
  type LogisticsValues,
} from "@/lib/validation/enquiry"
import { incotermOptions, modeOptions } from "@/data/config/enquiry"
import { Button } from "@/components/ui/button"
import { EnquiryShell } from "@/components/forms/enquiry-shell"
import { ErrorSummary, focusErrorSummary } from "@/components/forms/error-summary"
import { ConsentFields } from "@/components/forms/consent-fields"
import { QuantityUnitField } from "@/components/forms/quantity-unit-field"
import { EnquirySuccess } from "@/components/forms/enquiry-success"
import { useEnquirySubmit } from "@/components/forms/use-enquiry-submit"
import {
  FormSection,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/forms/fields"

const fieldOrder = [
  "name",
  "email",
  "company",
  "commodity",
  "quantity",
  "unit",
  "origin",
  "destination",
  "privacyConsent",
]

export function LogisticsForm() {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LogisticsInput, unknown, LogisticsValues>({
    resolver: zodResolver(logisticsSchema),
    shouldFocusError: false,
    defaultValues: {
      name: "",
      email: "",
      company: "",
      commodity: "",
      quantity: "",
      unit: "",
      origin: "",
      destination: "",
      targetDate: "",
      mode: "",
      incoterm: "",
      packaging: "",
      message: "",
      privacyConsent: false,
      marketingConsent: false,
    },
  })
  const { submit, isSubmitting, isSuccess, referenceId, submissionError } =
    useEnquirySubmit("logistics")

  const onValid = async (values: LogisticsValues) => {
    const res = await submit(values)
    if (!res.ok && res.kind === "validation") {
      for (const [key, message] of Object.entries(res.fieldErrors)) {
        setError(key as keyof LogisticsInput, { message })
      }
      focusErrorSummary()
    }
  }

  return (
    <EnquiryShell
      breadcrumb={[
        { label: "Contact", href: "/contact" },
        { label: "Logistics" },
      ]}
      title="Discuss logistics"
      intro="Share a route and we will review feasibility. We coordinate inspection, freight, and customs at the origin; customs at the destination is handled by the buyer, and financing is not provided. Commodity, quantity, origin, and destination are required."
    >
      {isSuccess && referenceId ? (
        <EnquirySuccess referenceId={referenceId} />
      ) : (
        <form
          onSubmit={handleSubmit(onValid, focusErrorSummary)}
          noValidate
          className="flex flex-col gap-8"
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

          <FormSection step={1} title="Your details">
            <TextField
              name="name"
              label="Contact name"
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
          </FormSection>

          <FormSection step={2} title="Route">
            <TextField
              name="commodity"
              label="Commodity / form"
              register={register}
              error={errors.commodity?.message}
              required
              placeholder="e.g. copper cathodes"
            />
            <QuantityUnitField
              register={register}
              control={control}
              quantityError={errors.quantity?.message}
              unitError={errors.unit?.message}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="origin"
                label="Origin / pickup"
                register={register}
                error={errors.origin?.message}
                required
              />
              <TextField
                name="destination"
                label="Destination / delivery point"
                register={register}
                error={errors.destination?.message}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                name="targetDate"
                label="Target date"
                register={register}
                error={errors.targetDate?.message}
                placeholder="e.g. Q3"
              />
              <SelectField
                name="mode"
                label="Preferred mode"
                control={control}
                error={errors.mode?.message}
                options={modeOptions}
                placeholder="Optional"
              />
              <SelectField
                name="incoterm"
                label="Incoterm"
                control={control}
                error={errors.incoterm?.message}
                options={incotermOptions}
                placeholder="Optional"
              />
            </div>
            <TextField
              name="packaging"
              label="Packaging / handling"
              register={register}
              error={errors.packaging?.message}
            />
            <TextareaField
              name="message"
              label="Anything else"
              register={register}
              error={errors.message?.message}
              placeholder="Documents, special handling, timing…"
            />
          </FormSection>

          <FormSection step={3} title="Consent">
            <ConsentFields
              register={register}
              privacyError={errors.privacyConsent?.message}
            />
          </FormSection>

          <div>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Discuss logistics"}
            </Button>
          </div>
        </form>
      )}
    </EnquiryShell>
  )
}
