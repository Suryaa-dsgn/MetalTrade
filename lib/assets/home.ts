import { UNVERIFIED_LICENSE, type ImageAsset } from "@/lib/assets/types"

/*
  Editorial image slots shared across the home, company, and logistics pages.
  Provenance is kept here (production concern), separate from mock data.

  - `logistics` is wired to a client-supplied port image (illustrative,
    UNVERIFIED license). `alt` describes only what is in frame — it does not
    claim the port, ship, or cargo belongs to the client (amendment 2 / 7).
  - `supplier` is wired (Phase 9A.2) to a client-supplied metal-mill image
    (illustrative, UNVERIFIED). `alt` describes only what is in frame — it does
    not claim the mill, crane, or coils belong to the client (amendment 2 / 7).
    It feeds both the home supplier proposition and the company hero: both are
    material-handling/operations contexts, so the reuse is deliberate.
  - `buyer` was wired in Phase 9A.2 once a cleared, on-message replacement
    arrived (a steel-coil mill production line). `alt` describes only what is in
    frame — it does not claim the plant, workers, or material belong to the
    client. The earlier fabricated-placard/QR file was rejected and archived.
*/
export const homeAssets = {
  supplier: {
    id: "home-supplier",
    src: "/images/editorial/source-material-yard.webp",
    alt: "Overhead crane lifting a steel coil in a metal processing mill, with rows of coiled metal.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 48 },
    available: true,
  },
  buyer: {
    id: "home-buyer",
    src: "/images/destination/manufacturing-line.webp",
    alt: "Workers in a metal processing mill inspecting rows of coiled metal on a production line.",
    usage: "illustrative",
    license: UNVERIFIED_LICENSE,
    focalPoint: { x: 50, y: 50 },
    available: true,
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
