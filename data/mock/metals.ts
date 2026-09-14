import type { Metal } from "@/lib/market/types"
import { metalAssets } from "@/lib/assets/metals"

/*
  Commodity catalogue (Phase 9B). These are the client's confirmed public
  commodities. Only forms explicitly supplied by the client are listed (Copper is
  supplied as cathode); everything else omits `forms` and is confirmed per
  enquiry. Only Copper/Gold/Lithium carry a market `symbol` and sample market
  data; the rest have no approved market identity, so their market profile shows
  as "in preparation" (no fabricated codes, prices, grades, or specifications).

  NOTE: Crude Oil and Bitumen are commodities, not metals; the broader "commodity"
  wording in public copy reflects that. Summaries are general commodity
  descriptions, not statements of the client's specific offering.
  Image provenance lives in `lib/assets/metals.ts`.
*/
export const metals: Metal[] = [
  {
    slug: "copper",
    name: "Copper",
    symbol: "Cu",
    category: "Base metals",
    forms: ["Cathode"],
    summary:
      "Copper cathode for electrical, construction, and electrification demand.",
    image: metalAssets.copper,
  },
  {
    slug: "gold",
    name: "Gold",
    symbol: "Au",
    category: "Precious metals",
    summary: "A precious metal for investment and industrial applications.",
    image: metalAssets.gold,
  },
  {
    slug: "lithium",
    name: "Lithium",
    symbol: "Li",
    category: "Battery & technology",
    summary: "A key input for battery and energy-storage supply chains.",
    image: metalAssets.lithium,
  },
  {
    slug: "tin",
    name: "Tin",
    category: "Base metals",
    summary: "A base metal used in solder, plating, and alloys.",
    image: metalAssets.tin,
  },
  {
    slug: "lead-zinc",
    name: "Lead-Zinc",
    category: "Base metals",
    summary:
      "Combined lead and zinc units for batteries, galvanising, and alloys.",
    image: metalAssets["lead-zinc"],
  },
  {
    slug: "manganese",
    name: "Manganese",
    category: "Bulk & ferrous",
    summary: "An input for steelmaking and battery chemistries.",
    image: metalAssets.manganese,
  },
  {
    slug: "iron-ore",
    name: "Iron Ore",
    category: "Bulk & ferrous",
    summary: "The primary raw material for steel production.",
    image: metalAssets["iron-ore"],
  },
  {
    slug: "coltan",
    name: "Columbite-Tantalite (Coltan)",
    category: "Battery & technology",
    summary:
      "Columbite-tantalite ore, a source of tantalum and niobium for electronics.",
    image: metalAssets.coltan,
  },
  {
    slug: "rare-earth-elements",
    name: "Rare Earth Elements",
    category: "Battery & technology",
    summary:
      "Rare earth elements used in magnets, electronics, and clean-energy technology.",
    image: metalAssets.ree,
  },
  {
    slug: "barite",
    name: "Barite",
    category: "Industrial minerals",
    summary:
      "An industrial mineral used in drilling fluids and as a weighting agent.",
    image: metalAssets.barite,
  },
  {
    slug: "bitumen",
    name: "Bitumen",
    category: "Energy",
    summary: "A heavy hydrocarbon used in road construction and waterproofing.",
    image: metalAssets.bitumen,
  },
  {
    slug: "crude-oil",
    name: "Crude Oil",
    category: "Energy",
    summary: "Unrefined petroleum traded as a bulk energy commodity.",
    image: metalAssets["crude-oil"],
  },
]
