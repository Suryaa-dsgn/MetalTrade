/*
  Image asset record (Design System §10.5). Until a cleared file exists in
  `/public/images`, `available` is false and the layout renders a neutral
  `AssetPlaceholder` that names the required `src`. Externally sourced imagery
  must carry `credit` / `license` / `sourceUrl` before production use.

  `usage` records how the image may be presented until the client confirms
  otherwise (Phase 9): client-supplied stock-style imagery defaults to
  `illustrative` — it must not be read as depicting the client's real operation,
  material, or a verified fact.
*/
export type ImageUsage =
  | "illustrative"
  | "material-reference"
  | "client-owned-operation"

export type ImageAsset = {
  id: string
  src: string
  alt: string
  caption?: string
  credit?: string
  license?: string
  sourceUrl?: string
  usage?: ImageUsage
  focalPoint?: { x: number; y: number }
  available: boolean
}

/*
  Recorded on every client-supplied image whose provenance and production usage
  rights are not yet confirmed. Deliberately neutral — it does not assert how the
  image was produced, only that clearance is outstanding.
*/
export const UNVERIFIED_LICENSE =
  "Unverified: client to confirm provenance and production usage rights"
