import { UNVERIFIED_LICENSE, type ImageAsset } from "@/lib/assets/types"

/*
  Editorial image slots shared across the home, company, and logistics pages.
  Provenance is kept here (production concern), separate from mock data.

  - `logistics` is wired to a client-supplied port image (illustrative,
    UNVERIFIED license). `alt` describes only what is in frame — it does not
    claim the port, ship, or cargo belongs to the client (amendment 2 / 7).
  - `supplier` and `buyer` stay unavailable: their supplied files were excluded
    in the Phase 9 audit (a smokestack refinery, off-message for responsible
    sourcing; and a port scene carrying a fabricated spec placard + QR + slogans
    baked into the pixels). Their slots keep the neutral placeholder.
    TODO(client): supply cleared, on-message replacements.
*/
export const homeAssets = {
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
    alt: "Aerial view of a container port at dusk, with gantry cranes and a docked container ship.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 52 },
    available: true,
  },
} satisfies Record<string, ImageAsset>
