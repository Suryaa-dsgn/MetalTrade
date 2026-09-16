import { describe, it, expect, vi, afterEach } from "vitest"
import {
  createEmailTransport,
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

describe("createEmailTransport — no adapter implemented yet", () => {
  it("throws UnsupportedEmailProviderError for ses", () => {
    expect(() => createEmailTransport("ses")).toThrow(UnsupportedEmailProviderError)
  })
  it("throws UnsupportedEmailProviderError for resend", () => {
    expect(() => createEmailTransport("resend")).toThrow(UnsupportedEmailProviderError)
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

  it("fails loudly when resend is selected with no adapter", () => {
    expect(() =>
      resolveEmailNotificationProvider(settings({ provider: "resend" }))
    ).toThrow(UnsupportedEmailProviderError)
  })

  it("classifies an unsupported provider as 'unsupported_provider'", () => {
    try {
      resolveEmailNotificationProvider(settings({ provider: "ses" }))
      expect.unreachable()
    } catch (err) {
      expect(emailMisconfigReason(err)).toBe("unsupported_provider")
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
