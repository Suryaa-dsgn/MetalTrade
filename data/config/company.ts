/*
  Company page CONTENT (Blueprint §6.5, §6.7, §8). WORKING COPY — client
  confirmation pending. Trust comes from evidence fields, not adjectives.
  Qualifiers ("may include", "where relevant", "where agreed", "subject to
  transaction review") are LOCAL to each item (amendment 3). No invented
  certifications, metrics, logos, regions, team, offices, or years (amendment 7).
  Pure content — no layout/styling here.
*/

export type OperatingStep = {
  key: string
  label: string
  description: string
}
export type MetalCategory = { name: string; metals: string; href: string }
export type DueDiligenceRow = { term: string; detail: string }

// Typical / supporting role — not a mandatory contractual six-step process.
export const operatingModel: OperatingStep[] = [
  {
    key: "source",
    label: "Source",
    description:
      "Identify material from mines, refiners, processors, and traders.",
  },
  {
    key: "evaluate",
    label: "Evaluate",
    description:
      "Review specification, documentation, and origin where relevant.",
  },
  {
    key: "connect",
    label: "Connect",
    description: "Match qualified supply to qualified demand.",
  },
  {
    key: "negotiate",
    label: "Negotiate",
    description: "Support commercial terms and Incoterms, per transaction.",
  },
  {
    key: "coordinate",
    label: "Coordinate",
    description:
      "Coordinate inspection, freight, and documentation where agreed.",
  },
  {
    key: "deliver",
    label: "Deliver",
    description: "Confirm delivery at the agreed destination.",
  },
]

export const operatingModelNote =
  "This is a typical role. The exact involvement and sequence vary by transaction, material, counterparties, and commercial terms."

// Platform market categories — not a claim that every category is actively
// traded (amendment 5). Drawn from the established catalogue; links to markets.
export const metalCategories: MetalCategory[] = [
  { name: "Base metals", metals: "Copper · Aluminium · Nickel · Zinc", href: "/markets" },
  { name: "Precious metals", metals: "Gold", href: "/markets" },
  { name: "Battery & energy", metals: "Lithium", href: "/markets" },
]

export const metalCategoriesNote =
  "Market categories covered across the platform. Availability and specific materials are confirmed per engagement."

// Responsible sourcing — process / provenance / material evidence (checklist).
export const responsibleSourcing: string[] = [
  "Supplier due diligence, where relevant to the counterparty and material.",
  "Origin documentation, where available for the material.",
  "Counterparty screening, where relevant to the transaction.",
  "Material verification through inspection or assay, where agreed.",
  "Trade and transport documentation, prepared and checked.",
  "Delivery confirmation at the agreed destination.",
]

// Due diligence — counterparty / ownership / sanctions-export / document review.
export const dueDiligence: DueDiligenceRow[] = [
  {
    term: "Counterparty qualification",
    detail: "May include know-your-business (KYB) checks, where relevant.",
  },
  {
    term: "Beneficial ownership",
    detail: "Ownership review may be requested, subject to transaction review.",
  },
  {
    term: "Sanctions & export controls",
    detail: "Screening may apply according to jurisdiction and counterparties.",
  },
  {
    term: "Document review",
    detail: "Trade and ownership documents are reviewed where provided.",
  },
]

export const dueDiligenceLimitation =
  "The scope and depth of any review depend on the transaction, jurisdiction, and counterparties. This is not a certification or a compliance guarantee."

export const regionsNote = "Regions served are confirmed per engagement."

export const proofNote =
  "Verified operating facts, approved partners, and metrics will be published here once confirmed."
