import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

/*
  Brand lockup — the single home for OEML's identity mark in the header and
  footer. Now backed by the real logo assets (horizontal full lockup, SVG):

    header (dark / hero overlay, tone="light") → white logo   (#F8F8F8)
    header (light / scrolled)                  → primary logo (#235CD7 cobalt)
    footer                                     → primary logo

  The two header variants are stacked in one fixed-height box and cross-faded by
  opacity, so switching white ↔ primary on scroll is smooth and causes ZERO
  layout shift (the in-flow primary image always sizes the box; the white image
  is an absolute overlay). Height is constrained and width is auto, so the logo
  never stretches, distorts, or changes the navbar height.

  SVGs are served with `unoptimized` (the Next image optimizer does not process
  SVG, and this keeps them crisp without any global next.config change). One
  image carries the alt text; its cross-fade twin is decorative (alt="",
  aria-hidden) so the link exposes the company name once.

  Assets: public/Logo/oeml-full-horizontal-{primary,white}.svg (clean copies of
  public/Logo/Full Logo_Horizontal/Full Logo_{Primary,White}.svg).
*/

type BrandWordmarkVariant = "header" | "footer"

const LOGO_PRIMARY = "/Logo/oeml-full-horizontal-primary.svg"
const LOGO_WHITE = "/Logo/oeml-full-horizontal-white.svg"
// Intrinsic aspect ratios (from each SVG's viewBox).
const PRIMARY_DIMS = { width: 1013, height: 244 }
const WHITE_DIMS = { width: 1012, height: 252 }
const ALT = "Oriental Energy and Minerals Ltd"

export function BrandWordmark({
  variant = "header",
  tone,
  className,
}: {
  variant?: BrandWordmarkVariant
  tone?: "light"
  className?: string
}) {
  const isLight = tone === "light"

  if (variant === "footer") {
    return (
      <Link
        href="/"
        className={cn(
          "inline-flex rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          className
        )}
      >
        <Image
          src={LOGO_PRIMARY}
          {...PRIMARY_DIMS}
          alt={ALT}
          unoptimized
          className="block h-10 w-auto sm:h-12"
        />
      </Link>
    )
  }

  // Header: fixed-height box holding both logo variants, cross-faded by state.
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className
      )}
    >
      {/* Logo box height ~60–70% of the 80px (h-20) navbar. The SVG carries
          ~18% internal vertical whitespace, so the visible mark sits
          comfortably inside this box without touching the navbar edges. */}
      <span className="relative block h-12 sm:h-14">
        {/* Primary (light nav) — in flow, so it sizes the box in both states. */}
        <Image
          src={LOGO_PRIMARY}
          {...PRIMARY_DIMS}
          alt={ALT}
          priority
          unoptimized
          className={cn(
            "block h-full w-auto transition-opacity duration-300",
            isLight ? "opacity-0" : "opacity-100"
          )}
        />
        {/* White (dark hero) — absolute overlay, decorative twin. */}
        <Image
          src={LOGO_WHITE}
          {...WHITE_DIMS}
          alt=""
          aria-hidden="true"
          priority
          unoptimized
          className={cn(
            "absolute inset-0 block h-full w-auto transition-opacity duration-300",
            isLight ? "opacity-100" : "opacity-0"
          )}
        />
      </span>
    </Link>
  )
}
