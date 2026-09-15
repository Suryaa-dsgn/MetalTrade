import { CheckIconGlyph } from "@/components/ui/icon"
import { H3 } from "@/components/ui/typography"

/*
  Contact success state (Contact redesign, Phase 1). Client-facing copy with no
  invented SLA. A small development-only note (hidden in production) keeps us honest
  that live lead delivery is not connected yet — the backend is a later phase.
*/
export function ContactSuccess() {
  const isDev = process.env.NODE_ENV !== "production"

  return (
    <div className="rounded-lg border border-border bg-surface p-6" role="status">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-positive-soft text-positive">
          <CheckIconGlyph className="size-5" />
        </span>
        <H3 as="p">Thank you. Your enquiry has been received.</H3>
      </div>

      <p className="mt-4 text-body text-muted-foreground">
        Our team will review the information and contact you using the details
        provided.
      </p>

      {isDev ? (
        <p className="mt-4 text-body-s text-muted-foreground">
          Development build: live lead delivery is not connected yet.
        </p>
      ) : null}
    </div>
  )
}
