"use client"

import { CheckboxField } from "@/components/forms/fields"

/*
  Consent (Blueprint §7, amendment 10). Two SEPARATE, unchecked-by-default
  controls: required privacy acknowledgement (needed to review + respond) and
  OPTIONAL marketing/future-contact consent that never blocks submission.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
export function ConsentFields({
  register,
  privacyError,
}: {
  register: any
  privacyError?: string
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-body-s font-semibold text-foreground">
        Consent
      </legend>
      <CheckboxField
        name="privacyConsent"
        register={register}
        error={privacyError}
        label="I have read and understood the privacy notice."
        description="Required so we can review and respond to this enquiry."
      />
      <CheckboxField
        name="marketingConsent"
        register={register}
        label="Send me occasional market and service updates."
        description="Optional. This does not affect your enquiry."
      />
    </fieldset>
  )
}
