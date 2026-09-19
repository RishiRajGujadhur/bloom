import { useState } from 'react'
import type { JournalEntry } from './types'
import { completedDaybook } from '../../analytics/activity'

export const DAYBOOK_STORAGE_KEY = 'mindfulness-dashboard-daybook-v1'
function load() {
  try {
    const entries: unknown = JSON.parse(
      localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]',
    )
    if (
      !Array.isArray(entries) ||
      !entries.every(
        (entry) =>
          entry &&
          typeof entry.id === 'string' &&
          typeof entry.modeId === 'string' &&
          entry.content &&
          typeof entry.content === 'object' &&
          Number.isFinite(Date.parse(entry.updatedAt)) &&
          (entry.activity === undefined ||
            (Array.isArray(entry.activity) &&
              entry.activity.every(
                (item: { day?: unknown; at?: unknown } | null) =>
                  item &&
                  typeof item.day === 'string' &&
                  typeof item.at === 'number',
              ))),
      )
    )
      throw new Error('Invalid journal')
    return { entries: entries as JournalEntry[], error: '' }
  } catch {
    return {
      entries: [] as JournalEntry[],
      error:
        'Your saved Daybook could not be read. It has not been overwritten.',
    }
  }
}

/** Owned by the app shell so hiding a feature does not lose its history. */
export function useJournalEntries() {
  const [initial] = useState(load)
  const [entries, setEntries] = useState(initial.entries)
  const [error, setError] = useState(initial.error)
  const save = (next: JournalEntry): boolean => {
    if (initial.error) return false
    const completed = completedDaybook(
      next,
      entries.find((entry) => entry.id === next.id),
    )
    const updated = [
      completed,
      ...entries.filter((entry) => entry.id !== next.id),
    ]
    try {
      // The page and activity history commit together. Failed storage earns no streak.
      localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify(updated))
      setEntries(updated)
      setError('')
      return true
    } catch {
      setError(
        'Your page could not be saved. Free some browser storage and try Complete journal again.',
      )
      return false
    }
  }
  return { entries, save, error }
}
