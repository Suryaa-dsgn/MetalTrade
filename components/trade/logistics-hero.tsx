import Link from "next/link"

import { Container } from "@/components/layout/container"
import { AssetImage } from "@/components/editorial/asset-image"
import { buttonVariants } from "@/components/ui/button"
import { Display, Label, Lead } from "@/components/ui/typography"
import { ArrowRightIcon } from "@/components/ui/icon"
import { homeAssets } from "@/lib/assets/home"

/*
  Trade & Logistics editorial hero (Blueprint §6.4 / Design System §19). One
  strong logistics image for the page — no repeated freight imagery elsewhere.
*/
export function LogisticsHero() {
  return (
    <section className="border-b border-border bg-background">
      <Container className="grid items-center gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <Label>Trade &amp; logistics</Label>
          <Display className="mt-4">From source to destination</Display>
          <Lead className="mt-5">
            Coordination of inspection, documentation, freight, customs, and
            delivery — aligned to each transaction and the agreed Incoterm.
          </Lead>
          <div className="mt-8">
            <Link
              href="/enquire/logistics"
              className={buttonVariants({ size: "lg" })}
            >
              Discuss logistics
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
        <AssetImage
          asset={homeAssets.logistics}
          className="aspect-[4/3] lg:aspect-[5/4]"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
        />
      </Container>
    </section>
  )
}
