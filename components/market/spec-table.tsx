import { cn } from "@/lib/utils"
import type { SpecField } from "@/lib/market/types"

/*
  Specification fields (Blueprint §6.3). Values are "Confirmed per enquiry"
  placeholders — no invented grades/purity/Incoterms (amendment 4).
*/
export function SpecTable({ fields }: { fields: SpecField[] }) {
  return (
    <dl className="overflow-hidden rounded-lg border border-border">
      {fields.map((field, i) => (
        <div
          key={field.label}
          className={cn(
            "grid grid-cols-[9rem_1fr] gap-4 bg-surface px-4 py-3 sm:grid-cols-[14rem_1fr]",
            i > 0 && "border-t border-border"
          )}
        >
          <dt className="text-body-s font-medium text-muted-foreground">
            {field.label}
          </dt>
          <dd className="text-body-s text-foreground">
            {field.value ?? "—"}
            {field.note ? (
              <span className="mt-0.5 block text-label uppercase tracking-label text-muted-foreground">
                {field.note}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
