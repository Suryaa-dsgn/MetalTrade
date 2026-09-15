import { UNVERIFIED_LICENSE, type ImageAsset } from "@/lib/assets/types"

/*
  Production image provenance for the metal catalogue, kept SEPARATE from the
  mock market data in `data/mock/metals.ts` (amendment 9): market fixtures are
  throwaway; asset clearance is a real, tracked concern.

  All entries are client-supplied and default to `usage: "illustrative"` with an
  UNVERIFIED license until the client confirms rights and provenance. `alt`
  describes ONLY what is visibly in frame — it never asserts metal grade, purity,
  form, origin, or that the image is the client's own material (amendment 2).

  `lithium` was wired in Phase 9A.2 once a cleared, silver-grey replacement
  arrived (the earlier lavender/purple file was rejected under the no-purple
  guardrail and archived).
*/
export const metalAssets = {
  copper: {
    id: "metal-copper",
    src: "/images/metals/copper-specimen.webp",
    alt: "A rough, copper-coloured metallic specimen under directional light.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  aluminium: {
    id: "metal-aluminium",
    src: "/images/metals/aluminium-specimen.webp",
    alt: "Rough, faceted silver-grey metallic crystals.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  nickel: {
    id: "metal-nickel",
    src: "/images/metals/nickel-specimen.webp",
    alt: "A dark, lustrous grey metallic specimen with a granular surface.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  zinc: {
    id: "metal-zinc",
    src: "/images/metals/zinc-specimen.webp",
    alt: "A faceted grey metallic mineral specimen on a neutral background.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  gold: {
    id: "metal-gold",
    src: "/images/metals/gold-specimen.webp",
    alt: "A gold-coloured metallic specimen resting on dark rock.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  lithium: {
    id: "metal-lithium",
    src: "/images/metals/lithium-specimen.webp",
    alt: "A silver-grey metallic specimen with small flaked fragments on a light surface.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },

  // Phase 9B commodities: client-supplied imagery now wired. Each `alt` names the
  // subject in frame only (no grade/purity/origin/ownership claim), and clearance
  // stays UNVERIFIED until the client confirms rights. Files follow the kebab-case
  // /public/images naming convention.
  tin: {
    id: "metal-tin",
    src: "/images/metals/tin.png",
    alt: "Tin specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  "lead-zinc": {
    id: "metal-lead-zinc",
    src: "/images/metals/lead-zinc.png",
    alt: "Lead-zinc ore specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  manganese: {
    id: "metal-manganese",
    src: "/images/metals/manganese.png",
    alt: "Manganese ore specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  "iron-ore": {
    id: "metal-iron-ore",
    src: "/images/metals/iron-ore.jpg",
    alt: "Iron ore specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  coltan: {
    id: "metal-coltan",
    src: "/images/metals/coltan.png",
    alt: "Columbite-tantalite (coltan) ore specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  ree: {
    id: "metal-ree",
    src: "/images/metals/rare-earth-elements.jpg",
    alt: "Rare earth elements specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  barite: {
    id: "metal-barite",
    src: "/images/metals/barite.jpg",
    alt: "Barite mineral specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  bitumen: {
    id: "metal-bitumen",
    src: "/images/metals/bitumen.jpg",
    alt: "Bitumen specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
  "crude-oil": {
    id: "metal-crude-oil",
    src: "/images/metals/crude-oil.jpg",
    alt: "Crude oil specimen",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
  },
} satisfies Record<string, ImageAsset>
