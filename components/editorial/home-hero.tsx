import Link from "next/link"

import { Container } from "@/components/layout/container"
import { AssetPlaceholder } from "@/components/editorial/asset-placeholder"
import { buttonVariants } from "@/components/ui/button"
import { Display, Label, Lead } from "@/components/ui/typography"
import { homeAssets } from "@/lib/assets/home"

/*
  Home hero (Design System §9.1, Blueprint §6.1). Answers what/who/next in order.
  Headline is the Blueprint §1 working positioning (client validation pending).
  Two intent CTAs route suppliers and buyers; both visible without scrolling.
*/
export function HomeHero() {
  return (
    <section className="border-b border-border bg-background">
      <Container className="grid items-center gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <Label>Physical metals · global trade</Label>
          <Display className="mt-4">
            Connecting global metal supply with qualified demand.
          </Display>
          <Lead className="mt-5">
            From verified source to qualified buyer — with market context,
            material evidence, and controlled logistics at every stage.
          </Lead>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/enquire/supply"
              className={buttonVariants({ size: "lg" })}
            >
              I have metal to sell
            </Link>
            <Link
              href="/enquire/buying-requirement"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              I want to source metal
            </Link>
          </div>
        </div>
        <AssetPlaceholder
          asset={homeAssets.hero}
          className="aspect-[4/3] lg:aspect-[5/4]"
        />
      </Container>
    </section>
  )
}
