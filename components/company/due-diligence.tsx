import { dueDiligence, dueDiligenceLimitation } from "@/data/config/company"

/*
  Due diligence — counterparty / ownership / sanctions-export / document review,
  as compact policy rows (distinct treatment). Each row carries its own "may
  include / where relevant" qualifier; the limitation note states scope, not a
  certification (Blueprint §8, amendment 2/3).
*/
export function DueDiligence() {
  return (
    <div>
      <dl className="overflow-hidden rounded-lg border border-border">
        {dueDiligence.map((row, i) => (
          <div
            key={row.term}
            className={`grid gap-1 bg-surface px-5 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6 ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <dt className="text-body font-medium text-foreground">{row.term}</dt>
            <dd className="text-body-s text-muted-foreground">{row.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-[80ch] text-body-s text-muted-foreground">
        {dueDiligenceLimitation}
      </p>
    </div>
  )
}
