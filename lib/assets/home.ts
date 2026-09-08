import type { ImageAsset } from "@/lib/assets/types"

/*
  Home page editorial image slots. All `available: false` until licensed files
  are supplied (Phase 9). The layout renders a neutral `AssetPlaceholder` naming
  each required `src`. Paths follow the Design System §10.5 convention.
*/
export const homeAssets = {
  hero: {
    id: "home-hero",
    src: "/images/editorial/hero-industrial-metal.webp",
    alt: "Industrial metals operation — approved hero imagery required.",
    available: false,
  },
  supplier: {
    id: "home-supplier",
    src: "/images/editorial/source-material-yard.webp",
    alt: "Source material at a processing yard.",
    available: false,
  },
  buyer: {
    id: "home-buyer",
    src: "/images/destination/manufacturing-line.webp",
    alt: "Downstream manufacturing line.",
    available: false,
  },
  logistics: {
    id: "home-logistics",
    src: "/images/editorial/logistics-port-containers.webp",
    alt: "Port with freight containers.",
    available: false,
  },
} satisfies Record<string, ImageAsset>
