/*
  Site-level identity and client business facts (Phase 9B).

  Sourced from the client's confirmed answers. The company is a licensed mineral
  aggregator; it is NOT a licensed miner/mining company/operator (any pending
  mining licence is tracked only in docs/content-claims-register.md, not shown
  publicly). Verification is a process (supplier review, engineer inspection,
  independent third-party inspection), not a blanket property of every supply.
  Contact is form-first; no public email/phone until the client decides.
*/
export const siteConfig = {
  // Header wordmark (short form). Footer uses the full legal name below.
  name: "Oriental Energy and Minerals",
  legalName: "Oriental Energy and Minerals Limited",

  positioning:
    "A licensed mineral aggregator connecting physical commodity supply with vetted demand.",

  // Regions and counterparties (client-confirmed; no vague global-network claim).
  regions: {
    suppliers:
      "Suppliers are currently based in Africa, and we are open to suppliers from other regions.",
    buyers:
      "Buyers are industrial companies and financial institutions in Asia and the Middle East.",
  },

  // Form-first contact. Monitored email/phone are not published yet. Never invent.
  contact: {
    email: null as string | null,
    phone: null as string | null,
  },
} as const

export type SiteConfig = typeof siteConfig
