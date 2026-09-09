import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/*
  Token-styled native text input (native control per amendment 8). forwardRef so
  React Hook Form's `register` ref attaches. `aria-invalid` drives the error ring.
*/
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded-md border border-input bg-surface px-3 text-body-s text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-3 aria-[invalid=true]:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
})
