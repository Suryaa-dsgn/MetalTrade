"use server"

import { enquirySchemas, type EnquiryIntent } from "@/lib/validation/enquiry"
import { getEnquirySink } from "@/lib/enquiries/sink"

/*
  Enquiry submission. Validation stays here; DELIVERY is delegated to a pluggable
  server-side sink (Phase 10). The default `log` sink records redacted metadata
  only — no live email/CRM is connected. The discriminated union keeps SEPARATE
  validation and submission errors, so swapping in a real sink never changes the
  client forms. Attachments are never received here. References are clearly
  non-production DEMO codes.
*/
export type EnquiryResult =
  | { ok: true; referenceId: string }
  | { ok: false; kind: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; kind: "submission"; message: string }

const PREFIX: Record<EnquiryIntent, string> = {
  supply: "SUP",
  buying: "BUY",
  logistics: "LOG",
  general: "GEN",
}

function demoReference(intent: EnquiryIntent): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `DEMO-${PREFIX[intent]}-${code}`
}

export async function submitEnquiry(
  intent: EnquiryIntent,
  values: unknown
): Promise<EnquiryResult> {
  // Server-side re-validation (Blueprint §7): never trust the client.
  const parsed = enquirySchemas[intent].safeParse(values)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key] = issue.message
      }
    }
    return { ok: false, kind: "validation", fieldErrors }
  }

  // Simulate just enough latency to exercise the pending UI (amendment 15).
  await new Promise((resolve) => setTimeout(resolve, 700))

  const referenceId = demoReference(intent)
  const delivery = await getEnquirySink().deliver({
    intent,
    referenceId,
    values: parsed.data,
    submittedAt: new Date().toISOString(),
    hasAttachments: false, // attachments are never transmitted in this build
  })

  if (!delivery.ok) {
    // Never surface the raw sink error; give a safe, retryable message.
    return {
      ok: false,
      kind: "submission",
      message:
        "We couldn't submit your enquiry just now. Please try again in a moment.",
    }
  }

  return { ok: true, referenceId }
}
