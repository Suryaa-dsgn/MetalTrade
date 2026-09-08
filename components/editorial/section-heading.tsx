import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { H2, Label, Lead } from "@/components/ui/typography"

/*
  Reusable section heading: optional eyebrow (Label) + H2 + optional Lead.
  Keeps editorial sections consistent without turning each into a card.
*/
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  className,
  tone = "default",
}: {
  eyebrow?: ReactNode
  title: ReactNode
  lead?: ReactNode
  align?: "start" | "center"
  className?: string
  tone?: "default" | "onMineral"
}) {
  const centered = align === "center"
  return (
    <div className={cn(centered && "text-center", className)}>
      {eyebrow ? (
        <Label className={cn(tone === "onMineral" && "text-mineral-foreground/70")}>
          {eyebrow}
        </Label>
      ) : null}
      <H2
        className={cn(
          eyebrow && "mt-3",
          tone === "onMineral" && "text-mineral-foreground"
        )}
      >
        {title}
      </H2>
      {lead ? (
        <Lead
          className={cn(
            "mt-4",
            centered && "mx-auto",
            tone === "onMineral" && "text-mineral-foreground/80"
          )}
        >
          {lead}
        </Lead>
      ) : null}
    </div>
  )
}
