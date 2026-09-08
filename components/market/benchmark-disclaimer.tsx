import { cn } from "@/lib/utils"

/*
  Required market disclaimer (Blueprint §6.3). Reused on the metal detail page
  (Phase 5). Kept verbatim so legal wording is centralised.
*/
export function BenchmarkDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "max-w-[80ch] text-body-s text-muted-foreground",
        className
      )}
    >
      Displayed values are informational market benchmarks and may be delayed.
      They are not an offer, quote, investment recommendation, or guaranteed
      transaction price. Physical-metal pricing may vary by specification,
      quantity, origin, destination, logistics, inspection, and commercial
      terms.
    </p>
  )
}
