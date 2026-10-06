import type { NavKey } from './Sidebar'
import { pageDetails } from './FeatureGuide'
const RECENT_KEY = 'bloom-recent-pages'

export function readRecentPages(): NavKey[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.filter((key): key is NavKey => typeof key === 'string' && key in pageDetails)
      : []
  } catch {
    return []
  }
}

/** Remembers the last few destinations for the palette's "Recent" group. */
export function rememberPage(key: NavKey) {
  try {
    const next = [key, ...readRecentPages().filter((k) => k !== key)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* Recents are a convenience only. */
  }
}

/** Opens a saved Daybook page; the Daybook listens for this. */
export const OPEN_DAYBOOK_EVENT = 'bloom:open-daybook'
export function openDaybookPage(id: string) {
  try {
    sessionStorage.setItem(OPEN_DAYBOOK_EVENT, id)
  } catch {
    /* The event below still works while the Daybook is mounted. */
  }
  window.dispatchEvent(new CustomEvent(OPEN_DAYBOOK_EVENT, { detail: id }))
}

