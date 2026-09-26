import { useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import gsap from 'gsap'
import * as SunCalc from 'suncalc'
import { readStore } from '../../components/studio/Studio'
import { DAYLIGHT_KEY, homeCity, type DaylightStore } from '../daylight/daylightModel'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide, type GuidedMood } from '../../components/ui/MoodGuide'
import { QuickPanel, logMood } from '../../components/ui/QuickPanel'
import { dayKey } from '../../dates'
import { sleepFactors, type SleepEntry, type SleepSettings } from '../sleep/sleepModel'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('sleepTracker', id)

/** Wake-up feelings, each mapped to a 1–5 sleep quality. */
export const wakeMoods: (GuidedMood & { quality: SleepEntry['quality'] })[] = [
  { id: 'refreshed', emoji: '🌞', label: 'Refreshed', color: '#f7c948', hint: 'Great night. Note what helped.', quality: 5 },
  { id: 'rested', emoji: '🙂', label: 'Rested', color: '#7fc8a9', hint: 'A solid night.', quality: 4 },
  { id: 'okay', emoji: '😐', label: 'Okay', color: '#9fb4c7', hint: 'Average — small tweaks add up.', quality: 3 },
  { id: 'groggy', emoji: '🥱', label: 'Groggy', color: '#8e9aaf', hint: 'Try daylight early and water first.', quality: 2 },
  { id: 'exhausted', emoji: '😵', label: 'Exhausted', color: '#6c8ebf', hint: 'Be gentle today; aim for an early night.', quality: 1 },
]

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** A sun that rises over the hills; higher for better sleep. */
function Sunrise({ quality }: { quality: number }) {
  const sun = useRef<SVGCircleElement>(null)
  useLayoutEffect(() => {
    if (!sun.current) return
    const tw = gsap.to(sun.current, { attr: { cy: 70 - quality * 10 }, duration: 1.2, ease: 'power3.out' })
    return () => void tw.kill()
  }, [quality])
  return (
    <svg className="sleep-sunrise" viewBox="0 0 200 80" aria-hidden="true">
      <defs>
        <linearGradient id="dawn" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd9a8" />
          <stop offset="1" stopColor="#ffb3a7" />
        </linearGradient>
      </defs>
      <rect width="200" height="80" fill="url(#dawn)" rx="12" />
      <circle ref={sun} cx="100" cy="80" r="14" fill="#ffcc4d" />
      <path d="M0 64 Q50 44 100 62 T200 58 V80 H0Z" fill="#7aa68a" />
      <path d="M0 72 Q60 58 120 72 T200 70 V80 H0Z" fill="#5d8a6e" />
    </svg>
  )
}

export function SleepQuick({ settings, setEntries }: { settings: SleepSettings; setEntries: Dispatch<SetStateAction<SleepEntry[]>> }) {
  const [wake, setWake] = useState<string | null>(null)
  const [id, setId] = useState<string | null>(null)
  const today = dayKey()
  const mood = wakeMoods.find((m) => m.id === wake)
  const sunrise = on('sunrise') ? (() => { const place = readStore<Partial<DaylightStore>>(DAYLIGHT_KEY, {}).place ?? homeCity(); return SunCalc.getTimes(new Date(), place.lat, place.lng).sunrise })() : null
  return (
    <QuickPanel id="sleep" title="Morning check-in">
      {on('sunrise') && <Sunrise quality={mood?.quality ?? 0} />}
      <MoodGuide
        label="How did you wake up?"
        moods={wakeMoods}
        value={wake}
        onChange={(w) => {
          setWake(w)
          logMood('sleep', w)
          const q = wakeMoods.find((m) => m.id === w)!.quality
          if (id) return setEntries((list) => list.map((e) => (e.id === id ? { ...e, quality: q } : e)))
          const entryId = crypto.randomUUID()
          setId(entryId)
          setEntries((list) => [{ id: entryId, date: today, bedtime: settings.bedtime, wake: on('smartDefaults') ? hhmm(new Date()) : '07:00', quality: q, factors: [] }, ...list])
        }}
      />
      {id && <small className="quick-note">Logged {settings.bedtime} → {on('smartDefaults') ? 'now' : '07:00'}. Adjust times below if needed.{sunrise && !Number.isNaN(sunrise.getTime()) ? ` Sunrise today ${hhmm(sunrise)} — get some light.` : ''}</small>}
      {id && on('factorSwipe') && (
        <SwipeDeck
          label="Last night: swipe right for yes"
          cards={sleepFactors.map((f) => ({ id: f.id, emoji: f.emoji, title: `${f.label}?` }))}
          empty="Thanks — factors saved. Patterns appear after a week."
          onSwipe={(card, yes) =>
            setEntries((list) => list.map((e) => (e.id === id ? { ...e, factors: yes ? [...new Set([...e.factors, card.id])] : e.factors.filter((f) => f !== card.id) } : e)))
          }
        />
      )}
    </QuickPanel>
  )
}
