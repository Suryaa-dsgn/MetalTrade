import Link from "next/link"

import { Container } from "@/components/layout/container"
import { buttonVariants } from "@/components/ui/button"
import { Display, Label, Lead } from "@/components/ui/typography"
import { HeroBackgroundRotator } from "@/components/editorial/hero-background-rotator"
import { heroSlides } from "@/data/config/hero-slides"

/*
  Homepage hero — full-bleed rotating industrial background with the navbar
  overlaid (the header renders in its overlay tone on `/`). Server-rendered:
  only the background rotator is a client component.

  Two controlled photographic scrim layers (not brand-gradient UI):
    A. a top mineral wash so the overlaid navbar stays legible over bright frames
    B. a left tonal scrim protecting the headline/copy/CTAs — the right stays
       open so the industrial subject remains visible.
  Content is bottom-anchored and top-padded to clear the fixed header at every
  width (no per-breakpoint magic numbers).
*/
export function HomeHero() {
  return (
    <section className="relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden bg-mineral text-mineral-foreground">
      <HeroBackgroundRotator slides={heroSlides} />

      {/* Scrim A — subtle top wash so the overlaid navbar stays legible */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-mineral/55 to-transparent"
      />
      {/* Scrim B — diagonal tonal scrim anchored bottom-left (protects the
          headline / copy / CTAs); it clears by ~70% toward the top-right so the
          industrial subject and sky stay visible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-tr from-mineral/85 via-mineral/20 via-[45%] to-transparent to-[70%]"
      />

      <Container className="relative z-10 pt-28 pb-16 md:pt-32 md:pb-20 lg:pb-24">
        <div className="max-w-2xl">
          <Label className="text-mineral-foreground/70">
            Minerals and commodities · international trade
          </Label>
          <Display className="mt-4 text-balance text-mineral-foreground">
            A licensed mineral aggregator connecting physical commodity supply
            with vetted demand.
          </Display>
          <Lead className="mt-5 max-w-[48ch] text-mineral-foreground/85">
            We aggregate physical commodities from reviewed suppliers and
            coordinate inspection, freight, and origin logistics through to
            vetted corporate and institutional buyers.
          </Lead>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/enquire/supply"
              className={buttonVariants({ size: "lg" })}
            >
              I have material to supply
            </Link>
            <Link
              href="/enquire/buying-requirement"
              className={buttonVariants({ variant: "outlineInverse", size: "lg" })}
            >
              I want to source material
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
