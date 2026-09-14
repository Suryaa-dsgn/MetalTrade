/*
  Trade & Logistics page CONTENT (Blueprint §6.4). WORKING COPY — client
  confirmation pending. This describes a typical trade flow and general trade
  concepts; it does NOT assert the client's actual operating capability, lanes,
  partners, insurers, or transit times (amendment 13). Icon keys are strings;
  components map them to icons. No layout/styling here (amendment 11).
*/

export type LifecycleStage = { key: string; label: string; description: string }
export type Capability = {
  key: string
  title: string
  description: string
  note: string
}
export type TransportMode = { key: string; label: string }
export type Incoterm = { code: string; name: string; definition: string }
export type Faq = { id: string; question: string; answer: string }

// The 8-stage lifecycle is a TYPICAL flow — exact stages vary per trade.
export const lifecycleStages: LifecycleStage[] = [
  {
    key: "trade-confirmation",
    label: "Trade confirmation",
    description:
      "Commercial terms, specification, and documentation are agreed before any movement.",
  },
  {
    key: "inspection",
    label: "Inspection",
    description:
      "Independent inspection or assay is coordinated where agreed in the transaction.",
  },
  {
    key: "documentation",
    label: "Documentation",
    description: "Trade and shipping documents are prepared and checked.",
  },
  {
    key: "collection",
    label: "Collection",
    description: "Material is collected from the agreed origin point.",
  },
  {
    key: "inland-transport",
    label: "Inland transport",
    description:
      "Road or rail movement toward the load port or destination, per route.",
  },
  {
    key: "port-freight",
    label: "Port & freight",
    description:
      "Loading and main-carriage freight are coordinated where applicable.",
  },
  {
    key: "customs",
    label: "Customs",
    description:
      "Export customs is handled at the origin; import customs at the destination is handled by the buyer.",
  },
  {
    key: "delivery",
    label: "Delivery",
    description:
      "Delivery is confirmed at the agreed destination and Incoterm.",
  },
]

export const lifecycleNote =
  "This is a typical trade flow. The exact stages, sequence, and responsibilities vary by material, origin, destination, and agreed commercial terms. Not every trade passes through all eight."

// What the company actually coordinates (Phase 9B). Client-confirmed: inspection,
// freight, and customs at the origin. Warehousing, insurance, tracking, and
// financing are NOT confirmed services and are covered in "outside scope".
export const capabilities: Capability[] = [
  {
    key: "inspection",
    title: "Inspection & testing",
    description:
      "Engineer inspection of the facility and goods, then independent third-party inspection and testing when a vetted buyer is in place.",
    note: "Coordinated per trade",
  },
  {
    key: "freight",
    title: "Freight coordination",
    description:
      "Coordination of inland and main-carriage freight where agreed for the route.",
    note: "Confirmed per engagement",
  },
  {
    key: "customs",
    title: "Customs at origin",
    description:
      "Export formalities are handled at the origin airport or port. Customs at the destination is handled by the buyer.",
    note: "Confirmed per engagement",
  },
]

export const capabilityNote =
  "The company coordinates inspection, freight, and customs at the origin. The buyer handles customs at the destination. Financing is not provided. Scope, routes, and third parties depend on the specific trade."

export const transportModes: TransportMode[] = [
  { key: "road", label: "Road" },
  { key: "rail", label: "Rail" },
  { key: "sea", label: "Sea" },
  { key: "air", label: "Air" },
]

export const transportModeNote =
  "Transport modes are considered according to route and transaction. Availability depends on the specific trade and is confirmed per engagement."

export const incoterms: Incoterm[] = [
  {
    code: "FOB",
    name: "Free On Board",
    definition:
      "The seller delivers the goods on board the vessel; risk transfers once the goods are loaded.",
  },
  {
    code: "CIF",
    name: "Cost, Insurance and Freight",
    definition:
      "The seller arranges carriage and insurance to the destination port; risk transfers on loading.",
  },
  {
    code: "CFR",
    name: "Cost and Freight",
    definition:
      "The seller arranges carriage to the destination port; the buyer bears risk after loading.",
  },
  {
    code: "EXW",
    name: "Ex Works",
    definition:
      "The buyer collects the goods at the seller's premises and bears onward risk and cost.",
  },
]

export const incotermNote =
  "These definitions are general references only and are not contractual advice. Responsibilities, risk, cost, insurance, destination, and delivery obligations are agreed per transaction."

export const scopeInside: string[] = [
  "Coordinating engineer inspection and independent third-party testing",
  "Coordinating freight for the route",
  "Handling customs at the origin airport or port",
  "Preparing and checking trade documents",
]

export const scopeOutside: string[] = [
  "Providing financing",
  "Customs at the destination, which is handled by the buyer",
  "Warehousing, cargo insurance, or shipment tracking, unless separately agreed",
  "Guaranteeing specific lanes, ports, or transit times",
  "Acting as carrier or freight forwarder of record, unless agreed",
]

export const faqs: Faq[] = [
  {
    id: "customs",
    question: "Who handles customs?",
    answer:
      "We handle export customs at the origin airport or port. Import customs at the destination is handled by the buyer.",
  },
  {
    id: "financing",
    question: "Do you provide financing?",
    answer: "No. Financing is not provided.",
  },
  {
    id: "inspection",
    question: "Do you arrange inspection?",
    answer:
      "Our engineer inspects the facility and goods, and independent third-party inspection and testing is arranged when a vetted buyer is in place.",
  },
  {
    id: "insurance",
    question: "Is cargo insured?",
    answer:
      "Cargo insurance is not a standard service. Any cover is arranged only where separately agreed for the trade.",
  },
  {
    id: "tracking",
    question: "Can I track my shipment?",
    answer:
      "Shipment tracking is not a standard service. Status updates are shared only where a tracked route and data are available.",
  },
  {
    id: "incoterms",
    question: "Which Incoterms do you work with?",
    answer:
      "Common Incoterms such as FOB, CIF, CFR, and EXW are used; the applicable terms are agreed for each trade.",
  },
  {
    id: "responsibility",
    question: "Who is responsible at each stage?",
    answer:
      "Responsibilities follow the agreed Incoterm and contract; the company coordinates inspection, freight, and origin customs within that scope.",
  },
]
