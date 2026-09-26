import type { Field } from './types'
export const textField = (
  key: string,
  label: string,
  hint?: string,
): Field => ({ key, label, hint })
export const area = (
  key: string,
  label: string,
  hint?: string,
  initial?: string,
): Field => ({ key, label, kind: 'area', hint, initial })
export const numeric = (
  key: string,
  label: string,
  initial = '',
  min = 0,
  max = 1000000,
): Field => ({ key, label, kind: 'number', initial, min, max })
export const dateField = (key: string, label: string): Field => ({
  key,
  label,
  kind: 'date',
})
export const select = (
  key: string,
  label: string,
  options: string[],
  initial?: string,
): Field => ({ key, label, kind: 'select', options, initial })
export const requireText = (value: string | undefined, label: string) => {
  if (!value?.trim())
    throw new Error(`Add ${label.toLowerCase()} to build your summary.`)
  return value.trim()
}
export const finite = (
  value: string | undefined,
  label: string,
  min = 0,
  max = 1000000,
) => {
  const n = Number(value)
  if (!value?.trim() || !Number.isFinite(n) || n < min || n > max)
    throw new Error(`${label} must be between ${min} and ${max}.`)
  return n
}
export const noteLines = (values: Record<string, string>, fields: Field[]) =>
  fields
    .filter((f) => values[f.key]?.trim())
    .map((f) => `${f.label}: ${values[f.key].trim()}`)
