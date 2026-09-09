"use client"

import { useState } from "react"

import { submitEnquiry, type EnquiryResult } from "@/lib/enquiries/actions"
import type { EnquiryIntent } from "@/lib/validation/enquiry"

export type SubmitStatus = "idle" | "submitting" | "success" | "error"

/*
  Shared submission state for a form. Each form still owns its own RHF instance
  and schema (amendment 2). Prevents double submission (amendment 15).
*/
export function useEnquirySubmit(intent: EnquiryIntent) {
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [referenceId, setReferenceId] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  async function submit(values: unknown): Promise<EnquiryResult> {
    if (status === "submitting") {
      return { ok: false, kind: "submission", message: "Submission in progress" }
    }
    setStatus("submitting")
    setSubmissionError(null)
    const result = await submitEnquiry(intent, values)
    if (result.ok) {
      setReferenceId(result.referenceId)
      setStatus("success")
    } else if (result.kind === "submission") {
      setSubmissionError(result.message)
      setStatus("error")
    } else {
      // Validation errors are surfaced on the fields by the form.
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
