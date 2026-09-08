import { Button } from "@/components/ui/button"
import { Body, H4 } from "@/components/ui/typography"

/*
  Error state (Design System §17). Plain language, preserves the surrounding
  controls, offers retry. No raw API errors are ever exposed.
  In this phase `onRetry` honestly clears the dev forced-error state and returns
  to the normal mock data — it does not fake a provider refetch (amendment 5).
*/
export function MarketError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-border bg-surface px-6 py-12 text-center"
    >
      <H4 as="p">Market data could not be loaded</H4>
      <Body className="mx-auto mt-2 text-muted-foreground">
        The market data source did not respond. Your filters have been kept. You
        can try again.
      </Body>
      <div className="mt-6">
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  )
}
