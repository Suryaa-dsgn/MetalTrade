import type { ComponentProps, ComponentType, SVGProps } from "react"

import { cn } from "@/lib/utils"

/*
  Chrome icon barrel — Heroicons ONLY (navigation, search, close, chevrons,
  arrows, form affordances, table sort, price-direction indicators).

  Tier rule (CLAUDE.md): outline 24 = default, mini 20 (solid) = controls,
  micro 16 (solid) = inline. One weight per tier — never mix outline and solid
  in the same control group.

  Application components MUST import chrome icons from here, never from
  `@heroicons/react/*` directly, so a library swap stays a one-file change.
  If Heroicons lacks a needed UI glyph, fall back to a Phosphor `regular` icon
  for that single control and leave a comment noting it.
*/

// 24 / outline — default chrome tier
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon as ArrowRightOutline,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline"

// 20 / solid — mini, for controls
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ArrowUpIcon as ArrowUpMini,
  ArrowDownIcon as ArrowDownMini,
  PlusIcon,
  MinusIcon,
  CheckIcon,
} from "@heroicons/react/20/solid"

// 16 / solid — micro, inline (e.g. price-direction indicators)
import {
  ArrowUpIcon as ArrowUpMicro,
  ArrowDownIcon as ArrowDownMicro,
  MinusIcon as MinusMicro,
} from "@heroicons/react/16/solid"

export type IconProps = SVGProps<SVGSVGElement> & { title?: string }

type HeroIcon = ComponentType<ComponentProps<"svg"> & { title?: string }>

/** Wrap a Heroicon at a fixed tier size; decorative by default. */
function chromeIcon(Base: HeroIcon, sizeClass: string) {
  function Icon({ className, ...props }: IconProps) {
    return (
      <Base aria-hidden="true" className={cn(sizeClass, className)} {...props} />
    )
  }
  Icon.displayName = `Chrome(${(Base as { displayName?: string }).displayName ?? "Icon"})`
  return Icon
}

// --- Navigation / chrome (24 outline, size-6) ---
export const MenuIcon = chromeIcon(Bars3Icon, "size-6")
export const CloseIcon = chromeIcon(XMarkIcon, "size-6")
export const ExternalLinkIcon = chromeIcon(ArrowUpRightIcon, "size-5")
export const ArrowRightIcon = chromeIcon(ArrowRightOutline, "size-5")

// --- Controls (20 solid, size-5) ---
export const SearchIcon = chromeIcon(MagnifyingGlassIcon, "size-5")
export const ChevronDown = chromeIcon(ChevronDownIcon, "size-5")
export const ChevronUp = chromeIcon(ChevronUpIcon, "size-5")
export const ChevronLeft = chromeIcon(ChevronLeftIcon, "size-5")
export const ChevronRight = chromeIcon(ChevronRightIcon, "size-5")
export const SortIcon = chromeIcon(ChevronUpDownIcon, "size-5")
export const SortAscIcon = chromeIcon(ArrowUpMini, "size-5")
export const SortDescIcon = chromeIcon(ArrowDownMini, "size-5")
export const PlusControlIcon = chromeIcon(PlusIcon, "size-5")
export const MinusControlIcon = chromeIcon(MinusIcon, "size-5")
export const CheckIconGlyph = chromeIcon(CheckIcon, "size-5")

// --- Inline price-direction indicators (16 solid, size-4) ---
// Always paired with text/label — never colour alone (Design System §18).
export const TrendUpIcon = chromeIcon(ArrowUpMicro, "size-4")
export const TrendDownIcon = chromeIcon(ArrowDownMicro, "size-4")
export const TrendFlatIcon = chromeIcon(MinusMicro, "size-4")
