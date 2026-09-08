import type { Metal } from "@/lib/market/types"

/*
  MOCK metal catalogue for development. Physical forms are general industry
  categories, not a statement of the client's actual offering.
  TODO(client): confirm which metals/forms are genuinely traded before launch.
  Images are placeholders until licensed files exist in /public/images/metals.
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
    image: {
      id: "metal-copper",
      src: "/images/metals/copper-cathode-macro.webp",
      alt: "Close-up of copper cathode surface texture.",
      available: false,
    },
  },
  {
    slug: "aluminium",
    name: "Aluminium",
    symbol: "Al",
    category: "Base metals",
    forms: ["Ingots", "Billets", "Scrap"],
    summary:
      "Primary and recycled aluminium in ingot and billet form for transport, packaging, and construction.",
    image: {
      id: "metal-aluminium",
      src: "/images/metals/aluminium-billet-macro.webp",
      alt: "Stacked aluminium billets.",
      available: false,
    },
  },
  {
    slug: "nickel",
    name: "Nickel",
    symbol: "Ni",
    category: "Base metals",
    forms: ["Briquettes", "Cathodes", "Concentrates"],
    summary:
      "Class 1 units and concentrates for stainless steel and battery-grade downstream processing.",
    image: {
      id: "metal-nickel",
      src: "/images/metals/nickel-briquette-macro.webp",
      alt: "Nickel briquettes.",
      available: false,
    },
  },
  {
    slug: "zinc",
    name: "Zinc",
    symbol: "Zn",
    category: "Base metals",
    forms: ["SHG ingots", "Concentrates"],
    summary:
      "Special high-grade ingots and concentrates for galvanising and alloy production.",
    image: {
      id: "metal-zinc",
      src: "/images/metals/zinc-ingot-macro.webp",
      alt: "Special high-grade zinc ingots.",
      available: false,
    },
  },
  {
    slug: "gold",
    name: "Gold",
    symbol: "Au",
    category: "Precious metals",
    forms: ["Bullion", "Doré", "Grain"],
    summary:
      "Investment and industrial gold in bullion, doré, and grain, subject to assay and documentation.",
    image: {
      id: "metal-gold",
      src: "/images/metals/gold-bullion-closeup.webp",
      alt: "Close-up of a gold bullion bar.",
      available: false,
    },
  },
  {
    slug: "lithium",
    name: "Lithium",
    symbol: "Li",
    category: "Battery & energy",
    forms: ["Carbonate", "Hydroxide", "Spodumene"],
    summary:
      "Carbonate, hydroxide, and spodumene concentrate for battery and energy-storage supply chains.",
    image: {
      id: "metal-lithium",
      src: "/images/metals/lithium-carbonate-detail.webp",
      alt: "Lithium carbonate powder detail.",
      available: false,
    },
  },
]
