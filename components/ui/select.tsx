"use client"

import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { CheckIconGlyph, ChevronDown } from "@/components/ui/icon"

/*
  Thin Base UI Select wrapper with product tokens and a Heroicons chevron/check.
  Accessible listbox behavior comes from Base UI. Disabled options are truly
  unselectable; the reason for a disabled group is explained by the caller.
*/
export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export function Select({
  value,
  onValueChange,
  options,
  ariaLabel,
  id,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  ariaLabel: string
  id?: string
  className?: string
}) {
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]))

  return (
    <SelectPrimitive.Root
      items={items}
      value={value}
      onValueChange={(v) => onValueChange(String(v))}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-9 min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-body-s text-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <SelectPrimitive.Value className="truncate" />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={6} className="z-50">
          <SelectPrimitive.Popup className="max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-md outline-none">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="flex cursor-default items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-body-s text-foreground outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:text-muted-foreground/60 data-[highlighted]:bg-surface-muted"
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="text-primary">
                  <CheckIconGlyph className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
