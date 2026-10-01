import { useState } from 'react'
import { readDiet, saveDiet } from '../diet/dietModel'
import { MOOD_KEY } from '../wellbeing/store'
import { dayKey } from '../../dates'

const moods = ['😣', '😕', '😐', '🙂', '😄']

/** Home: one ring for today — habits checked plus to-dos due today that are done. */
export function TodayRing({ habitsDone, habitsTotal, todosDone, todosTotal }: { habitsDone: number; habitsTotal: number; todosDone: number; todosTotal: number }) {
  const total = habitsTotal + todosTotal
  if (!total) return null
  const done = habitsDone + todosDone
  const frac = done / total
  const C = 2 * Math.PI * 16
  return (
    <span className="today-ring" title={`${habitsDone}/${habitsTotal} habits · ${todosDone}/${todosTotal} to-dos due today`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" className="tr-track" />
        <circle cx="20" cy="20" r="16" className="tr-arc" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 20 20)" />
      </svg>
      <span>
        <strong>{Math.round(frac * 100)}%</strong> of today done
      </span>
    </span>
  )
}

/** Home: one-tap mood and water logging without leaving the dashboard. */
export function QuickLogRow({ water: showWater, mood: showMood }: { water: boolean; mood: boolean }) {
  const today = dayKey()
  const [glasses, setGlasses] = useState(() => readDiet().water[today] ?? 0)
  const [logged, setLogged] = useState<number | null>(null)
  if (!showWater && !showMood) return null
  const logMood = (value: number) => {
    try {
      const list: unknown = JSON.parse(localStorage.getItem(MOOD_KEY) ?? '[]')
      localStorage.setItem(MOOD_KEY, JSON.stringify([{ id: crypto.randomUUID(), at: Date.now(), mood: value, note: '' }, ...(Array.isArray(list) ? list : [])]))
      setLogged(value)
    } catch {
      /* storage blocked */
    }
  }
  const addWater = (n: number) => {
    const diet = readDiet()
    const next = Math.max(0, (diet.water[today] ?? 0) + n)
    saveDiet({ ...diet, water: { ...diet.water, [today]: next } })
    setGlasses(next)
  }
  return (
    <div className="quick-log-row" aria-label="Quick log">
      {showMood && (
        <span className="ql-group" role="group" aria-label="How do you feel?">
          <small>{logged ? 'Logged ✓' : 'Feeling'}</small>
          {moods.map((m, i) => (
            <button key={m} type="button" aria-pressed={logged === i + 1} aria-label={`Mood ${i + 1} of 5`} onClick={() => logMood(i + 1)}>
              {m}
            </button>
          ))}
        </span>
      )}
      {showWater && (
        <span className="ql-group" role="group" aria-label="Water today">
          <small>💧 {glasses} today</small>
          <button type="button" aria-label="Remove a glass" disabled={!glasses} onClick={() => addWater(-1)}>
            −
          </button>
          <button type="button" aria-label="Add a glass of water" onClick={() => addWater(1)}>
            +1
          </button>
        </span>
      )}
    </div>
  )
}
