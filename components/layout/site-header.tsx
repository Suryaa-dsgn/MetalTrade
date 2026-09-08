import Link from "next/link"

import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"
import { Logo } from "@/components/brand/logo"
import { MainNav } from "@/components/layout/main-nav"
import { MobileNav } from "@/components/layout/mobile-nav"
import { buttonVariants } from "@/components/ui/button"
import { primaryCta } from "@/data/config/navigation"

/*
  Global site header — default sticky light chrome (Design System §8.1).
  Desktop nav + CTA appear from `lg` (1024px); the mobile Dialog nav covers
  phones and tablets, so a compressed row is never forced onto small screens.

  `variant` is an intentional extension point for a future Home-specific
  overlay/header variant. Only the default is implemented in this phase.
*/
type SiteHeaderProps = {
  variant?: "default"
  className?: string
}

export function SiteHeader({ variant = "default", className }: SiteHeaderProps) {
  return (
    <header
      data-variant={variant}
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background",
        className
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-2">
          <MainNav className="hidden lg:block" />
          <Link
            href={primaryCta.href}
            className={cn(buttonVariants(), "hidden lg:inline-flex")}
          >
            {primaryCta.label}
          </Link>
          <MobileNav className="lg:hidden" />
        </div>
      </Container>
    </header>
  )
}
