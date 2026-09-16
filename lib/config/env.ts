import "server-only"

import { z } from "zod"

/*
  Server-only integration configuration (Phase 10, amendments 7 & 8).

  `import "server-only"` makes this module a build error if it is ever pulled
  into a client bundle, so provider selectors and (future) secrets never reach
  the browser. Selectors are validated against explicit enums with Zod: an
  unknown value does NOT silently select arbitrary behaviour — it falls back to
  the safe default with a one-time server warning.

  Everything defaults to mock / no-op / disabled, so the app runs with no env
  set. No live provider is wired in this phase; secret values (when a provider
  is later approved) are read here, server-side only, never exported to callers.
*/

const boolFromEnv = z
  .string()
  .transform((v) => v === "1" || v.toLowerCase() === "true")
  .pipe(z.boolean())

/** Enum selector that warns and falls back to `def` on an unsupported value. */
function selector<const T extends readonly [string, ...string[]]>(
  name: string,
  values: T,
  def: T[number]
) {
  return z
    .string()
    .optional()
    .transform((raw) => {
      if (raw === undefined || raw === "") return def
      if ((values as readonly string[]).includes(raw)) return raw as T[number]
      console.warn(
        `[config] ${name}="${raw}" is not supported (expected one of ${values.join(
          ", "
        )}); falling back to "${def}".`
      )
      return def
    })
}

/** A secret string: trimmed, and `undefined` when unset/empty. Never logged. */
const secret = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

/** A plain optional string (not a secret): trimmed, `undefined` when unset/empty. */
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const schema = z.object({
  // Market mode (retired the single global live-provider gate). "registry" =
  // normal per-benchmark routing via the BenchmarkRegistry + ProviderRouter;
  // "mock" = an explicit full sample/demo build. A live provider is selected per
  // benchmark by the registry, not by a global flag.
  marketMode: selector("MARKET_PROVIDER", ["registry", "mock"], "registry"),
  enquirySink: selector("ENQUIRY_SINK", ["log", "disabled"], "log"),
  uploadProvider: selector("UPLOAD_PROVIDER", ["disabled"], "disabled"),
  contentSource: selector("CONTENT_SOURCE", ["static"], "static"),
  marketSimulateFailure: boolFromEnv.catch(false),
  // Bot-verification provider (Sec Phase 4). "disabled" is a no-op seam; a future
  // approved provider (e.g. a challenge service) plugs in behind the same
  // interface. No CAPTCHA UX is added and no vendor code is bundled.
  botVerification: selector("BOT_VERIFICATION", ["disabled"], "disabled"),
  // Whether a trusted reverse proxy / host sets the client IP header. Default
  // false: without it the derived client identity is best-effort and spoofable
  // (documented), and reliable per-client limiting depends on the edge layer.
  rateLimitTrustProxy: boolFromEnv.catch(false),
  // Lead persistence store (Backend Phase 2C). "memory" = in-memory (ephemeral,
  // dev/test only); "postgres" = durable managed PostgreSQL. Default "memory".
  // Production fails closed unless a durable store is selected AND configured —
  // there is never a silent fallback from postgres to memory.
  leadStore: selector("LEAD_STORE", ["memory", "postgres"], "memory"),
  // PostgreSQL connection string (server-only; never logged, never client-exposed).
  databaseUrl: secret,
  // TLS mode for the DB connection. "require" verifies TLS (recommended in prod);
  // "disable" only for a local non-TLS dev database.
  databaseSsl: selector("DATABASE_SSL", ["require", "disable"], "require"),
  // Email notification (Backend Phase 2D). "none" = intentionally disabled (the
  // only value that operates today); the log notification provider still records
  // deliveries. "ses"/"resend" are recognised for forward-compat but have NO
  // transport adapter yet, so selecting them fails LOUDLY (never silently disabled)
  // — see lib/leads/notification/email/factory.ts. Sender/recipient are validated
  // only when a provider is actually selected (never required for "none").
  emailProvider: selector("EMAIL_PROVIDER", ["none", "ses", "resend"], "none"),
  // Verified OEML/system sender + configured trade-desk recipient. Server config
  // only — lead-controlled input must NEVER influence from/to. Not secrets; still
  // never logged as values. Required only once a real provider is selected.
  emailFrom: optionalString,
  emailTo: optionalString,
  // Reply-to behaviour. "lead-email" sets reply-to to the lead's ALREADY-VALIDATED
  // email (a structured field, never a manually built header); "disabled" omits it.
  emailReplyTo: selector("EMAIL_REPLY_TO", ["disabled", "lead-email"], "disabled"),
  // Provider secrets. Read server-side only; never exported to callers, never
  // logged, never sent to the client.
  metalPriceApiKey: secret,
  metalsDevApiKey: secret,
  eiaApiKey: secret,
})

export type ServerConfig = z.infer<typeof schema>

/*
  Production hygiene (Sec Phase 1). Dev/demo controls must NEVER activate in
  production, even under a misconfigured environment. We DOWNGRADE (never throw)
  so a bad env can't take the site down, and warn once:

    - MARKET_PROVIDER=mock is ignored in production → normal "registry" routing,
      so sample/demo data can never silently replace the real feed in prod.
    - MARKET_SIMULATE_FAILURE is ignored in production → the degraded-UI QA switch
      cannot be flipped on a live site.

  Both remain fully available in development and test.
*/
export function applyProductionHardening(
  config: ServerConfig,
  isProduction: boolean
): ServerConfig {
  if (!isProduction) return config
  const hardened = { ...config }
  if (hardened.marketMode === "mock") {
    console.warn(
      '[config] MARKET_PROVIDER="mock" is not permitted in production; using "registry".'
    )
    hardened.marketMode = "registry"
  }
  if (hardened.marketSimulateFailure) {
    console.warn(
      "[config] MARKET_SIMULATE_FAILURE is not permitted in production; ignoring."
    )
    hardened.marketSimulateFailure = false
  }
  return hardened
}

export const serverConfig: ServerConfig = applyProductionHardening(
  schema.parse({
    marketMode: process.env.MARKET_PROVIDER,
    enquirySink: process.env.ENQUIRY_SINK,
    uploadProvider: process.env.UPLOAD_PROVIDER,
    contentSource: process.env.CONTENT_SOURCE,
    marketSimulateFailure: process.env.MARKET_SIMULATE_FAILURE,
    botVerification: process.env.BOT_VERIFICATION,
    rateLimitTrustProxy: process.env.RATE_LIMIT_TRUST_PROXY,
    leadStore: process.env.LEAD_STORE,
    databaseUrl: process.env.DATABASE_URL,
    databaseSsl: process.env.DATABASE_SSL,
    emailProvider: process.env.EMAIL_PROVIDER,
    emailFrom: process.env.EMAIL_FROM,
    emailTo: process.env.EMAIL_TO,
    emailReplyTo: process.env.EMAIL_REPLY_TO,
    metalPriceApiKey: process.env.METALPRICE_API_KEY,
    metalsDevApiKey: process.env.METALS_DEV_API_KEY,
    eiaApiKey: process.env.EIA_API_KEY,
  }),
  process.env.NODE_ENV === "production"
)
