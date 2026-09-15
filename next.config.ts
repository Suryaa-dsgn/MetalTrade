import type { NextConfig } from "next"

import { buildSecurityHeaders } from "./lib/security/headers"

/*
  Sec Phase 2 — hosting-agnostic HTTP security headers + CSP (Report-Only).

  ENFORCED now (safe, non-breaking, portable across any host): X-Content-Type-
  Options, Referrer-Policy, Permissions-Policy, X-Frame-Options: DENY, and
  poweredByHeader: false.

  REPORT-ONLY (observed, not enforced): Content-Security-Policy-Report-Only, built
  from the app's ACTUAL rendered output. Reports surface in the browser console;
  no report endpoint / new route is introduced. Switching to enforcement (and any
  nonce-based script-src work) is a separate, deliberate decision. See
  lib/security/headers.ts for the policy and rationale.

  HSTS is opt-in via SECURITY_HSTS=1 in production only (no preload). Final
  hosting is undecided and the edge usually owns HSTS; keeping it off by default
  guarantees exactly one owning layer and no conflicting duplicate policy.
*/
const enableHsts =
  process.env.NODE_ENV === "production" && process.env.SECURITY_HSTS === "1"

const securityHeaders = buildSecurityHeaders({ hsts: enableHsts })

const nextConfig: NextConfig = {
  // Do not advertise the framework in an `X-Powered-By` header.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },

  experimental: {
    // Coarse Server Action body-size backstop (Sec Phase 1). The enquiry forms
    // are text-only and there are no uploads, so a large request body is never
    // legitimate. Field-level Zod `.max()` limits remain the authoritative guard;
    // this simply rejects an oversized body at the framework boundary before it
    // reaches the action. Verified supported by Next 16.3.4
    // (experimental.serverActions.bodySizeLimit).
    serverActions: {
      bodySizeLimit: "64kb",
    },
  },
}

export default nextConfig
