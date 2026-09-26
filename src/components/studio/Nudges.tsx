import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { NavKey } from '../layout/Sidebar'
import './nudges.css'

/**
 * Gentle recurring nudges (desk stretch, 20-20-20 eyes, screen breaks…).
 * Features register a nudge; one global host checks every 30 s and shows a
 * small card — or a system notification when Bloom is in the background and
 * permission was granted. Never more than one card at a time.
 */
export type Nudge = { id: string; title: string; body: string; page: NavKey; every: number; enabled: boolean; lastAt: number; quietStart?: number; quietEnd?: number }
export const NUDGES_KEY = 'bloom-nudges-v1'
export const NUDGE_EVENT = 'bloom:nudges-changed'

export function readNudges(): Record<string, Nudge> {
  try {
    return JSON.parse(localStorage.getItem(NUDGES_KEY) ?? '{}') as Record<string, Nudge>
  } catch {
    return {}
  }
}
function write(all: Record<string, Nudge>) {
  try {
    localStorage.setItem(NUDGES_KEY, JSON.stringify(all))
  } catch {
    /* best effort */
  }
  window.dispatchEvent(new Event(NUDGE_EVENT))
}
export function setNudge(n: Omit<Nudge, 'lastAt'> & { lastAt?: number }) {
  const all = readNudges()
  all[n.id] = { ...all[n.id], ...n, lastAt: n.lastAt ?? all[n.id]?.lastAt ?? Date.now() }
  write(all)
}
export function snooze(id: string, at = Date.now()) {
  const all = readNudges()
  if (all[id]) {
    all[id].lastAt = at
    write(all)
  }
}

/** Due when enabled, the interval has passed and we're outside quiet hours. */
export function isDue(n: Nudge, now = Date.now()) {
  if (!n.enabled || n.every <= 0) return false
  const h = new Date(now).getHours()
  if (n.quietStart != null && n.quietEnd != null) {
    const quiet = n.quietStart <= n.quietEnd ? h >= n.quietStart && h < n.quietEnd : h >= n.quietStart || h < n.quietEnd
    if (quiet) return false
  }
  return now - n.lastAt >= n.every * 60_000
}

export function NudgeHost({ onNavigate }: { onNavigate: (page: NavKey) => void }) {
  const [shown, setShown] = useState<Nudge | null>(null)
  useEffect(() => {
    const check = () => {
      if (shown) return
      const due = Object.values(readNudges()).find((n) => isDue(n))
      if (!due) return
      snooze(due.id)
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(due.title, { body: due.body, tag: due.id, silent: true })
        } catch {
          /* fall back to the card */
        }
      }
      setShown(due)
    }
    const t = setInterval(check, 30_000)
    window.addEventListener(NUDGE_EVENT, check)
    return () => {
      clearInterval(t)
      window.removeEventListener(NUDGE_EVENT, check)
    }
  }, [shown])
  if (!shown) return null
  return (
    <aside className="nudge-card" aria-live="polite">
      <strong>{shown.title}</strong>
      <span>{shown.body}</span>
      <div>
        <button
          type="button"
          className="studio-go"
          onClick={() => {
            onNavigate(shown.page)
            setShown(null)
          }}
        >
          Let’s do it
        </button>
        <button type="button" className="nudge-later" onClick={() => setShown(null)}>
          Later
        </button>
      </div>
      <button type="button" className="nudge-close" aria-label="Dismiss" onClick={() => setShown(null)}>
        <X size={15} />
      </button>
    </aside>
  )
}
