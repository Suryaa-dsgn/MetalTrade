"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { isActivePath, primaryNav } from "@/data/config/navigation"

/*
  Desktop primary navigation. Active item = Industrial Cobalt text + a 2px
  cobalt underline (Design System §8.2) — never a purple or filled pill.
*/
export function MainNav({
  className,
  tone,
}: {
  className?: string
  tone?: "light"
}) {
  const pathname = usePathname()
  const light = tone === "light"

  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex items-center gap-1">
        {primaryNav.map((item) => {
          const active = isActivePath(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-9 items-center rounded-sm px-3 text-body-s font-medium transition-colors",
                  light
                    ? active
                      ? "text-mineral-foreground"
                      : "text-mineral-foreground/80 hover:text-mineral-foreground"
                    : active
                      ? "text-primary"
                      : "text-foreground/80 hover:text-primary"
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 -bottom-1 h-0.5 rounded-pill transition-opacity",
                    light ? "bg-mineral-foreground" : "bg-primary",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
