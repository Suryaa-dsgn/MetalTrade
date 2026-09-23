"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

/*
  Terms "On this page" navigation. Minimal client boundary: only the nav tracks
  the current section (IntersectionObserver); the legal content stays a Server
  Component. Links are plain in-page anchors, so they work without JS, are
  keyboard-accessible, and smooth-scroll via CSS (`scroll-behavior: smooth` +
  each section's `scroll-mt`, which offsets the sticky header). Reduced motion is
  respected by the global rule in globals.css.

  Rendered twice for two presentations — a collapsible panel below `lg`, a sticky
  sidebar from `lg` — but only one is ever displayed (the other is `display:none`,
  so it is not in the accessibility tree and is not announced twice.)
*/

const sections: { n: number; title: string }[] = [
  { n: 1, title: "Definitions and Interpretation" },
  { n: 2, title: "Acceptance of Terms" },
  { n: 3, title: "Description of Services" },
  { n: 4, title: "User Accounts and Registration" },
  { n: 5, title: "User Responsibilities and Obligations" },
  { n: 6, title: "Service Availability and Limitations" },
  { n: 7, title: "Pricing and Payment Terms" },
  { n: 8, title: "Delivery Terms and Conditions" },
  { n: 9, title: "Liability and Risk Allocation" },
  { n: 10, title: "Intellectual Property Rights" },
  { n: 11, title: "Prohibited Uses" },
  { n: 12, title: "Marketplace and Matching Mechanics" },
  { n: 13, title: "Envoy Terms" },
  { n: 14, title: "Ratings, Reviews and Account Standing" },
  { n: 15, title: "Indemnification" },
  { n: 16, title: "App Store Compliance" },
  { n: 17, title: "Termination" },
  { n: 18, title: "Dispute Resolution and Governing Law" },
  { n: 19, title: "Force Majeure" },
  { n: 20, title: "Modifications to Terms" },
  { n: 21, title: "Contact Information" },
]

function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(`s${s.n}`))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // The topmost section currently in the active band wins.
        const first = els.find((el) => visible.has(el.id))
        if (first) setActive(first.id)
      },
      // Active band: below the sticky header, upper part of the viewport.
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return active
}

function LinkList({ active }: { active: string | null }) {
  return (
    <ol className="space-y-0.5">
      {sections.map((s) => {
        const id = `s${s.n}`
        const isActive = active === id
        return (
          <li key={s.n}>
            <a
              href={`#${id}`}
              aria-current={isActive ? "location" : undefined}
              // Close the mobile panel after choosing a section (no effect on the
              // always-open desktop sidebar). Native anchor still handles scroll.
              onClick={(e) =>
                e.currentTarget.closest("details")?.removeAttribute("open")
              }
              className={cn(
                "block rounded-sm border-l-2 py-1.5 pl-3 pr-2 text-body-s transition-colors",
                isActive
                  ? "border-primary bg-primary-soft/50 font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              {s.n}. {s.title}
            </a>
          </li>
        )
      })}
    </ol>
  )
}

export function TermsNav() {
  const active = useActiveSection()

  return (
    <>
      {/* Mobile / tablet: collapsible "On this page". */}
      <details className="rounded-md border border-border bg-surface-muted shadow-sm lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-label uppercase tracking-label text-muted-foreground [&::-webkit-details-marker]:hidden">
          On this page
        </summary>
        <nav
          aria-label="Terms sections"
          className="border-t border-border p-2"
        >
          <LinkList active={active} />
        </nav>
      </details>

      {/* Desktop: sticky sidebar that scrolls internally if the list is tall. */}
      <nav
        aria-label="Terms sections"
        className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto rounded-md border border-border bg-surface-muted p-3 shadow-sm lg:block"
      >
        <p className="px-3 pb-2 text-label uppercase tracking-label text-muted-foreground">
          On this page
        </p>
        <LinkList active={active} />
      </nav>
    </>
  )
}
