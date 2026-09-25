import { useState } from 'react'
import { Check, Clock, Plus } from 'lucide-react'
import {
  habitCategories,
  habitTemplates,
  routineTemplates,
  type HabitTemplate,
  type RoutineTemplate,
} from './library'
import './library.css'

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const periods = ['all', 'morning', 'afternoon', 'evening', 'night'] as const

/** Browse ready-made habits as cards and adopt them with one tap. */
export function HabitLibrary({
  adopted,
  onAdopt,
}: {
  /** Titles already in the user's list (case-insensitive). */
  adopted: Set<string>
  onAdopt: (template: HabitTemplate) => void
}) {
  const [category, setCategory] = useState<string>('all')
  const shown = habitTemplates.filter(
    (h) => category === 'all' || h.category === category,
  )
  return (
    <div className="adopt-library">
      <div className="filter-chips" role="tablist" aria-label="Habit category">
        {habitCategories.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="adopt-grid">
        {shown.map((h) => {
          const has = adopted.has(h.title.toLowerCase())
          return (
            <li key={h.id} className="adopt-card" style={{ ['--tint' as string]: h.color }}>
              <span className="adopt-emoji" aria-hidden="true">
                {h.emoji}
              </span>
              <strong>{h.title}</strong>
              <span className="adopt-detail">{h.detail}</span>
              <p>{h.why}</p>
              <span className="adopt-meta">
                <Clock size={13} aria-hidden="true" /> {h.minutes} min
                <span className="adopt-tag">{h.category}</span>
              </span>
              <button
                className={has ? 'ov-secondary' : 'ov-primary'}
                disabled={has}
                onClick={() => onAdopt(h)}
                aria-label={has ? `${h.title} added` : `Adopt ${h.title}`}
              >
                {has ? <Check size={16} /> : <Plus size={16} />}
                {has ? 'Added' : 'Adopt'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Browse ready-made routines with their steps and adopt one. */
export function RoutineLibrary({
  adopted,
  onAdopt,
}: {
  adopted: Set<string>
  onAdopt: (template: RoutineTemplate) => void
}) {
  const [period, setPeriod] = useState<(typeof periods)[number]>('all')
  const shown = routineTemplates.filter(
    (r) => period === 'all' || r.period === period,
  )
  return (
    <div className="adopt-library">
      <div className="filter-chips" role="tablist" aria-label="Time of day">
        {periods.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
          >
            {p === 'all' ? 'All' : p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <ul className="adopt-grid">
        {shown.map((r) => {
          const has = adopted.has(r.title.toLowerCase())
          const total = r.steps.reduce((sum, s) => sum + s.minutes, 0)
          return (
            <li key={r.id} className="adopt-card">
              <span className="adopt-emoji" aria-hidden="true">
                {r.emoji}
              </span>
              <strong>{r.title}</strong>
              <span className="adopt-detail">{r.detail}</span>
              <ol className="adopt-steps">
                {r.steps.map((s) => (
                  <li key={s.title}>
                    {s.title} <small>{s.minutes}m</small>
                  </li>
                ))}
              </ol>
              <span className="adopt-meta">
                <Clock size={13} aria-hidden="true" /> {total} min
                <span className="adopt-days" aria-label="Days">
                  {weekdays.map((d, i) => (
                    <i key={i} data-on={r.days.includes(i)}>
                      {d}
                    </i>
                  ))}
                </span>
              </span>
              <button
                className={has ? 'ov-secondary' : 'ov-primary'}
                disabled={has}
                onClick={() => onAdopt(r)}
                aria-label={has ? `${r.title} added` : `Adopt ${r.title}`}
              >
                {has ? <Check size={16} /> : <Plus size={16} />}
                {has ? 'Added' : 'Adopt'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
