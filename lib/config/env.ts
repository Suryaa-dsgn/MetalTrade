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

const schema = z.object({
  // Only "mock" is implemented; the enum is where an approved provider is added.
  marketProvider: selector("MARKET_PROVIDER", ["mock"], "mock"),
  enquirySink: selector("ENQUIRY_SINK", ["log", "disabled"], "log"),
  uploadProvider: selector("UPLOAD_PROVIDER", ["disabled"], "disabled"),
  contentSource: selector("CONTENT_SOURCE", ["static"], "static"),
  marketSimulateFailure: boolFromEnv.catch(false),
})

export type ServerConfig = z.infer<typeof schema>

export const serverConfig: ServerConfig = schema.parse({
  marketProvider: process.env.MARKET_PROVIDER,
  enquirySink: process.env.ENQUIRY_SINK,
  uploadProvider: process.env.UPLOAD_PROVIDER,
  contentSource: process.env.CONTENT_SOURCE,
  marketSimulateFailure: process.env.MARKET_SIMULATE_FAILURE,
})
