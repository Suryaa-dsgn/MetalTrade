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
| `editorial/source-material-yard.jpg` | `public/images/editorial/source-material-yard.webp` | Phase 9A.2 replacement — metal-mill interior (crane lifting a steel coil, rows of coils). Passed the audit; only a generic "AVISO" safety sign, no fabricated specs. Feeds supplier proposition + company hero. |
| `metals/Lithium.png` (silver replacement) | `public/images/metals/lithium-specimen.webp` | Phase 9A.2 replacement — silver-grey metallic specimen on a light background. No purple. Wired to the lithium card. |
| `destination/manufacturing-line.jpg` | `public/images/destination/manufacturing-line.webp` | Phase 9A.2 replacement — steel-coil mill with workers on a production line. Passed the audit (no fabricated specs/QR/branding). Wired to the buyer proposition. |
| `editorial/ship-container-ship-source.jpg` | `public/images/editorial/logistics-container-ship.webp` | Aerial container ship at sea. Passed the audit (no fabricated text/QR/branding, no purple). **Low-res source (525×300)** — used only as a darkened, right-weighted atmospheric layer behind the final enquiry CTA (`CtaBand`), decorative (`alt=""`). |

## EXCLUDED from production (audit failures — kept here for reference only)

| Original | Reason excluded |
|---|---|
| `destination/manufacturing-line.png` | Fabricated spec placard baked into the image (Grade A356 / Purity ≥ 99.7% / Weight 1000 kg / Batch AI-2407-18), a "Traceable Supply" QR code, and slogan walls — reads as invented certification/traceability. **Superseded in Phase 9A.2 by the accepted `manufacturing-line.jpg` above.** |
| `metals/Lithium-v1-purple-REJECTED.png` | Lavender/purple crystal — violates the no-purple visual guardrail. **Superseded in Phase 9A.2 by the accepted silver `Lithium.png` above.** |
| `editorial/source-material-yard.png` (original Phase 9 file) | Smokestack refinery emitting plumes — off-message for responsible sourcing; not a "material yard". Superseded in Phase 9A.2 by the accepted `source-material-yard.jpg` above. |

Every editorial/metal image slot is now wired; no `AssetPlaceholder` remains in
production.
**TODO(client):** confirm provenance and production usage rights for all wired
images (currently recorded as UNVERIFIED).
