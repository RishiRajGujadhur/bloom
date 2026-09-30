import { useEffect, useState } from 'react'
import './bedtimeNudge.css'
import { SLEEP_SETTINGS_KEY, defaultSleepSettings, minutesUntilBedtime, type SleepSettings } from './sleepModel'

const FIRED_KEY = 'bloom-bedtime-nudge-day'

/** A once-a-night nudge before your target bedtime (set in Sleep → Wind-down). */
export function BedtimeNudge() {
  const [show, setShow] = useState<number | null>(null)
  useEffect(() => {
    const check = () => {
      let settings: SleepSettings = defaultSleepSettings
      try {
        settings = { ...defaultSleepSettings, ...JSON.parse(localStorage.getItem(SLEEP_SETTINGS_KEY) ?? '{}') }
      } catch {
        /* defaults */
      }
      const before = settings.remindBefore ?? 0
      if (!before) return
      const left = minutesUntilBedtime(settings.bedtime)
      const day = new Date().toDateString()
      if (left > before || left < 0 || localStorage.getItem(FIRED_KEY) === day) return
      try {
        localStorage.setItem(FIRED_KEY, day)
      } catch {
        /* still show it */
      }
      setShow(left)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState === 'hidden')
        new Notification('Time to start winding down', { body: `Bedtime in ${left} minutes`, tag: 'bloom-bedtime' })
    }
    check()
    const timer = setInterval(check, 60000)
    return () => clearInterval(timer)
  }, [])
  if (show === null) return null
  return (
    <div className="bedtime-nudge" role="status">
      <span aria-hidden="true">🌙</span>
      <span>
        Bedtime in {show} minutes. Start winding down?
      </span>
      <a href="#sleep" onClick={() => setShow(null)}>Wind-down</a>
      <button type="button" aria-label="Dismiss" onClick={() => setShow(null)}>✕</button>
    </div>
  )
}
