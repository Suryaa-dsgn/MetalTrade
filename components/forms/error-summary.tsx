"use client"

import type { FieldErrors } from "react-hook-form"

/*
  Top-of-form error summary (Blueprint §7). On an invalid submit the form focuses
  this by its id (role="alert", tabIndex -1); each link focuses its associated
  field (amendment 9). `order` keeps the list in visual field order.
*/
export const ENQUIRY_ERROR_SUMMARY_ID = "enquiry-error-summary"

export function ErrorSummary({
  errors,
  order,
}: {
  errors: FieldErrors
  order: string[]
}) {
  const items = order
    .filter((name) => errors[name])
    .map((name) => ({
      name,
      message: String(
        (errors[name] as { message?: string })?.message ?? "This field is invalid"
      ),
    }))

  if (items.length === 0) return null

  return (
    <div
      id={ENQUIRY_ERROR_SUMMARY_ID}
      role="alert"
      tabIndex={-1}
      className="rounded-md border border-destructive bg-negative-soft p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <p className="text-body-s font-semibold text-negative">
        Please fix {items.length} {items.length === 1 ? "issue" : "issues"} before
        submitting
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            <a
              href={`#${item.name}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(item.name)
                el?.focus()
                el?.scrollIntoView({ block: "center", behavior: "smooth" })
              }}
              className="text-body-s text-negative underline underline-offset-2 hover:no-underline"
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Focus the error summary once it has rendered. Retries via setTimeout (rather
 *  than rAF, which pauses on hidden tabs) because React may not have committed
 *  the summary the instant the submit resolves. */
export function focusErrorSummary() {
  let attempts = 0
  const tryFocus = () => {
    const el = document.getElementById(ENQUIRY_ERROR_SUMMARY_ID)
    if (el) {
      el.focus()
      return
    }
    if (attempts++ < 10) setTimeout(tryFocus, 30)
  }
  tryFocus()
}
