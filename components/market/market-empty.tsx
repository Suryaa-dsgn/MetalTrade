import { Body, H4 } from "@/components/ui/typography"

/*
  Empty state (Design System §14.3): calm, specific, states the selection.
*/
export function MarketEmpty({
  query,
  category,
}: {
  query?: string
  category?: string
}) {
  const parts: string[] = []
  if (query) parts.push(`“${query}”`)
  if (category && category !== "all") parts.push(category)
  const selection = parts.length ? ` for ${parts.join(" in ")}` : ""

  return (
    <div
      role="status"
      className="rounded-lg border border-dashed border-border-strong bg-surface-subtle px-6 py-12 text-center"
    >
      <H4 as="p">No metals match this selection</H4>
      <Body className="mx-auto mt-2 text-muted-foreground">
        No market rows were found{selection}. Try a different search term or clear
        the category filter.
      </Body>
    </div>
  )
}
