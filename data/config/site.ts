/*
  Site-level identity and configuration.

  WORKING VALUES — client approval pending. Nothing here is a verified fact.
  The public company name, final positioning, and monitored contact details
  must be validated by the client before launch (Blueprint §1, §20).
*/
export const siteConfig = {
  // TODO(client): working title only — replace with the client-approved public
  // company/legal entity name. Do not treat as final.
  name: "Metal Trading Portal",

  // TODO(client): working positioning from Blueprint §1. Final positioning,
  // claims, and metrics must be validated by the client.
  positioning: "Connecting trusted metal supply with qualified global demand.",

  // TODO(client): monitored contact channels not yet supplied. Never invent.
  contact: {
    email: null as string | null,
    phone: null as string | null,
  },
} as const

export type SiteConfig = typeof siteConfig
