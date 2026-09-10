# Retained image originals — NOT for production

This folder holds the raw client-supplied image files from the Phase 9 asset
pass. It exists purely as a reference archive.

- **Not publicly served.** Next.js only serves `/public`; nothing here is
  reachable at a URL.
- **Not committed.** The source files (`*.png/*.jpg`) are git-ignored (see the
  repo `.gitignore`); only this README is tracked. The client holds the masters.
- Production uses the optimised WebP derivatives in `public/images/**` instead.

## Provenance / licensing

All files are client-supplied and currently **UNVERIFIED** — provenance and
production usage rights are not yet confirmed. Do not treat any of them as
depicting the client's real operation, material, grade, or a verified fact.

## Wired into the site (converted to WebP, `usage: illustrative`)

| Original | Derivative | Notes |
|---|---|---|
| `metals/Copper.png` | `public/images/metals/copper-specimen.webp` | Raw specimen; alt describes appearance only |
| `metals/Aluminum.png` | `public/images/metals/aluminium-specimen.webp` | Raw specimen |
| `metals/Nickel.png` | `public/images/metals/nickel-specimen.webp` | Raw specimen |
| `metals/zinc.png` | `public/images/metals/zinc-specimen.webp` | Raw specimen (neutral studio background) |
| `metals/Gold.png` | `public/images/metals/gold-specimen.webp` | Raw specimen |
| `editorial/logistics-port-containers.png` | `public/images/editorial/logistics-port-containers.webp` | Generic container port; passed the baked-in-text audit |

## EXCLUDED from production (audit failures — kept here for reference only)

| Original | Reason excluded |
|---|---|
| `destination/manufacturing-line.png` | Fabricated spec placard baked into the image (Grade A356 / Purity ≥ 99.7% / Weight 1000 kg / Batch AI-2407-18), a "Traceable Supply" QR code, and slogan walls — reads as invented certification/traceability. Also a port scene, not a manufacturing line. |
| `metals/Lithium.png` | Lavender/purple crystal — violates the no-purple visual guardrail. |
| `editorial/source-material-yard.png` | Smokestack refinery emitting plumes — off-message for a responsible-sourcing narrative; also not a "material yard". |

Their site slots keep the neutral `AssetPlaceholder`.
**TODO(client):** supply cleared, on-message replacements for the three excluded
slots (buyer / supplier / lithium) and confirm rights for the wired images.
