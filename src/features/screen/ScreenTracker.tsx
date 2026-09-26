import { useEffect, useRef, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { SCREEN_EVENT, SCREEN_KEY, addActive, defaultScreen, inWindDown, type ScreenStore } from './screenModel'
import './screen.css'

/**
 * Always-on (when enabled): counts active time with react-idle-timer (no
 * input for 60 s = idle), nudges a break after continuous use, and applies
 * detox / wind-down / focus-only modes to the whole app via <html> classes.
 */
export function ScreenTracker() {
  const [settings, setSettings] = useState(() => readStore<ScreenStore>(SCREEN_KEY, defaultScreen).settings)
  const [breakDue, setBreakDue] = useState(false)
  const [gate, setGate] = useState(() => settings.pauseGate && subOn('digitalWellbeing', 'pauseGate'))
  const streakStart = useRef(Date.now())
  const { isIdle } = useIdleTimer({ timeout: 60_000, throttle: 1000, onActive: () => (streakStart.current = Date.now()) })

  useEffect(() => {
    const sync = () => setSettings(readStore<ScreenStore>(SCREEN_KEY, defaultScreen).settings)
    window.addEventListener(SCREEN_EVENT, sync)
    return () => window.removeEventListener(SCREEN_EVENT, sync)
  }, [])

  // Record 15 s of activity at a time.
  useEffect(() => {
    const t = setInterval(() => {
      if (isIdle() || document.hidden) {
        streakStart.current = Date.now()
        return
      }
      const s = readStore<ScreenStore>(SCREEN_KEY, defaultScreen)
      writeStore(SCREEN_KEY, { ...s, usage: addActive(s.usage, Date.now(), 15) })
      if (subOn('digitalWellbeing', 'breaks') && Date.now() - streakStart.current >= s.settings.breakEvery * 60_000) setBreakDue(true)
    }, 15_000)
    return () => clearInterval(t)
  }, [isIdle])

  useEffect(() => {
    const html = document.documentElement
    const wd = settings.windDown && subOn('digitalWellbeing', 'windDown') && inWindDown(settings.windDownFrom)
    html.classList.toggle('bloom-detox', settings.detox && subOn('digitalWellbeing', 'detox'))
    html.classList.toggle('bloom-winddown', !!wd)
    html.classList.toggle('bloom-focus-only', settings.focusOnly && subOn('digitalWellbeing', 'focusOnly'))
    return () => html.classList.remove('bloom-detox', 'bloom-winddown', 'bloom-focus-only')
  }, [settings])

  return (
    <>
      {breakDue && (
        <div className="sw-break" role="alertdialog" aria-label="Take a break">
          <div className="sw-break-orb" />
          <h2>Time for a screen break</h2>
          <p>You’ve been going for {settings.breakEvery} minutes. Look far away, stretch, sip water.</p>
          <button
            type="button"
            className="studio-go"
            onClick={() => {
              streakStart.current = Date.now()
              setBreakDue(false)
            }}
          >
            I’m back
          </button>
        </div>
      )}
      {gate && (
        <div className="sw-gate" role="dialog" aria-label="Pause before you begin">
          <div className="sw-break-orb" />
          <h2>Take one breath before you begin</h2>
          <p>What did you come here to do?</p>
          <button type="button" className="studio-go" onClick={() => setGate(false)}>
            Continue with intention
          </button>
        </div>
      )}
    </>
  )
}
