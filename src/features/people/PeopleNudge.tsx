import { useEffect, useState } from 'react'
import { daysSince, type Person } from './peopleModel'
import '../sleep/bedtimeNudge.css'

const SEEN_KEY = 'bloom-people-nudged'

/** Once a day: the person most overdue for a catch-up (past their keep-in-touch rhythm). */
export function PeopleNudge() {
  const [who, setWho] = useState<{ name: string; days: number } | null>(null)
  useEffect(() => {
    const today = new Date().toDateString()
    try {
      if (localStorage.getItem(SEEN_KEY) === today) return
      const people = JSON.parse(localStorage.getItem('bloom-people-v1') ?? '[]') as Person[]
      const due = people
        .map((p) => ({ p, ratio: daysSince(p) / Math.max(1, p.every) }))
        .filter((x) => x.ratio > 1)
        .sort((a, b) => b.ratio - a.ratio)[0]
      if (!due) return
      const t = setTimeout(() => {
        localStorage.setItem(SEEN_KEY, today)
        setWho({ name: `${due.p.emoji} ${due.p.name}`, days: daysSince(due.p) })
      }, 20_000)
      return () => clearTimeout(t)
    } catch {
      /* nothing to suggest */
    }
  }, [])
  if (!who) return null
  return (
    <div className="bedtime-nudge" role="status">
      <span>
        It’s been {who.days} days since you caught up with {who.name}.
      </span>
      <a href="#people" onClick={() => setWho(null)}>
        Say hi
      </a>
      <button type="button" aria-label="Dismiss" onClick={() => setWho(null)}>
        ✕
      </button>
    </div>
  )
}
