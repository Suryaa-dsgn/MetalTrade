import { incotermNote, incoterms } from "@/data/config/logistics"

/*
  Incoterm explainer — GENERAL references only, not contractual advice
  (amendment 3). The educational note states obligations are agreed per trade.
*/
export function IncotermExplainer() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {incoterms.map((term) => (
          <div
            key={term.code}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-h4 font-semibold tracking-tight text-foreground">
                {term.code}
              </span>
              <span className="text-body-s text-muted-foreground">
                {term.name}
              </span>
            </div>
            <p className="mt-2 text-body-s text-muted-foreground">
              {term.definition}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-[80ch] text-body-s text-muted-foreground">
        {incotermNote}
      </p>
    </div>
  )
}
