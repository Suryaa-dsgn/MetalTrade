import { UNVERIFIED_LICENSE, type ImageAsset } from "@/lib/assets/types"

/*
  Production image provenance for the metal catalogue, kept SEPARATE from the
  mock market data in `data/mock/metals.ts` (amendment 9): market fixtures are
  throwaway; asset clearance is a real, tracked concern.

  All entries are client-supplied and default to `usage: "illustrative"` with an
  UNVERIFIED license until the client confirms rights and provenance. `alt`
  describes ONLY what is visibly in frame — it never asserts metal grade, purity,
  form, origin, or that the image is the client's own material (amendment 2).

  `lithium` stays unavailable: the supplied file is lavender/purple and cannot
  ship (no-purple guardrail); its slot keeps the neutral placeholder.
  TODO(client): supply a cleared, non-purple lithium reference image.
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
    alt: "Lithium material reference — cleared image required.",
    available: false,
  },
} satisfies Record<string, ImageAsset>
