import type { ComponentProps, ElementType } from "react"

import { cn } from "@/lib/utils"

/*
  Typography primitives — Design System §5.
  Headlines are tight (`tracking-tight`); body stays open and readable.
  Prices/metrics use `tabular-nums` (Geist Sans, NOT mono). Labels are the only
  uppercase style. Sizes come from the type-scale tokens in globals.css.
*/

type TextProps<T extends ElementType> = {
  as?: T
} & Omit<ComponentProps<T>, "as">

function make(
  defaultTag: ElementType,
  base: string,
  displayName: string
) {
  function Component<T extends ElementType = typeof defaultTag>({
    as,
    className,
    ...props
  }: TextProps<T>) {
    const Comp = (as ?? defaultTag) as ElementType
    return <Comp className={cn(base, className)} {...props} />
  }
  Component.displayName = displayName
  return Component
}

// Hero / display — large editorial only.
// Scales gradually (Design System §6.4): H1 on phones → Display L → Display XL,
// so an oversized headline never pushes the value proposition below the fold.
export const Display = make(
  "h1",
  "text-h1 tracking-tight text-balance sm:text-display-l lg:text-display-xl",
  "Display"
)

// Page + section headings.
export const H1 = make("h1", "text-h1 tracking-tight text-balance", "H1")
export const H2 = make("h2", "text-h2 tracking-tight text-balance", "H2")
export const H3 = make("h3", "text-h3 tracking-normal", "H3")
export const H4 = make("h4", "text-h4 tracking-normal", "H4")

// Body copy. Lead is intro/supporting copy; Body is default; BodyS is dense.
export const Lead = make(
  "p",
  "text-body-l text-muted-foreground max-w-[60ch]",
  "Lead"
)
export const Body = make("p", "text-body max-w-[70ch]", "Body")
export const BodyS = make("p", "text-body-s", "BodyS")

// Eyebrow / metadata label — the only uppercase style.
export const Label = make(
  "span",
  "text-label tracking-label uppercase text-muted-foreground",
  "Label"
)

// Market numerics — tabular figures, Geist Sans.
export const Price = make(
  "span",
  "text-price-l tabular-nums tracking-tight",
  "Price"
)
export const PriceXL = make(
  "span",
  "text-price-xl tabular-nums tracking-tight",
  "PriceXL"
)

// Inline numeric (table cells, metric values).
export const Numeric = make("span", "tabular-nums", "Numeric")
