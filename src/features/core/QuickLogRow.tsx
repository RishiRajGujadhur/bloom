import { useState } from 'react'
import { readDiet, saveDiet } from '../diet/dietModel'
import { MOOD_KEY } from '../wellbeing/store'
import { dayKey } from '../../dates'

const moods = ['😣', '😕', '😐', '🙂', '😄']

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
