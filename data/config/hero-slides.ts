/*
  Homepage hero background slides. Order reflects the trade narrative
  Source → Processing → Material inventory → Logistics (there is no
  destination/buyer image yet, so this is NOT a complete source→buyer sequence).

  `alt` is descriptive metadata for asset management only. In the hero these
  images are DECORATIVE background (the headline carries the meaning), so they
  are rendered with alt="" and aria-hidden — automatic background changes are
  never announced to screen readers.

  `focalPosition` is a CSS object-position, tuned per image so the industrial
  subject is retained when the 16:9 photo is cropped to the hero at any width.
*/
export type HeroSlide = {
  id: string
  src: string
  alt: string
  focalPosition: string
}

export const heroSlides: HeroSlide[] = [
  {
    id: "source-mine",
    src: "/images/hero/01-source-mine.webp",
    alt: "A mine headframe and conveyor silhouetted at sunset.",
    focalPosition: "70% center",
  },
  {
    id: "processing-mill",
    src: "/images/hero/02-processing-mill.webp",
    alt: "A steel rolling mill processing a large metal coil.",
    focalPosition: "75% center",
  },
  {
    id: "material-coils",
    src: "/images/hero/03-material-coils.webp",
    alt: "Rolled steel coils stored in a warehouse at dusk.",
    focalPosition: "70% center",
  },
  {
    id: "logistics-port",
    src: "/images/hero/04-logistics-port.webp",
    alt: "A port with a container ship, gantry cranes, and metal coils at sunset.",
    focalPosition: "65% center",
  },
]
