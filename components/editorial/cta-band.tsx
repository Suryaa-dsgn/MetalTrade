import Link from "next/link"
import Image from "next/image"

import { Container } from "@/components/layout/container"
import { buttonVariants } from "@/components/ui/button"
import { H2, Lead } from "@/components/ui/typography"

/*
  Final enquiry CTA (Blueprint §6.1). A mineral editorial chapter with a
  right-weighted, atmospheric logistics image integrated into the dark base — not
  a plain full-opacity banner. Readability is protected by keeping content in a
  left zone over a strong left→right dark gradient; the image is darkened
  (reduced brightness) rather than blurred, and fades into the base on its left
  edge. Content and CTA structure are unchanged.

  The image is decorative (the copy carries the meaning), so it is `alt=""` /
  aria-hidden. Provenance is unverified (see design/asset-originals).
*/
export function CtaBand() {
  return (
    <section className="relative isolate overflow-hidden bg-mineral text-mineral-foreground">
      {/* Right-weighted image zone — narrower on desktop so content stays clear */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[72%] lg:w-[60%]">
        <Image
          src="/images/editorial/logistics-container-ship.webp"
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 1024px) 60vw, (min-width: 640px) 72vw, 100vw"
          className="object-cover object-center brightness-[0.55] saturate-[0.85]"
        />
        {/* Fade the image's left edge into the mineral base (seam blend). */}
        <div className="absolute inset-0 bg-gradient-to-r from-mineral via-mineral/30 to-transparent" />
      </div>

      {/* Overall readability scrim: opaque left (content zone) → clear right on
          larger screens; stays darker on the right at mobile where content stacks. */}
      <div className="absolute inset-0 bg-gradient-to-r from-mineral via-mineral/85 to-mineral/55 md:via-mineral/80 md:to-transparent" />

      <Container className="relative z-10 py-20 md:py-24">
        <div className="max-w-[46ch]">
          <H2 className="text-mineral-foreground">
            Tell us what you have — or what you need.
          </H2>
          <Lead className="mt-4 text-mineral-foreground/80">
            Share a supply position or a buying requirement and a member of the
            trade desk will review it and respond.
          </Lead>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/enquire/supply" className={buttonVariants({ size: "lg" })}>
            I have metal to sell
          </Link>
          <Link
            href="/enquire/buying-requirement"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            I want to source metal
          </Link>
        </div>
      </Container>
    </section>
  )
}
