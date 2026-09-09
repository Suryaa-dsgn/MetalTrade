import { metals } from "@/data/mock/metals"

/*
  Enquiry option lists + hub intents. Controlled taxonomy values feed the custom
  Select fields (metal, unit, Incoterm, mode). `CATALOGUE_METAL_SLUGS` is used to
  validate a `?metal=` prefill against the real catalogue (amendment 7).
*/
type Option = { value: string; label: string }

export const CATALOGUE_METAL_SLUGS = metals.map((m) => m.slug)

export const metalOptions: Option[] = [
  ...metals.map((m) => ({ value: m.slug, label: m.name })),
  { value: "other", label: "Other (specify in message)" },
]

export const unitOptions: Option[] = [
  { value: "MT", label: "Metric tonne (MT)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "oz", label: "Troy ounce (oz)" },
]

export const incotermOptions: Option[] = [
  { value: "FOB", label: "FOB — Free On Board" },
  { value: "CIF", label: "CIF — Cost, Insurance and Freight" },
  { value: "CFR", label: "CFR — Cost and Freight" },
  { value: "EXW", label: "EXW — Ex Works" },
  { value: "other", label: "Other / to discuss" },
]

export const modeOptions: Option[] = [
  { value: "road", label: "Road" },
  { value: "rail", label: "Rail" },
  { value: "sea", label: "Sea" },
  { value: "air", label: "Air" },
  { value: "any", label: "Any / multiple" },
]

export type EnquiryIntentCard = {
  id: string
  title: string
  description: string
  href: string
  iconKey: "supply" | "buying" | "logistics" | "general"
}

export const enquiryIntents: EnquiryIntentCard[] = [
  {
    id: "supply",
    title: "I have metal to sell",
    description:
      "Bring a supply position to qualified demand — material, forms, quantity, and origin.",
    href: "/enquire/supply",
    iconKey: "supply",
  },
  {
    id: "buying",
    title: "I want to source metal",
    description:
      "Define a requirement — metal, specification, quantity, and destination.",
    href: "/enquire/buying-requirement",
    iconKey: "buying",
  },
  {
    id: "logistics",
    title: "I need logistics support",
    description:
      "Share a route — commodity, origin, destination, and timing to assess feasibility.",
    href: "/enquire/logistics",
    iconKey: "logistics",
  },
  {
    id: "general",
    title: "General enquiry",
    description: "Any other question for the trade desk.",
    href: "/enquire/general",
    iconKey: "general",
  },
]
