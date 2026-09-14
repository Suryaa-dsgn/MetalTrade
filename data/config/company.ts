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

// Aggregator operating model (Phase 9B). Suppliers and buyers are not introduced
// to each other; the company sits between them as the aggregator.
export const operatingModel: OperatingStep[] = [
  {
    key: "aggregate",
    label: "Aggregate",
    description:
      "Source material from suppliers, currently in Africa and open to other regions.",
  },
  {
    key: "review",
    label: "Review",
    description: "Review material type, quantity, location, and documents.",
  },
  {
    key: "inspect",
    label: "Inspect",
    description: "Our engineer inspects the supplier's facility and goods.",
  },
  {
    key: "verify",
    label: "Verify",
    description:
      "Independent third-party inspection and testing when a vetted buyer is in place.",
  },
  {
    key: "coordinate",
    label: "Coordinate",
    description: "Coordinate freight and customs at the origin airport or port.",
  },
  {
    key: "deliver",
    label: "Deliver",
    description:
      "Deliver to the vetted buyer, who handles customs at the destination.",
  },
]

export const operatingModelNote =
  "This is a typical sequence. Involvement and steps vary by transaction, material, counterparties, and commercial terms."

// Confirmed public commodity catalogue, grouped for the company page; links to
// the markets pages. Availability and specifications are confirmed per enquiry.
export const metalCategories: MetalCategory[] = [
  { name: "Precious metals", metals: "Gold", href: "/markets" },
  { name: "Base metals", metals: "Copper · Tin · Lead-Zinc", href: "/markets" },
  { name: "Bulk & ferrous", metals: "Manganese · Iron Ore", href: "/markets" },
  {
    name: "Battery & technology",
    metals: "Lithium · Coltan · Rare Earth Elements",
    href: "/markets",
  },
  { name: "Industrial minerals", metals: "Barite", href: "/markets" },
  { name: "Energy", metals: "Crude Oil · Bitumen", href: "/markets" },
]

export const metalCategoriesNote =
  "The commodities we handle across the platform. Availability and specifications are confirmed per enquiry."

// Verification checklist: client-confirmed items only (Phase 9B). No KYB,
// beneficial-ownership, or sanctions claims are asserted (not confirmed).
export const responsibleSourcing: string[] = [
  "Supplier verification before a trade progresses.",
  "Origin documentation reviewed where available.",
  "Inspection of the supplier's facility and goods by our engineer.",
  "Independent third-party inspection and testing when a vetted buyer is in place.",
  "Licence, permit, and company registration numbers available for verification on request.",
]

// Verification approach on request. Licensing documents are NOT posted publicly
// (they can be copied); numbers are shared with vetted parties on request.
export const dueDiligence: DueDiligenceRow[] = [
  {
    term: "Supplier verification",
    detail: "Suppliers are verified before a trade progresses.",
  },
  {
    term: "Origin documentation",
    detail: "Origin documents are reviewed where available.",
  },
  {
    term: "Independent inspection",
    detail:
      "Independent third-party inspection and testing is arranged when a vetted buyer is in place.",
  },
  {
    term: "Licensure on request",
    detail:
      "Company registration and licence or permit numbers are provided for verification on request from vetted suppliers and buyers. Documents are not posted publicly.",
  },
]

export const dueDiligenceLimitation =
  "The scope of any review depends on the transaction, material, and counterparties. This is not a certification or a compliance guarantee."

export const regionsNote =
  "Suppliers are currently based in Africa, and we are open to suppliers from other regions. Buyers are industrial companies and financial institutions in Asia and the Middle East."

export const proofNote =
  "Verified operating facts and approved metrics are published as they are confirmed."
