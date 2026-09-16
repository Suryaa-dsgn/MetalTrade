#!/usr/bin/env node
/*
  Developer email connectivity smoke test (`npm run email:test`).

  Sends ONE clearly-labeled test email through Resend using the CONFIGURED environment,
  to verify credentials + sender/domain before the lead pipeline is exercised. This is
  a connectivity check only — the live lead flow sends via the app's EmailTransport, not
  this script.

  Safety:
    - refuses to run when NODE_ENV=production;
    - never prints RESEND_API_KEY (or any secret);
    - the recipient is EMAIL_TO from the environment — no arbitrary/public recipient
      input is accepted;
    - prints only a safe outcome (Resend email id or an error code).

  Env required (set in your shell or via `node --env-file=.env.local`):
    EMAIL_PROVIDER=resend   RESEND_API_KEY=...   EMAIL_FROM=...   EMAIL_TO=...
    EMAIL_REPLY_TO=disabled|lead-email (optional; ignored by this static test)
*/
import { Resend } from "resend"

if (process.env.NODE_ENV === "production") {
  console.error("email:test refuses to run with NODE_ENV=production.")
  process.exit(2)
}

const provider = process.env.EMAIL_PROVIDER
const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM
const to = process.env.EMAIL_TO

const missing = []
if (provider !== "resend") missing.push('EMAIL_PROVIDER="resend"')
if (!apiKey) missing.push("RESEND_API_KEY")
if (!from) missing.push("EMAIL_FROM")
if (!to) missing.push("EMAIL_TO")
if (missing.length > 0) {
  console.error(`email:test is not configured. Provide: ${missing.join(", ")}`)
  process.exit(2)
}

const resend = new Resend(apiKey)
const stamp = new Date().toISOString()

try {
  const { data, error } = await resend.emails.send(
    {
      from,
      to,
      subject: "OEML email connectivity test (safe to ignore)",
      text:
        "This is an automated OEML development connectivity test. " +
        `No lead is associated. Sent at ${stamp}.`,
    },
    { idempotencyKey: `oeml-email-test-${stamp}` }
  )
  if (error) {
    // Only the safe error code/name — never the raw body or the key.
    console.error(`email:test failed: ${error.name ?? "provider_error"}`)
    process.exit(1)
  }
  console.log(`email:test sent. providerMessageId=${data?.id ?? "(none)"}`)
} catch (err) {
  const name = err && typeof err === "object" && "name" in err ? String(err.name) : "unknown"
  console.error(`email:test error: ${name}`)
  process.exit(1)
}
