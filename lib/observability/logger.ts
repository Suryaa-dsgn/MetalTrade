/*
  Minimal structured logging seam. A single choke point so market/provider code
  never calls `console.log` directly and a real sink (OpenTelemetry, a hosted
  logger) can replace the implementation without touching call sites.

  Output is one JSON object per line (level, event, timestamp, fields), which is
  greppable in any log aggregator. `warn`/`error` go to stderr, the rest to
  stdout.

  SECURITY: `redact()` drops any field whose key looks like a secret
  (key/secret/token/authorization/apiKey…) as a defence-in-depth measure, so an
  accidental `logger.info("x", { apiKey })` can never leak. Callers must still
  avoid passing secrets; this is a backstop, not a licence.
*/

export type LogLevel = "debug" | "info" | "warn" | "error"
export type LogFields = Record<string, unknown>

const SECRET_KEY = /(?:api[_-]?key|secret|token|authorization|password|credential)/i

function redact(fields: LogFields | undefined): LogFields | undefined {
  if (!fields) return fields
  const out: LogFields = {}
  for (const [k, v] of Object.entries(fields)) {
    out[k] = SECRET_KEY.test(k) ? "[redacted]" : v
  }
  return out
}

export interface Logger {
  debug(event: string, fields?: LogFields): void
  info(event: string, fields?: LogFields): void
  warn(event: string, fields?: LogFields): void
  error(event: string, fields?: LogFields): void
}

function emit(level: LogLevel, event: string, fields?: LogFields): void {
  const line = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...redact(fields),
  })
  // This module is the single sanctioned sink for structured server logs.
  if (level === "warn" || level === "error") {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger: Logger = {
  debug: (event, fields) => emit("debug", event, fields),
  info: (event, fields) => emit("info", event, fields),
  warn: (event, fields) => emit("warn", event, fields),
  error: (event, fields) => emit("error", event, fields),
}
