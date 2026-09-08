/*
  Deterministic mass-unit price conversion.

  Canonical table: grams per unit. Conversion is explicit source → target, so a
  Phase-10 provider quoting in t, kg, lb (or oz) needs no UI change. All units
  here are mass units, so every mock quote is inter-convertible.

  Price is per-unit, so converting a $/from price to $/to:
      priceTo = priceFrom × (gramsPerUnit[to] / gramsPerUnit[from])
  e.g. 8,420 $/t → $/kg = 8420 × (1000 / 1_000_000) = 8.42
*/
export const GRAMS_PER_UNIT = {
  t: 1_000_000, // metric tonne
  MT: 1_000_000, // alias used by fixtures
  kg: 1_000,
  lb: 453.59237, // international avoirdupois pound
  oz: 31.1034768, // troy ounce
  g: 1,
} as const

export type MassUnit = keyof typeof GRAMS_PER_UNIT

/** User-selectable display units for the overview (plus "native"). */
export const DISPLAY_UNITS = ["native", "t", "kg", "lb"] as const
export type DisplayUnit = (typeof DISPLAY_UNITS)[number]

export function isMassUnit(unit: string): unit is MassUnit {
  return unit in GRAMS_PER_UNIT
}

/** Convert a per-unit price from one mass unit to another. Returns null if
 *  either unit is not a known mass unit (never guesses). */
export function convertMassPrice(
  price: number | null,
  fromUnit: string,
  toUnit: string
): number | null {
  if (price === null || Number.isNaN(price)) return null
  if (!isMassUnit(fromUnit) || !isMassUnit(toUnit)) return null
  return price * (GRAMS_PER_UNIT[toUnit] / GRAMS_PER_UNIT[fromUnit])
}

/** Resolve the effective display value + unit label for a row given the
 *  selected display unit. "native" keeps the quote's own unit. */
export function resolveDisplayUnit(
  price: number | null,
  nativeUnit: string,
  selected: DisplayUnit
): { value: number | null; unitLabel: string; converted: boolean } {
  if (selected === "native" || selected === nativeUnit) {
    return { value: price, unitLabel: nativeUnit, converted: false }
  }
  const value = convertMassPrice(price, nativeUnit, selected)
  // If not convertible, fall back to native rather than showing a wrong number.
  if (value === null && price !== null) {
    return { value: price, unitLabel: nativeUnit, converted: false }
  }
  return { value, unitLabel: selected, converted: true }
}
