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
    description: "Export and import formalities are handled per jurisdiction.",
  },
  {
    key: "delivery",
    label: "Delivery",
    description:
      "Delivery is confirmed at the agreed destination and Incoterm.",
  },
]

export const lifecycleNote =
  "This is a typical trade flow. The exact stages, sequence, and responsibilities vary by material, origin, destination, and agreed commercial terms — not every trade passes through all eight."

// Capability CATEGORIES the trade desk coordinates where agreed — supporting
// information, not guaranteed services.
export const capabilities: Capability[] = [
  {
    key: "freight",
    title: "Freight coordination",
    description:
      "Coordination of inland and main-carriage freight where agreed for the route.",
    note: "Confirmed per engagement",
  },
  {
    key: "customs",
    title: "Customs & documentation",
    description:
      "Preparation and checking of trade documents; customs handled per jurisdiction.",
    note: "Confirmed per engagement",
  },
  {
    key: "inspection",
    title: "Inspection & assay",
    description:
      "Independent inspection or assay arranged where agreed in the transaction.",
    note: "Confirmed per engagement",
  },
  {
    key: "warehousing",
    title: "Warehousing",
    description: "Storage and handling arranged where required by the trade.",
    note: "Confirmed per engagement",
  },
  {
    key: "insurance",
    title: "Insurance",
    description:
      "Cargo insurance arranged with third parties where agreed; cover and terms are transaction-specific.",
    note: "Confirmed per engagement",
  },
  {
    key: "tracking",
    title: "Tracking",
    description:
      "Shipment status shared where a tracked route and data are available.",
    note: "Confirmed per engagement",
  },
]

export const capabilityNote =
  "Logistics scope is agreed per transaction. Available services, routes, third parties, and responsibilities depend on the specific trade — nothing here is a guaranteed service."

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
  "Coordinating agreed logistics and documentation",
  "Arranging inspection and assay where agreed",
  "Preparing and checking trade documents",
  "Coordinating freight and customs per route",
]

export const scopeOutside: string[] = [
  "Acting as carrier, freight forwarder, or insurer of record unless agreed",
  "Guaranteeing specific lanes, ports, or transit times",
  "Providing customs or legal advice",
  "Assuming responsibilities outside the agreed Incoterm",
]

export const faqs: Faq[] = [
  {
    id: "import-export",
    question: "Do you handle both import and export?",
    answer:
      "Export and import formalities are coordinated per jurisdiction and the agreed Incoterm. Specifics are confirmed per transaction.",
  },
  {
    id: "incoterms",
    question: "Which Incoterms do you work with?",
    answer:
      "Common Incoterms such as FOB, CIF, CFR, and EXW are used; the applicable terms are agreed for each trade.",
  },
  {
    id: "inspection",
    question: "Do you arrange inspection?",
    answer:
      "Independent inspection or assay is coordinated where agreed in the transaction.",
  },
  {
    id: "insurance",
    question: "Is cargo insured?",
    answer:
      "Cargo insurance is arranged with third parties where agreed. Cover and terms are transaction-specific.",
  },
  {
    id: "tracking",
    question: "Can I track my shipment?",
    answer:
      "Shipment status is shared where a tracked route and data are available for the movement.",
  },
  {
    id: "route",
    question: "What determines the route and transport modes?",
    answer:
      "Route and transport modes are considered according to material, origin, destination, and agreed terms.",
  },
  {
    id: "responsibility",
    question: "Who is responsible at each stage?",
    answer:
      "Responsibilities follow the agreed Incoterm and contract; the trade desk coordinates within that scope.",
  },
]
