"use client"

import { useState } from "react"

import { submitContactEnquiry } from "@/lib/enquiries/actions"
import type { EnquiryResult } from "@/lib/enquiries/actions"

export type SubmitStatus = "idle" | "submitting" | "success" | "error"

/*
  Submission state for the unified Contact form. Prevents double submission and
  surfaces a generic submission error; field validation errors are mapped back
  onto the form by the caller. Delivery is the existing log-sink stub — no live
  email/CRM/database.
*/
export function useContactSubmit() {
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [referenceId, setReferenceId] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  async function submit(values: unknown): Promise<EnquiryResult> {
    if (status === "submitting") {
      return { ok: false, kind: "submission", message: "Submission in progress" }
    }
    setStatus("submitting")
    setSubmissionError(null)
    const result = await submitContactEnquiry(values)
    if (result.ok) {
      setReferenceId(result.referenceId)
      setStatus("success")
    } else if (result.kind === "submission") {
      setSubmissionError(result.message)
      setStatus("error")
    } else {
      // Validation errors are shown on the fields by the form.
      setStatus("idle")
    }
    return result
  }

  return {
    status,
    referenceId,
    submissionError,
    isSubmitting: status === "submitting",
    isSuccess: status === "success",
    submit,
  }
}
