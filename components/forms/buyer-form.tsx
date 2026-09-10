"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  buyerSchema,
  type BuyerInput,
  type BuyerValues,
} from "@/lib/validation/enquiry"
import { incotermOptions, metalOptions } from "@/data/config/enquiry"
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
  "company",
  "name",
  "email",
  "phone",
  "role",
  "metal",
  "quantity",
  "unit",
  "privacyConsent",
]

export function BuyerForm({ defaultMetal }: { defaultMetal?: string }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BuyerInput, unknown, BuyerValues>({
    resolver: zodResolver(buyerSchema),
    shouldFocusError: false,
    defaultValues: {
      company: "",
      name: "",
      email: "",
      phone: "",
      role: "",
      metal: defaultMetal ?? "",
      specification: "",
      quantity: "",
      unit: "",
      frequency: "",
      destination: "",
      deliveryWindow: "",
      incoterm: "",
      requirements: "",
      message: "",
      privacyConsent: false,
      marketingConsent: false,
    },
  })
  const { submit, isSubmitting, isSuccess, referenceId, submissionError } =
    useEnquirySubmit("buying")

  const onValid = async (values: BuyerValues) => {
    const res = await submit(values)
    if (!res.ok && res.kind === "validation") {
      for (const [key, message] of Object.entries(res.fieldErrors)) {
        setError(key as keyof BuyerInput, { message })
      }
      focusErrorSummary()
    }
  }

  return (
    <EnquiryShell
      breadcrumb={[{ label: "Contact", href: "/contact" }, { label: "Source metal" }]}
      title="I want to source metal"
      intro="Define a buying requirement and the trade desk will match qualified supply. Only your details, the metal, and a quantity are required."
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
              name="company"
              label="Company or legal entity"
              register={register}
              error={errors.company?.message}
              required
              autoComplete="organization"
            />
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
                name="phone"
                label="Phone"
                type="tel"
                register={register}
                error={errors.phone?.message}
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
            <TextField
              name="role"
              label="Role"
              register={register}
              error={errors.role?.message}
              autoComplete="organization-title"
            />
          </FormSection>

          <FormSection
            step={2}
            title="Requirement"
            description="Add specification and terms where known. Advanced fields are optional."
          >
            <SelectField
              name="metal"
              label="Metal"
              control={control}
              error={errors.metal?.message}
              required
              options={metalOptions}
              placeholder="Select a metal"
            />
            <TextField
              name="specification"
              label="Form / specification"
              register={register}
              error={errors.specification?.message}
              placeholder="e.g. Grade A cathode"
            />
            <QuantityUnitField
              register={register}
              control={control}
              quantityError={errors.quantity?.message}
              unitError={errors.unit?.message}
              label="Required quantity"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="frequency"
                label="Frequency"
                register={register}
                error={errors.frequency?.message}
                placeholder="e.g. one-off, monthly"
              />
              <TextField
                name="destination"
                label="Destination"
                register={register}
                error={errors.destination?.message}
                autoComplete="country-name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="deliveryWindow"
                label="Delivery window"
                register={register}
                error={errors.deliveryWindow?.message}
              />
              <SelectField
                name="incoterm"
                label="Preferred Incoterm"
                control={control}
                error={errors.incoterm?.message}
                options={incotermOptions}
                placeholder="Optional"
              />
            </div>
            <TextareaField
              name="requirements"
              label="Inspection / documentation requirements"
              register={register}
              error={errors.requirements?.message}
              placeholder="Any inspection, assay, or document requirements…"
            />
            <TextareaField
              name="message"
              label="Anything else"
              register={register}
              error={errors.message?.message}
              placeholder="End-use, target price context, timing…"
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
              {isSubmitting ? "Submitting…" : "Request a buying conversation"}
            </Button>
          </div>
        </form>
      )}
    </EnquiryShell>
  )
}
