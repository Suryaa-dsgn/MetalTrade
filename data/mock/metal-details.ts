import type { ChartRange, SpecField } from "@/lib/market/types"

/*
  MOCK metal-detail content (Copper only in this phase).

  Physical specifications are deliberately NOT invented (amendment 4): every
  field is a "Confirmed per enquiry" placeholder until client-provided content
  exists. Applications and pricing factors are general, educational facts about
  the commodity, not statements about the client's specific offering.

  `supportedRanges` is a per-metal CONFIG decision (5Y omitted for Copper here),
  not a rule baked into the chart component (amendment 1).
*/
export type MetalDetailContent = {
  slug: string
  provider: string
  supportedRanges: ChartRange[]
  specifications: SpecField[]
  applications: string[]
  regionsNote: string
  pricingFactors: string[]
}

const enquiryPlaceholder = "Confirmed per enquiry"

export const copperDetailContent: MetalDetailContent = {
  slug: "copper",
  provider: "Licensed market-data provider — pending connection",
  supportedRanges: ["1D", "7D", "1M", "3M", "1Y"],
  specifications: [
    { label: "Grade", value: null, note: "Subject to transaction" },
    { label: "Purity", value: null },
    { label: "Assay", value: null },
    { label: "Origin", value: null },
    { label: "Packaging", value: null },
    { label: "Minimum order quantity", value: null },
    { label: "Availability", value: null },
    { label: "Inspection", value: null, note: "Coordinated where agreed" },
    { label: "Documentation", value: null },
    { label: "Incoterm", value: null, note: "Agreed per contract" },
  ].map((f) => ({ ...f, value: f.value ?? enquiryPlaceholder })),
  applications: [
    "Electrical wiring and cabling",
    "Construction and plumbing",
    "Power generation and transmission",
    "Electronics and connectors",
    "Electric vehicles and renewable infrastructure",
  ],
  regionsNote: "Regions served are confirmed per transaction.",
  pricingFactors: [
    "Treatment and refining charges (TC/RCs)",
    "Physical premiums over the benchmark",
    "Purity, form, and brand registration",
    "Logistics, freight, and destination",
    "Quantity, timing, and contract terms",
  ],
}

export const metalDetailContent: Record<string, MetalDetailContent> = {
  copper: copperDetailContent,
}
