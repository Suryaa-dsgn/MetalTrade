/*
  Sec Phase 2 — hosting-agnostic HTTP security headers + CSP (Report-Only).

  Pure module (NO `server-only`) so it can be consumed by next.config.ts (which
  runs in Node config context) and unit-tested directly. See next.config.ts for
  the full rationale on why script/style use 'unsafe-inline' and why HSTS is
  opt-in.
*/

export type SecurityHeader = { key: string; value: string }

/*
  Content-Security-Policy, shipped Report-Only first. Built from the app's ACTUAL
  rendered output:
    - stylesheets + Geist fonts are same-origin (/_next/static/**) → 'self'
    - one inline style attribute + Recharts runtime inline styles → style-src
      needs 'unsafe-inline'
    - Next's per-page inline bootstrap <script> blocks have no nonce/stable hash;
      without nonce-based middleware, 'unsafe-inline' is the correct script
      accommodation. Strict nonce-based script-src is a deferred enforcement step.
  Still blocks external/`*` script + connect sources and `unsafe-eval`.
*/
export const CSP_DIRECTIVES: string[] = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
]

export const contentSecurityPolicy = CSP_DIRECTIVES.join("; ")

export const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "browsing-topics=()",
  "payment=()",
  "usb=()",
].join(", ")

export type BuildHeadersOptions = {
  /** true only when the app itself should own HSTS (production + explicit opt-in). */
  hsts?: boolean
}

/** Build the security header set. HSTS is included only when `hsts` is true. */
export function buildSecurityHeaders(
  opts: BuildHeadersOptions = {}
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: permissionsPolicy },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  ]

  // HSTS: production only, no preload, and only when the app is the owning layer.
  // Off by default so it never contradicts an edge/CDN HSTS policy.
  if (opts.hsts) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    })
  }

  return headers
}
