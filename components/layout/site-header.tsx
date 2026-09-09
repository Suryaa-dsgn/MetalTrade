"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"
import { Logo } from "@/components/brand/logo"
import { MainNav } from "@/components/layout/main-nav"
import { MobileNav } from "@/components/layout/mobile-nav"
import { buttonVariants } from "@/components/ui/button"
import { primaryCta } from "@/data/config/navigation"

/*
  Global site header. Standard light chrome everywhere EXCEPT the homepage,
  where it overlays the hero:
    - `/` at the top → fixed, transparent, light (warm-white) chrome over the
      hero; the cobalt primary CTA stays usable. No backdrop blur.
    - `/` after a small scroll → transitions to the standard light header
      (bg-background, normal foreground, border-b).
    - Every other route → exactly the previous sticky light header (unchanged).
  One component, one markup tree — no duplication.
*/
export function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Off the homepage, `overlay` is already false, so no scroll tracking needed.
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    // Sync the initial position on the next frame (keeps setState out of the
    // effect body).
    const raf = requestAnimationFrame(onScroll)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
    }
  }, [isHome])

  const overlay = isHome && !scrolled
  const tone = overlay ? "light" : undefined

  return (
    <header
      data-overlay={overlay ? "true" : undefined}
      className={cn(
        "top-0 z-40 border-b transition-colors duration-300",
        isHome ? "fixed inset-x-0" : "sticky",
        // Same-colour alpha fade (bg-background/0 → bg-background) so the
        // transition never interpolates the `transparent` keyword.
        overlay
          ? "border-border/0 bg-background/0"
          : "border-border bg-background"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo tone={tone} />
        <div className="flex items-center gap-2">
          <MainNav tone={tone} className="hidden lg:block" />
          <Link
            href={primaryCta.href}
            className={cn(buttonVariants(), "hidden lg:inline-flex")}
          >
            {primaryCta.label}
          </Link>
          <MobileNav tone={tone} className="lg:hidden" />
        </div>
      </Container>
    </header>
  )
}
