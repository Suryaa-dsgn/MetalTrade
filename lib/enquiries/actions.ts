"use server"

import { enquirySchemas, type EnquiryIntent } from "@/lib/validation/enquiry"

/*
  Mocked enquiry submission (amendment 18: strictly mocked — no CRM, email,
  upload storage, bot protection, analytics, or routing).

  The result is a discriminated union with SEPARATE validation and submission
  errors (amendment 3), so a Phase-10 CRM/email integration can replace the body
  without changing the client forms. Attachments are never received here
  (amendment 4). References are clearly non-production DEMO codes (amendment 5).
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

  return { ok: true, referenceId: demoReference(intent) }
}
