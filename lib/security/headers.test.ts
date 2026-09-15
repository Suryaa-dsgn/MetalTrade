import { describe, it, expect } from "vitest"
import {
  buildSecurityHeaders,
  contentSecurityPolicy,
  CSP_DIRECTIVES,
} from "@/lib/security/headers"

/*
  Sec Phase 2 — security headers + CSP Report-Only. These assert the policy shape
  and the safe invariants (no `*` sources, no unsafe-eval, CSP stays report-only,
  HSTS is opt-in).
*/

function headerMap(hsts = false): Record<string, string> {
  return Object.fromEntries(
    buildSecurityHeaders({ hsts }).map((h) => [h.key, h.value])
  )
}

describe("buildSecurityHeaders", () => {
  it("enforces the core hardening headers", () => {
    const h = headerMap()
    expect(h["X-Content-Type-Options"]).toBe("nosniff")
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    expect(h["X-Frame-Options"]).toBe("DENY")
    expect(h["Permissions-Policy"]).toContain("geolocation=()")
  })

  it("ships CSP as Report-Only, never enforced, in this phase", () => {
    const h = headerMap()
    expect(h["Content-Security-Policy-Report-Only"]).toBe(contentSecurityPolicy)
    expect(h["Content-Security-Policy"]).toBeUndefined()
  })

  it("omits HSTS by default and includes it (no preload) only when opted in", () => {
    expect(headerMap(false)["Strict-Transport-Security"]).toBeUndefined()
    const hsts = headerMap(true)["Strict-Transport-Security"]
    expect(hsts).toContain("max-age=31536000")
    expect(hsts).toContain("includeSubDomains")
    expect(hsts).not.toContain("preload")
  })
})

describe("content security policy", () => {
  it("does not use wildcard or unsafe-eval sources", () => {
    expect(contentSecurityPolicy).not.toContain("script-src *")
    expect(contentSecurityPolicy).not.toContain("connect-src *")
    expect(contentSecurityPolicy).not.toContain("unsafe-eval")
  })

  it("locks down the dangerous fetch/frame/base directives", () => {
    expect(CSP_DIRECTIVES).toContain("object-src 'none'")
    expect(CSP_DIRECTIVES).toContain("frame-ancestors 'none'")
    expect(CSP_DIRECTIVES).toContain("base-uri 'self'")
    expect(CSP_DIRECTIVES).toContain("form-action 'self'")
    expect(CSP_DIRECTIVES).toContain("default-src 'self'")
  })

  it("keeps script and connect sources same-origin (no third-party origins)", () => {
    const scriptSrc = CSP_DIRECTIVES.find((d) => d.startsWith("script-src"))
    const connectSrc = CSP_DIRECTIVES.find((d) => d.startsWith("connect-src"))
    // 'unsafe-inline' is the documented Next inline-bootstrap accommodation; no
    // external origins are permitted.
    expect(scriptSrc).toBe("script-src 'self' 'unsafe-inline'")
    expect(connectSrc).toBe("connect-src 'self'")
    expect(scriptSrc).not.toMatch(/https?:\/\//)
  })
})
