import Link from "next/link"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/data/config/site"

/*
  Brand wordmark. Text-only for now.
  TODO(brand): replace with a licensed logo/mark in `/public/logos` once
  provided, keeping this as the single swap point. `siteConfig.name` is a
  working title pending client approval.
*/
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — home`}
      className={cn(
        "inline-flex items-center rounded-sm text-h4 font-semibold tracking-tight text-foreground",
        className
      )}
    >
      {siteConfig.name}
    </Link>
  )
}
