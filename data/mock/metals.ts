import type { Metal } from "@/lib/market/types"
import { metalAssets } from "@/lib/assets/metals"

/*
  MOCK metal catalogue for development. Physical forms are general industry
  categories, not a statement of the client's actual offering.
  TODO(client): confirm which metals/forms are genuinely traded before launch.
  Image provenance lives in `lib/assets/metals.ts` (kept out of this throwaway
  fixture); each `image` references that registry.
*/
export const metals: Metal[] = [
  {
    slug: "copper",
    name: "Copper",
    symbol: "Cu",
    category: "Base metals",
    forms: ["Cathodes", "Concentrates", "Scrap"],
    summary:
      "Refined cathodes, concentrates, and recycled units for wiring, construction, and electrification demand.",
    image: metalAssets.copper,
  },
  {
    slug: "aluminium",
    name: "Aluminium",
    symbol: "Al",
    category: "Base metals",
    forms: ["Ingots", "Billets", "Scrap"],
    summary:
      "Primary and recycled aluminium in ingot and billet form for transport, packaging, and construction.",
    image: metalAssets.aluminium,
  },
  {
    slug: "nickel",
    name: "Nickel",
    symbol: "Ni",
    category: "Base metals",
    forms: ["Briquettes", "Cathodes", "Concentrates"],
    summary:
      "Class 1 units and concentrates for stainless steel and battery-grade downstream processing.",
    image: metalAssets.nickel,
  },
  {
    slug: "zinc",
    name: "Zinc",
    symbol: "Zn",
    category: "Base metals",
    forms: ["SHG ingots", "Concentrates"],
    summary:
      "Special high-grade ingots and concentrates for galvanising and alloy production.",
    image: metalAssets.zinc,
  },
  {
    slug: "gold",
    name: "Gold",
    symbol: "Au",
    category: "Precious metals",
    forms: ["Bullion", "Doré", "Grain"],
    summary:
      "Investment and industrial gold in bullion, doré, and grain, subject to assay and documentation.",
    image: metalAssets.gold,
  },
  {
    slug: "lithium",
    name: "Lithium",
    symbol: "Li",
    category: "Battery & energy",
    forms: ["Carbonate", "Hydroxide", "Spodumene"],
    summary:
      "Carbonate, hydroxide, and spodumene concentrate for battery and energy-storage supply chains.",
    image: metalAssets.lithium,
  },
]
