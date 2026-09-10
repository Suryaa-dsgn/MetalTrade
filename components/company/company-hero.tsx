import Link from "next/link"

import { Container } from "@/components/layout/container"
import { AssetImage } from "@/components/editorial/asset-image"
import { buttonVariants } from "@/components/ui/button"
import { Display, Label, Lead } from "@/components/ui/typography"
import { ArrowRightIcon } from "@/components/ui/icon"
import { homeAssets } from "@/lib/assets/home"

/*
  Company hero — evidence-led proposition (Design System §19). One restrained
  editorial image (an operations/source image, not corporate/handshake stock).
*/
export function CompanyHero() {
  return (
    <section className="border-b border-border bg-background">
      <Container className="grid items-center gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <Label>Company</Label>
          <Display className="mt-4">
            A physical metals intermediary between supply and demand
          </Display>
          <Lead className="mt-5">
            We connect verified metal supply with qualified demand —
            coordinating evaluation, documentation, verification, and delivery.
            The site does not execute trades; the trade desk manages each
            transaction.
          </Lead>
          <div className="mt-8">
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              Discuss a requirement
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
        <AssetImage
          asset={homeAssets.supplier}
          className="aspect-[4/3] lg:aspect-[5/4]"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </Container>
    </section>
  )
}
