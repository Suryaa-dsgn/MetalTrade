"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  supplierSchema,
  type SupplierInput,
  type SupplierValues,
} from "@/lib/validation/enquiry"
import { incotermOptions, metalOptions } from "@/data/config/enquiry"
import { Button } from "@/components/ui/button"
import { EnquiryShell } from "@/components/forms/enquiry-shell"
import { ErrorSummary, focusErrorSummary } from "@/components/forms/error-summary"
import { ConsentFields } from "@/components/forms/consent-fields"
import { QuantityUnitField } from "@/components/forms/quantity-unit-field"
import { AttachmentField } from "@/components/forms/attachment-field"
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
  "website",
  "metal",
  "quantity",
  "unit",
  "privacyConsent",
]

export function SupplierForm({ defaultMetal }: { defaultMetal?: string }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SupplierInput, unknown, SupplierValues>({
    resolver: zodResolver(supplierSchema),
    shouldFocusError: false,
    defaultValues: {
      company: "",
      name: "",
      email: "",
      phone: "",
      role: "",
      website: "",
      metal: defaultMetal ?? "",
      form: "",
      purity: "",
      quantity: "",
      unit: "",
      availability: "",
      origin: "",
      destination: "",
      incoterm: "",
      message: "",
      privacyConsent: false,
      marketingConsent: false,
    },
  })
  const { submit, isSubmitting, isSuccess, referenceId, submissionError } =
    useEnquirySubmit("supply")

  const onValid = async (values: SupplierValues) => {
    const res = await submit(values)
    if (!res.ok && res.kind === "validation") {
      for (const [key, message] of Object.entries(res.fieldErrors)) {
        setError(key as keyof SupplierInput, { message })
      }
      focusErrorSummary()
    }
  }

  return (
    <EnquiryShell
      breadcrumb={[{ label: "Contact", href: "/contact" }, { label: "Sell metal" }]}
      title="I have metal to sell"
      intro="Share a supply position and the trade desk will review it. Only your details, the metal, and a quantity are required."
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
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="role"
                label="Role"
                register={register}
                error={errors.role?.message}
                autoComplete="organization-title"
              />
              <TextField
                name="website"
                label="Website"
                register={register}
                error={errors.website?.message}
                inputMode="url"
                autoComplete="url"
              />
            </div>
          </FormSection>

          <FormSection
            step={2}
            title="Material"
            description="Add detail where you have it — advanced fields are optional."
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
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="form"
                label="Form / grade"
                register={register}
                error={errors.form?.message}
                placeholder="e.g. cathodes"
              />
              <TextField
                name="purity"
                label="Purity / assay"
                register={register}
                error={errors.purity?.message}
              />
            </div>
            <QuantityUnitField
              register={register}
              control={control}
              quantityError={errors.quantity?.message}
              unitError={errors.unit?.message}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="availability"
                label="Availability"
                register={register}
                error={errors.availability?.message}
                placeholder="e.g. spot, monthly"
              />
              <TextField
                name="origin"
                label="Origin / location"
                register={register}
                error={errors.origin?.message}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="destination"
                label="Preferred destination"
                register={register}
                error={errors.destination?.message}
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
            <TextareaField
              name="message"
              label="Anything else"
              register={register}
              error={errors.message?.message}
              placeholder="Target price, packaging, or documents available…"
            />
          </FormSection>

          <FormSection step={3} title="Documents">
            <AttachmentField />
          </FormSection>

          <FormSection step={4} title="Consent">
            <ConsentFields
              register={register}
              privacyError={errors.privacyConsent?.message}
            />
          </FormSection>

          <div>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit supply details"}
            </Button>
          </div>
        </form>
      )}
    </EnquiryShell>
  )
}
