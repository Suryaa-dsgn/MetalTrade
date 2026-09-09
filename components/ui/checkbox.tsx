import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/*
  Styled native checkbox (native control per amendment 8; registers cleanly with
  RHF). `accent-color` brands it as Industrial Cobalt while keeping native
  keyboard + a11y behaviour.
*/
export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "mt-0.5 size-4 shrink-0 rounded-sm border-input accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  )
})
