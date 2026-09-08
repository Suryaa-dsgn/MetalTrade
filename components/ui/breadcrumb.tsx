import { Fragment } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { ChevronRight } from "@/components/ui/icon"

/*
  Breadcrumb primitive (Design System §8.3). Orientation, not a second nav.
  Used per-page on deep pages (metal detail, logistics, resources) — not mounted
  globally. Separators are aria-hidden; the last crumb is the current page.
*/
export type Crumb = { label: string; href?: string }

export function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[]
  className?: string
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-body-s text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={`${item.href ?? item.label}-${index}`}>
              <li className="inline-flex items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="rounded-sm transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(isLast && "font-medium text-foreground")}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast ? (
                <li
                  aria-hidden="true"
                  className="inline-flex items-center text-muted-foreground/70"
                >
                  <ChevronRight className="size-4" />
                </li>
              ) : null}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
