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
  provider: "Licensed market-data provider, pending connection",
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

/*
  Brent Crude detail content. Same guardrail as Copper: specifications are
  "Confirmed per enquiry" placeholders (never invented); applications and pricing
  factors are general, educational facts about crude oil, not claims about the
  client's offering. The chart is wired to REAL EIA Brent (RBRTE) history; the
  `provider` label here is overridden by the service with the live EIA attribution.
  Ranges: 30D / 90D / 1Y (1M / 3M / 1Y).
*/
export const crudeOilDetailContent: MetalDetailContent = {
  slug: "crude-oil",
  provider: "U.S. Energy Information Administration (EIA)",
  supportedRanges: ["1M", "3M", "1Y"],
  specifications: [
    { label: "Grade", value: null, note: "Subject to transaction" },
    { label: "API gravity", value: null },
    { label: "Sulphur content", value: null },
    { label: "Origin", value: null },
    { label: "Delivery point", value: null },
    { label: "Minimum order quantity", value: null },
    { label: "Availability", value: null },
    { label: "Inspection", value: null, note: "Coordinated where agreed" },
    { label: "Documentation", value: null },
    { label: "Incoterm", value: null, note: "Agreed per contract" },
  ].map((f) => ({ ...f, value: f.value ?? enquiryPlaceholder })),
  applications: [
    "Transport fuels (petrol, diesel, jet fuel)",
    "Heating and power generation",
    "Petrochemical feedstock for plastics and chemicals",
    "Lubricants and industrial oils",
    "Bitumen and asphalt for construction",
  ],
  regionsNote: "Regions served are confirmed per transaction.",
  pricingFactors: [
    "OPEC+ supply policy and global production levels",
    "Global demand and macroeconomic conditions",
    "Crude quality (API gravity and sulphur content)",
    "Freight, shipping, and destination logistics",
    "Inventories, seasonality, and geopolitical risk",
  ],
}

export const metalDetailContent: Record<string, MetalDetailContent> = {
  copper: copperDetailContent,
  "crude-oil": crudeOilDetailContent,
}
