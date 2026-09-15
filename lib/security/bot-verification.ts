import { serverConfig } from "@/lib/config/env"

/*
  Sec Phase 4 — bot-verification SEAM (disabled by default).

  This is only an abstraction so a future approved provider (e.g. Cloudflare
  Turnstile, AWS WAF Bot Control, or another) can plug in behind one interface
  without touching the forms. In this phase:
    - it is DISABLED (a no-op verifier that never blocks),
    - no visible CAPTCHA / challenge UX is added,
    - no vendor SDK or vendor-specific code is bundled,
    - the current form UX is unchanged.

  A real verifier validates a client-supplied challenge token server-side and is
  selected via BOT_VERIFICATION once a provider is approved.
*/

export type BotVerdict = { ok: boolean; reason?: string }

export interface BotVerifier {
  readonly name: string
  /** Verify a challenge token (null when no provider/UX is active). */
  verify(token: string | null): Promise<BotVerdict>
}

/** No-op verifier: always passes, blocks nothing. The disabled default. */
export const disabledBotVerifier: BotVerifier = {
  name: "disabled",
  async verify() {
    return { ok: true }
  },
}

export function getBotVerifier(): BotVerifier {
  switch (serverConfig.botVerification) {
    case "disabled":
    default:
      return disabledBotVerifier
  }
}
