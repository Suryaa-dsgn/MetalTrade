import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
