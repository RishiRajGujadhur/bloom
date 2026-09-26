import { useEffect, useRef, useState } from 'react'
import { Sprout } from 'lucide-react'
import type { AppData } from '../../model'
import { subOn } from '../subFeatures'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import { BREATH_KEY, GRATITUDE_KEY, MOOD_KEY } from '../wellbeing/store'
import { dayKey } from '../../dates'
import { recognise, type Recognition } from './recognition'
import { DISCOVERY_KEY, addMoment, maybeDiscover, type DiscoveryState } from './discoveries'
import { growth, stages, type DayExtras } from './growthModel'
import { dayComplete } from './nowModel'
import { showMoment } from './MomentReveal'

const readArray = <T,>(key: string): T[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}
const readValue = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const writeValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* best effort */
  }
}

/** Dates of wellbeing and Daybook activity, for Bloom Growth. */
export function readExtras(): DayExtras {
  const at = (key: string) => readArray<{ at: number }>(key).map((e) => dayKey(new Date(e.at)))
  return {
    wellbeing: [...new Set([...at(MOOD_KEY), ...at(GRATITUDE_KEY), ...at(BREATH_KEY), ...at('bloom-activity-v1')])],
    daybook: [...new Set(readArray<{ updatedAt: string }>(DAYBOOK_STORAGE_KEY).map((p) => p.updatedAt.slice(0, 10)))],
  }
}

export const STAGE_KEY = 'bloom-stage-v1'
export const DAY_DONE_KEY = 'bloom-daydone-v1'
const periodName = { morning: 'the morning', afternoon: 'the afternoon', evening: 'the evening' } as const

export function CoreEngine({ data, today }: { data: AppData; today: string }) {
  const prev = useRef(data)
  const [whisper, setWhisper] = useState<Recognition | null>(null)

  useEffect(() => {
    const before = prev.current
    prev.current = data
    if (before === data) return

    // Human recognition for the action you just took.
    const rec = recognise(before, data, today)
    if (rec && subOn('bloomCore', 'recognition')) setWhisper(rec)

    // Sometimes, a meaningful action reveals something about you.
    if (rec?.meaningful && subOn('bloomCore', 'discoveries')) {
      let state: DiscoveryState = { misses: 0, found: [] }
      try {
        state = { ...state, ...(JSON.parse(readValue(DISCOVERY_KEY) ?? '{}') as Partial<DiscoveryState>) }
      } catch {
        /* fresh state */
      }
      const moods = readArray<{ at: number; mood: number }>(MOOD_KEY)
      const result = maybeDiscover(data, moods, state, rec.id)
      writeValue(DISCOVERY_KEY, JSON.stringify(result.state))
      if (result.discovery) {
        const d = result.discovery
        addMoment({ id: `discovery:${d.id}`, date: today, kind: 'discovery', title: d.title, detail: d.text })
        setTimeout(() => showMoment({ kind: 'discovery', kicker: 'Bloom discovered something about you', title: d.title, body: d.text, rare: d.rare }), 1400)
      }
    }

    // Growing into a new stage is a moment.
    if (subOn('bloomCore', 'growth')) {
      const g = growth(data, today, readExtras())
      const idx = stages.findIndex((s) => s.id === g.stage.id)
      const stored = readValue(STAGE_KEY)
      const was = stored == null ? -1 : stages.findIndex((s) => s.id === stored)
      // First run just remembers where you are. After that, a stage-up waits
      // for your next real action so the moment is tied to what earned it.
      if (stored == null) writeValue(STAGE_KEY, g.stage.id)
      else if (idx > was && rec) {
        writeValue(STAGE_KEY, g.stage.id)
        addMoment({ id: `stage:${g.stage.id}`, date: today, kind: 'stage', title: `You became ${g.stage.name}`, detail: g.stage.line })
        setTimeout(() => showMoment({ kind: 'stage', kicker: 'Your Bloom is changing', title: g.stage.name, body: `${g.stage.line} ${g.lifetimeDays} days of showing up brought you here.`, rare: g.stage.id === 'blooming' }), 900)
      }
    }

    // The peak of the day: everything you planned, done.
    if (subOn('bloomCore', 'dayComplete') && readValue(DAY_DONE_KEY) !== today) {
      const d = dayComplete(data, today)
      if (d.complete) {
        writeValue(DAY_DONE_KEY, today)
        const focus = d.bestFocus ? ` Your focus was strongest in ${periodName[d.bestFocus]}.` : ''
        addMoment({ id: `day:${today}`, date: today, kind: 'day', title: 'A whole day, done', detail: `You planned ${d.planned} things and completed all of them.${focus}` })
        setTimeout(
          () =>
            showMoment({
              kind: 'day',
              kicker: 'Your day is complete',
              title: 'Everything you planned, done',
              body: `You planned ${d.planned} things. You completed ${d.done}.${focus} The rest of today is yours.`,
              stats: [
                { label: 'planned', value: String(d.planned) },
                { label: 'completed', value: String(d.done) },
                { label: 'focus minutes', value: String(d.focusMinutes) },
              ],
            }),
          1800,
        )
      }
    }
  }, [data, today])

  useEffect(() => {
    if (!whisper) return
    const t = setTimeout(() => setWhisper(null), 6000)
    return () => clearTimeout(t)
  }, [whisper])

  if (!whisper) return null
  return (
    <aside className="core-whisper" aria-live="polite" key={whisper.id} onClick={() => setWhisper(null)}>
      <span className="core-whisper-icon" aria-hidden="true">
        <Sprout size={18} />
      </span>
      <span>
        <strong>{whisper.headline}</strong>
        <small>{whisper.detail}</small>
      </span>
    </aside>
  )
}
