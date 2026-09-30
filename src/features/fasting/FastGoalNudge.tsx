import { useEffect, useState } from 'react'
import { FAST_KEY } from './fastingModel'
import '../sleep/bedtimeNudge.css'

const SEEN_KEY = 'bloom-fast-goal-notified'

/** Tells you (once per fast) when the running fast reaches its goal, wherever you are in Bloom. */
export function FastGoalNudge() {
  const [hit, setHit] = useState<number | null>(null)
  useEffect(() => {
    const check = () => {
      let cur: { start: number; goal: number } | undefined
      try {
        cur = JSON.parse(localStorage.getItem(FAST_KEY) ?? 'null')?.current
      } catch {
        return
      }
      if (!cur?.start || !cur.goal) return
      if (Date.now() < cur.start + cur.goal * 3600e3) return
      if (localStorage.getItem(SEEN_KEY) === String(cur.start)) return
      try {
        localStorage.setItem(SEEN_KEY, String(cur.start))
      } catch {
        /* may repeat */
      }
      setHit(cur.goal)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState === 'hidden')
        new Notification(`${cur.goal}-hour fast complete 🎉`, { body: 'Break it gently when you’re ready.', tag: 'bloom-fast' })
    }
    check()
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [])
  if (hit === null) return null
  return (
    <div className="bedtime-nudge" role="status">
      <span aria-hidden="true">🎉</span>
      <span>You’ve reached your {hit}-hour fast. Break it gently when you’re ready.</span>
      <a href="#fasting" onClick={() => setHit(null)}>
        Open
      </a>
      <button type="button" aria-label="Dismiss" onClick={() => setHit(null)}>
        ✕
      </button>
    </div>
  )
}
