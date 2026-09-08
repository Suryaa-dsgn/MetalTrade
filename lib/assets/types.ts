/*
  Image asset record (Design System §10.5). Until a licensed file exists in
  `/public/images`, `available` is false and the layout renders a neutral
  `AssetPlaceholder` that names the required `src`. Externally sourced imagery
  must carry `credit` / `license` / `sourceUrl` before production use.
*/
export type ImageAsset = {
  id: string
  src: string
  alt: string
  caption?: string
  credit?: string
  license?: string
  sourceUrl?: string
  focalPoint?: { x: number; y: number }
  available: boolean
}
