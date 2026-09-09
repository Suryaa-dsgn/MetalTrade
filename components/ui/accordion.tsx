"use client"

import type { ReactNode } from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { cn } from "@/lib/utils"
import { ChevronDown } from "@/components/ui/icon"

/*
  Accordion on the Base UI primitive. Keyboard-operable with visible focus; the
  chevron is decorative (aria-hidden via the icon barrel). Height transition
  respects prefers-reduced-motion via the global rule in globals.css.
*/
export type AccordionItemData = {
  id: string
  trigger: ReactNode
  content: ReactNode
}

export function Accordion({
  items,
  className,
}: {
  items: AccordionItemData[]
  className?: string
}) {
  return (
    <AccordionPrimitive.Root
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface",
        className
      )}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.id} value={item.id}>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-body font-medium text-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring/50">
              {item.trigger}
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-[expanded=true]:rotate-180" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-[var(--ease-standard)] data-[ending-style]:h-0 data-[starting-style]:h-0">
            <div className="px-5 pb-4 text-body-s text-muted-foreground">
              {item.content}
            </div>
          </AccordionPrimitive.Panel>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}
