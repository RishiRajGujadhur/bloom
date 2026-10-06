import { useEffect, useState } from 'react'
import { dayKey } from '../dates'

/** Update at local midnight (including DST) and when returning to the app. */
export function useToday() {
  const [today, setToday] = useState(dayKey)
  useEffect(() => {
    let timer = 0
    const sync = () => {
      window.clearTimeout(timer)
      setToday(dayKey())
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      timer = window.setTimeout(
        sync,
        Math.max(1, midnight.getTime() - Date.now()),
      )
    }
    const visible = () => {
      if (!document.hidden) sync()
    }
    sync()
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', visible)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])
  return today
}
