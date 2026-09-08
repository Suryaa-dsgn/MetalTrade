import type { ComponentProps, ElementType, ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"

/*
  Section — vertical rhythm band (Design System §6.3).
  `surface` sets the band background:
    - default  : warm paper (page background)
    - muted    : quiet panel
    - subtle   : table/input fill tone
    - mineral  : dark editorial chapter (mineral bg, warm-white text)
  `spacing` controls vertical padding: market bands are calmer (compact),
  editorial chapters breathe more (loose). Set `container={false}` to manage
  the inner rail yourself (e.g. full-bleed imagery).
*/
type SectionProps<T extends ElementType> = {
  as?: T
  surface?: "default" | "muted" | "subtle" | "mineral"
  spacing?: "compact" | "default" | "loose"
  container?: boolean
  containerWidth?: "default" | "reading"
  className?: string
  children?: ReactNode
} & Omit<ComponentProps<T>, "as" | "className" | "children">

const surfaceStyles = {
  default: "bg-background text-foreground",
  muted: "bg-surface-muted text-foreground",
  subtle: "bg-surface-subtle text-foreground",
  mineral: "bg-mineral text-mineral-foreground",
} as const

const spacingStyles = {
  compact: "py-16 md:py-20",
  default: "py-20 md:py-24",
  loose: "py-24 md:py-32",
} as const

export function Section<T extends ElementType = "section">({
  as,
  surface = "default",
  spacing = "default",
  container = true,
  containerWidth = "default",
  className,
  children,
  ...props
}: SectionProps<T>) {
  const Comp = (as ?? "section") as ElementType
  return (
    <Comp
      className={cn(surfaceStyles[surface], spacingStyles[spacing], className)}
      {...props}
    >
      {container ? (
        <Container width={containerWidth}>{children}</Container>
      ) : (
        children
      )}
    </Comp>
  )
}
