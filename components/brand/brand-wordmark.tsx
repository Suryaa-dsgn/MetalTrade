import Link from "next/link"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/data/config/site"

/*
  Brand wordmark — the single home for OEML's identity mark in the header and
  footer. Text-only for now. Three presentations from one component:

    header (light nav / scrolled) → a single line inside a subtle light frame:
        Oriental Energy and Minerals LTD.   (brand blue → darker-blue text)
    header (dark nav / hero overlay, tone="light") → the same line inside a
        subtle translucent-dark frame with warm-white text.
    footer → a tight two-line branding anchor:
        Oriental Energy
        and Minerals Ltd

  Navbar framing note: the two header states use a restrained "framed wordmark"
  container (translucent surface, hairline border, soft shadow, light backdrop
  blur, rounded-md). The light-state text uses a soft primary → primary-hover
  gradient. Both the frame and the gradient text are deliberate, client-approved
  refinements to the navbar mark and are the intentional exception to the
  Design System §21 "no glassmorphism / no gradient text" guardrail — kept
  subtle and scoped to the navbar wordmark only. The footer keeps solid tokens.

  The visible text is aria-hidden and the link carries a single accessible label,
  so screen readers hear the destination once. The navbar mark drops the "LTD."
  suffix from the label so it reads naturally; the footer keeps the full legal
  name in its own label.

  TODO(brand): when the licensed logo/mark arrives, swap the inner markup here
  for the SVG. SiteHeader / SiteFooter consume `variant` + `tone` only and do
  not need to change. `siteConfig.name` remains the working title.
*/

type BrandWordmarkVariant = "header" | "footer"

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
        aria-label={`${siteConfig.legalName} — Home`}
        className={cn(
          "inline-flex flex-col justify-center rounded-sm font-semibold tracking-tight leading-[1.0]",
          "text-[clamp(1.375rem,1.05rem+1.1vw,1.75rem)]",
          "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          className
        )}
      >
        <span aria-hidden="true">
          <span
            className={cn(
              "block font-bold",
              isLight ? "text-mineral-foreground" : "text-primary"
            )}
          >
            Oriental Energy
          </span>
          <span
            className={cn(
              "block font-bold",
              isLight ? "text-mineral-foreground" : "text-primary-hover"
            )}
          >
            and Minerals{" "}
            <span
              className={cn(
                "text-[0.78em] font-medium tracking-normal",
                isLight ? "text-mineral-foreground/85" : "text-primary/90"
              )}
            >
              Ltd
            </span>
          </span>
        </span>
      </Link>
    )
  }

  // Header: single-line framed wordmark.
  return (
    <Link
      href="/"
      aria-label="Oriental Energy and Minerals — Home"
      className={cn(
        // Subtle premium frame — restrained, not a chip or button.
        "inline-flex items-center rounded-md border px-2.5 py-1.5 backdrop-blur-sm sm:px-3.5 sm:py-2",
        "transition-colors duration-300",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        isLight
          ? // Dark / hero overlay: translucent-dark glass frame, warm-white text.
            "border-white/15 bg-mineral/25 shadow-[0_2px_10px_hsl(210_28%_10%/0.18)]"
          : // Light / scrolled: soft light frame.
            "border-border/70 bg-surface/70 shadow-sm",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "whitespace-nowrap font-semibold leading-none tracking-tight",
          "text-[clamp(0.75rem,0.55rem+0.9vw,1.25rem)]",
          isLight
            ? "text-mineral-foreground"
            : // Soft brand blue → darker-blue gradient (client-approved nav treatment).
              "bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent"
        )}
      >
        Oriental Energy and Minerals{" "}
        <span className="text-[0.82em]">LTD.</span>
      </span>
    </Link>
  )
}
