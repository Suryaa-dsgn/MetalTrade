import type { ComponentProps, ElementType, ReactNode } from "react"

import { cn } from "@/lib/utils"

/*
  Container — centered content rail (Design System §6.1).
  Max width 1440px; responsive gutters 20 / 40 / 64 (mobile / tablet / desktop).
  `width="reading"` narrows to ~720px for editorial reading measure.
*/
type ContainerProps<T extends ElementType> = {
  as?: T
  width?: "default" | "reading"
  className?: string
  children?: ReactNode
} & Omit<ComponentProps<T>, "as" | "width" | "className" | "children">

export function Container<T extends ElementType = "div">({
  as,
  width = "default",
  className,
  ...props
}: ContainerProps<T>) {
  const Comp = (as ?? "div") as ElementType
  return (
    <Comp
      className={cn(
        "mx-auto w-full px-5 md:px-10 lg:px-16",
        width === "reading"
          ? "max-w-[var(--container-reading)]"
          : "max-w-[var(--container-max)]",
        className
      )}
      {...props}
    />
  )
}
