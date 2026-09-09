import Link from "next/link"

import { metalCategories, metalCategoriesNote } from "@/data/config/company"
import { MetalIcon } from "@/components/ui/domain-icon"
import { ArrowRightIcon } from "@/components/ui/icon"

/*
  Market categories (amendment 5) — a link list to the markets, not a claim that
  every category is actively traded. Rows (not cards) for visual variety.
*/
export function MetalCategories() {
  return (
    <div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {metalCategories.map((category) => (
          <li key={category.name}>
            <Link
              href={category.href}
              className="flex items-center justify-between gap-4 bg-surface px-5 py-4 transition-colors hover:bg-surface-muted"
            >
              <div className="flex items-center gap-3">
                <MetalIcon className="size-5 shrink-0 text-muted-foreground" />
                <div>
                  <span className="text-body font-medium text-foreground">
                    {category.name}
                  </span>
                  <span className="block text-body-s text-muted-foreground">
                    {category.metals}
                  </span>
                </div>
              </div>
              <ArrowRightIcon className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-[80ch] text-body-s text-muted-foreground">
        {metalCategoriesNote}
      </p>
    </div>
  )
}
