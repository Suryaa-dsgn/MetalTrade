import Link from "next/link"

import { Container } from "@/components/layout/container"
import { buttonVariants } from "@/components/ui/button"
import { H2, Lead } from "@/components/ui/typography"

/*
  Final enquiry CTA (Blueprint §6.1). A single mineral editorial chapter — a
  deliberate dark band, not a separate theme. Routes both audiences.
*/
export function CtaBand() {
  return (
    <section className="bg-mineral text-mineral-foreground">
      <Container className="py-20 md:py-24">
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
