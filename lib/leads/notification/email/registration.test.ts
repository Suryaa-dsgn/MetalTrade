import { describe, it, expect, vi, afterEach } from "vitest"
import {
  createEmailTransport,
  EmailConfigError,
  UnsupportedEmailProviderError,
} from "@/lib/leads/notification/email/factory"
import {
  resolveEmailNotificationProvider,
  emailMisconfigReason,
  type EmailSettings,
} from "@/lib/leads/notification/email/registration"
import { buildDefaultNotificationProviders } from "@/lib/leads/notification/service"
import { logger, type LogFields } from "@/lib/observability/logger"

/*
  Backend Phase 2D — fail-closed / fail-LOUD provider selection.

  The central safety property: selecting a provider whose adapter is not implemented
  (ses/resend today) must fail clearly, NOT silently behave like "none". And "none"
  must run normally with no email attempt and no misleading failure event.
*/

afterEach(() => vi.restoreAllMocks())

const settings = (over: Partial<EmailSettings>): EmailSettings => ({
  provider: "none",
  replyTo: "disabled",
  ...over,
})

describe("createEmailTransport", () => {
  it("throws UnsupportedEmailProviderError for ses (no adapter)", () => {
    expect(() => createEmailTransport("ses")).toThrow(UnsupportedEmailProviderError)
  })
  it("throws EmailConfigError for resend when RESEND_API_KEY is missing (test env)", () => {
    // resend IS implemented now, but requires the key → fail loudly, not disabled.
    expect(() => createEmailTransport("resend")).toThrow(EmailConfigError)
  })
})

describe("resolveEmailNotificationProvider", () => {
  it("returns null when email is intentionally disabled (none)", () => {
    expect(resolveEmailNotificationProvider(settings({ provider: "none" }))).toBeNull()
  })

  it("fails loudly (does NOT silently disable) when ses is selected with no adapter", () => {
    expect(() =>
      resolveEmailNotificationProvider(
        settings({ provider: "ses", from: "a@x", to: "b@y" })
      )
    ).toThrow(UnsupportedEmailProviderError)
  })

  it("fails loudly when resend is selected but RESEND_API_KEY is missing", () => {
    // resend adapter exists; the missing key is a loud configuration error, not a
    // silent disable.
    expect(() =>
      resolveEmailNotificationProvider(settings({ provider: "resend", from: "a@x", to: "b@y" }))
    ).toThrow(EmailConfigError)
  })

  it("classifies an unsupported provider as 'unsupported_provider'", () => {
    try {
      resolveEmailNotificationProvider(settings({ provider: "ses" }))
      expect.unreachable()
    } catch (err) {
      expect(emailMisconfigReason(err)).toBe("unsupported_provider")
    }
  })

  it("classifies a missing-key configuration error as 'missing_configuration'", () => {
    try {
      resolveEmailNotificationProvider(settings({ provider: "resend", from: "a@x", to: "b@y" }))
      expect.unreachable()
    } catch (err) {
      expect(emailMisconfigReason(err)).toBe("missing_configuration")
    }
  })
})

describe("buildDefaultNotificationProviders — default (EMAIL_PROVIDER=none)", () => {
  it("registers only the log provider, attempts no email, logs no misconfiguration", () => {
    const errors: { event: string; fields?: LogFields }[] = []
    vi.spyOn(logger, "error").mockImplementation((event, fields) => {
      errors.push({ event, fields })
    })

    const providers = buildDefaultNotificationProviders()

    expect(providers).toHaveLength(1)
    expect(providers[0].channel).toBe("log")
    // No email provider registered → no misconfiguration event.
    expect(errors.find((e) => e.event === "lead.notification.email.misconfigured")).toBeUndefined()
  })
})
