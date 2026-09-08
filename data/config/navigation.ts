/*
  Navigation source of truth (Blueprint §5 IA, Design System §8).
  Primary nav: Markets · Trade & Logistics · Company · Contact + persistent CTA.
  Links point at canonical routes; the pages land in later phases.
*/

export type NavItem = { label: string; href: string }

export const primaryNav: NavItem[] = [
  { label: "Markets", href: "/markets" },
  { label: "Trade & Logistics", href: "/trade-logistics" },
  { label: "Company", href: "/company" },
  { label: "Contact", href: "/contact" },
]

// Persistent primary CTA (Design System §8.1 / §11.2). Sentence case per §5.3.
export const primaryCta: NavItem = {
  label: "Discuss a requirement",
  href: "/contact",
}

export const footerGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Explore",
    items: primaryNav,
  },
  {
    title: "Enquiries",
    items: [
      { label: "I have metal to sell", href: "/enquire/supply" },
      { label: "I want to source metal", href: "/enquire/buying-requirement" },
      { label: "Discuss logistics", href: "/enquire/logistics" },
    ],
  },
]

// Legal routes are built in Phase 11; links resolve then.
export const legalLinks: NavItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Accessibility", href: "/accessibility" },
]

/**
 * Route-boundary active match. Exact for the home route; otherwise the item is
 * active on its own path and any descendant (e.g. Markets stays active on
 * `/markets/copper`), but not on a sibling that merely shares a prefix.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
