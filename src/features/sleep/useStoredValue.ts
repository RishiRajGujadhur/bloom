import { useEffect, useState } from 'react'

/** A single JSON value persisted to localStorage (falls back to `initial`). */
export function useStoredValue<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...initial, ...(JSON.parse(raw) as Partial<T>) } : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* Preference still applies for this visit. */
    }
  }, [key, value])
  return [value, setValue] as const
}
