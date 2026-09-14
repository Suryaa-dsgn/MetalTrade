import Link from "next/link"

import { Container } from "@/components/layout/container"
import { Logo } from "@/components/brand/logo"
import { BodyS, Label } from "@/components/ui/typography"
import { footerGroups, legalLinks } from "@/data/config/navigation"
import { siteConfig } from "@/data/config/site"

/*
  Global footer (Blueprint §6.1). Quiet muted surface. Contact channels and any
  social links are explicit TODO placeholders — never invented. The market
  disclaimer text is the short form of the Blueprint §6.3 required disclaimer.
*/
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            {/* Client-confirmed positioning (Phase 9B). */}
            <BodyS className="mt-3 max-w-[36ch] text-muted-foreground">
              {siteConfig.positioning}
            </BodyS>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <Label>{group.title}</Label>
              <ul className="mt-4 flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-sm text-body-s text-foreground/80 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <Label>Contact</Label>
            {/* TODO(client): monitored phone/email not yet supplied. */}
            <BodyS className="mt-4 text-muted-foreground">
              Monitored contact details to be confirmed.
            </BodyS>
          </div>
        </div>

        <BodyS className="mt-12 max-w-[80ch] text-muted-foreground">
          Market values shown across this site are informational benchmarks and
          may be delayed. They are not an offer, quote, investment
          recommendation, or guaranteed transaction price.
        </BodyS>

        <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <BodyS className="text-muted-foreground">
            © {year} {siteConfig.legalName}.
          </BodyS>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-sm text-body-s text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
