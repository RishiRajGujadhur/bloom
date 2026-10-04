/** Numeric form fields retain the prior value while an input is empty/invalid. */
export function exactNumber(value: string, min: number, max: number, integer = false) {
  if (!value.trim()) return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) return null
  return integer ? Math.round(number) : number
}
