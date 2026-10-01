import { NextStep } from '../dailyFlow/DailyFlow'
import { Wind } from 'lucide-react'
import { subOn } from '../subFeatures'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BedDouble, Check, Moon, Sparkles, Sunrise, Trash2 } from 'lucide-react'
import { MOOD_KEY, useStoredList, type MoodEntry } from '../wellbeing/store'
import { useStoredValue } from './useStoredValue'
import { LottieIcon } from '../../components/ui/LottieIcon'
import { dayKey } from '../../dates'
import { prefersReducedMotion } from '../../utils/motion'
import {
  SLEEP_KEY,
  SLEEP_SETTINGS_KEY,
  defaultSleepSettings,
  averageBedtime,
  duration,
  factorImpact,
  minutesUntilBedtime,
  sleepFactors,
  sleepStats,
  windDownSteps,
  type SleepEntry,
  type SleepSettings,
} from './sleepModel'
import './sleep.css'
import { download } from '../lab/exportSuite'
import { SleepQuick } from '../quick/SleepQuick'
import { NightSky } from './NightSky'

export const WIND_DOWN_KEY = 'bloom-winddown-v1'
/** Records tonight's completed wind-down (read by the Daily flow). */
function markWindDown() {
  try {
    localStorage.setItem(WIND_DOWN_KEY, new Date().toISOString().slice(0, 10))
  } catch {
    /* optional */
  }
}

const qualities = ['😫', '😕', '😐', '🙂', '😴'] as const
type Tab = 'log' | 'wind-down' | 'insights'

export function SleepPage() {
  const [entries, setEntries] = useStoredList<SleepEntry>(SLEEP_KEY)
  const [moodEntries] = useStoredList<MoodEntry>(MOOD_KEY)
  const [settings, setSettings] = useStoredValue<SleepSettings>(
    SLEEP_SETTINGS_KEY,
    defaultSleepSettings,
  )
  const [tab, setTab] = useState<Tab>('log')
  const stats = sleepStats(entries, settings)
  return (
    <section className="sleep-page" aria-label="Sleep">
      {subOn('sleepTracker', 'morningCheckin') && <SleepQuick settings={settings} setEntries={setEntries} />}
      <NightSky quality={stats.count ? stats.quality : 3}>
      <div className="sleep-stats">
        <Stat label="Avg sleep" value={stats.count ? `${stats.average}h` : '—'} hint={`Goal ${settings.targetHours}h`} />
        <Stat label="Quality" value={stats.count ? `${stats.quality}/5` : '—'} />
        <Stat label="Consistency" value={stats.count ? `${stats.consistency}%` : '—'} hint="Bedtime regularity" />
        <Stat label="Sleep debt" value={stats.count ? `${stats.debt}h` : '—'} hint="Last 7 nights" />
      </div>
      </NightSky>
      {entries.length > 0 && (
        <button
          type="button"
          className="sleep-export"
          onClick={() => {
            const rows = [...entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.bedtime, e.wake, duration(e.bedtime, e.wake), e.quality, e.factors.join('; ')].join(','))
            download(new Blob([['date,bedtime,wake,hours,quality,factors', ...rows].join('\n') + '\n'], { type: 'text/csv' }), 'bloom-sleep.csv')
          }}
        >
          {entries.filter((e) => e.date.startsWith(dayKey().slice(0, 7))).length} nights logged this month · ⬇ Export nights (CSV)
        </button>
      )}
      {stats.count >= 3 &&
        (() => {
          const week = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
          const best = week.reduce((a, e) => (e.quality * 10 + duration(e.bedtime, e.wake) > a.quality * 10 + duration(a.bedtime, a.wake) ? e : a), week[0])
          return (
            <p className="sleep-debt-note">
              Best night this week: <strong>{new Date(`${best.date}T12:00:00`).toLocaleDateString([], { weekday: 'long' })}</strong> · {duration(best.bedtime, best.wake)}h, quality {best.quality}/5 (bed {best.bedtime})
            </p>
          )
        })()}
      {stats.count >= 3 && averageBedtime(entries) && (
        <p className="sleep-debt-note">
          You usually go to bed around <strong>{averageBedtime(entries)}</strong>
          {settings.bedtime ? ` (target ${settings.bedtime})` : ''}.
        </p>
      )}
      {stats.count >= 3 && (
        <p className="sleep-debt-note">
          {stats.debt <= 0.5
            ? `You're on target — averaging ${stats.average}h against your ${settings.targetHours}h goal. 🌙`
            : `You're about ${stats.debt}h short over the last ${stats.count} nights. Going to bed ${Math.min(60, Math.ceil((stats.debt * 60) / 7 / 5) * 5)} minutes earlier for a week would pay it back.`}
        </p>
      )}
      {(() => {
        const last = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]
        if (!last || entries.some((e) => e.date === dayKey())) return null
        return (
          <div className="sleep-onetap">
            <span>
              Slept like last time? {last.bedtime} → {last.wake} · {duration(last.bedtime, last.wake)}h
            </span>
            <button
              type="button"
              className="ov-primary"
              onClick={() => setEntries((list) => [{ ...last, id: crypto.randomUUID(), date: dayKey(), factors: [] }, ...list])}
            >
              Log it
            </button>
          </div>
        )
      })()}
      <div className="filter-chips" role="tablist" aria-label="Sleep views">
        {(
          [
            ['log', 'Log a night'],
            ['wind-down', 'Wind-down'],
            ['insights', 'Insights'],
          ] as const
        )
          .filter(([id]) => id === 'log' || subOn('sleepTracker', id === 'wind-down' ? 'windDown' : 'insights'))
          .map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'log' && (
        <SleepLog
          onSave={(entry) =>
            setEntries((list) => [entry, ...list.filter((e) => e.date !== entry.date)])
          }
          settings={settings}
        />
      )}
      {tab === 'wind-down' && <WindDown settings={settings} setSettings={setSettings} />}
      {tab === 'insights' && (
        <SleepInsights
          entries={entries}
          moodEntries={moodEntries}
          settings={settings}
          onDelete={(id) => setEntries((list) => list.filter((e) => e.id !== id))}
        />
      )}
    </section>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="sleep-stat">
      <strong>{value}</strong>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
  )
}

function SleepLog({
  onSave,
  settings,
}: {
  onSave: (entry: SleepEntry) => void
  settings: SleepSettings
}) {
  const [night, setNight] = useState(dayKey())
  const [bedtime, setBedtime] = useState(settings.bedtime)
  const [wake, setWake] = useState('06:30')
  const [quality, setQuality] = useState<SleepEntry['quality']>(4)
  const [factors, setFactors] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [lastQuality, setLastQuality] = useState<number | null>(null)
  const hours = duration(bedtime, wake)
  return (
    <form
      className="sleep-card sleep-log"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ id: crypto.randomUUID(), date: night, bedtime, wake, quality, factors })
        setSaved(true)
        setLastQuality(quality)
        setFactors([])
      }}
    >
      <label className="sleep-night">
        Woke up on
        <input type="date" value={night} max={dayKey()} onChange={(e) => setNight(e.target.value || dayKey())} />
        {night !== dayKey() && <small> · saving replaces that night</small>}
      </label>
      <div className="sleep-times">
        <label>
          <Moon size={18} aria-hidden="true" /> Bedtime
          <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} required />
        </label>
        <motion.span key={hours} className="sleep-hours" initial={prefersReducedMotion() ? false : { scale: 0.9 }} animate={{ scale: 1 }}>
          {hours}h
        </motion.span>
        <label>
          <Sunrise size={18} aria-hidden="true" /> Woke up
          <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} required />
        </label>
      </div>
      <fieldset className="sleep-quality">
        <legend>How rested do you feel?</legend>
        {qualities.map((emoji, i) => (
          <button
            key={emoji}
            type="button"
            aria-pressed={quality === i + 1}
            aria-label={`Quality ${i + 1} of 5`}
            onClick={() => setQuality((i + 1) as SleepEntry['quality'])}
          >
            {emoji}
          </button>
        ))}
      </fieldset>
      <fieldset className="sleep-factors" hidden={!subOn('sleepTracker', 'factors')}>
        <legend>Anything that played a part?</legend>
        <div className="filter-chips">
          {sleepFactors.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={factors.includes(f.id)}
              onClick={() =>
                setFactors((list) =>
                  list.includes(f.id) ? list.filter((x) => x !== f.id) : [...list, f.id],
                )
              }
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </fieldset>
      <button className="ov-primary" type="submit">
        <LottieIcon name="check" size={17} /> Save last night
      </button>
      {saved && (
        <p className="sleep-saved" role="status">
          <Check size={15} aria-hidden="true" /> Saved. Sleep well tonight.
        </p>
      )}
      {saved && lastQuality !== null && (
        lastQuality <= 2 ? (
          <NextStep icon={<Wind size={18} />} text="A rough night. Go easy today — a short breathing break helps more than coffee." action="Breathe" page="breathe" />
        ) : (
          <NextStep icon={<Sparkles size={18} />} text="Well rested! Protect a deep-work block while your energy is high." action="Focus room" page="focus-room" />
        )
      )}
    </form>
  )
}

/** Advanced mode: a countdown to bedtime with a guided wind-down checklist. */
function WindDown({
  settings,
  setSettings,
}: {
  settings: SleepSettings
  setSettings: (update: (s: SleepSettings) => SleepSettings) => void
}) {
  const [now, setNow] = useState(() => new Date())
  const [done, setDone] = useState<string[]>([])
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])
  const complete = done.length === windDownSteps.length
  useEffect(() => {
    if (complete) markWindDown()
  }, [complete])
  const left = minutesUntilBedtime(settings.bedtime, now)
  const progress = done.length / windDownSteps.length
  return (
    <div className="sleep-card sleep-wind">
      <div className="sleep-moon" style={{ ['--p' as string]: progress }} aria-hidden="true">
        <span>🌙</span>
      </div>
      <div>
        <h3>
          {left > 0
            ? `${Math.floor(left / 60)}h ${left % 60}m until bedtime`
            : left > -60
              ? 'It’s bedtime. Rest well.'
              : 'Past bedtime. Be gentle with yourself.'}
        </h3>
        <div className="sleep-settings">
          <label>
            Target bedtime
            <input
              type="time"
              value={settings.bedtime}
              onChange={(e) => setSettings((s) => ({ ...s, bedtime: e.target.value }))}
            />
          </label>
          <label>
            Sleep goal
            <input
              type="number"
              min={5}
              max={11}
              step={0.5}
              value={settings.targetHours}
              onChange={(e) =>
                setSettings((s) => ({ ...s, targetHours: Number(e.target.value) || 8 }))
              }
            />
            h
          </label>
          <label>
            Remind me
            <select
              value={settings.remindBefore ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSettings((s) => ({ ...s, remindBefore: v }))
                if (v && typeof Notification !== 'undefined' && Notification.permission === 'default') void Notification.requestPermission()
              }}
            >
              <option value={0}>Off</option>
              <option value={15}>15 min before</option>
              <option value={30}>30 min before</option>
              <option value={60}>1 hour before</option>
            </select>
          </label>
        </div>
        <ol className="sleep-steps">
          {windDownSteps.map((step) => {
            const checked = done.includes(step.id)
            return (
              <li key={step.id}>
                <button
                  type="button"
                  aria-pressed={checked}
                  onClick={() =>
                    setDone((list) =>
                      checked ? list.filter((x) => x !== step.id) : [...list, step.id],
                    )
                  }
                >
                  <span aria-hidden="true">{checked ? '✓' : step.emoji}</span>
                  {step.label}
                  <small>{step.minutes}m</small>
                </button>
              </li>
            )
          })}
        </ol>
        {done.length === windDownSteps.length && (
          <p className="sleep-saved" role="status">
            <Sparkles size={15} aria-hidden="true" /> Wind-down complete. Lights out.
          </p>
        )}
      </div>
    </div>
  )
}

function SleepInsights({
  entries,
  moodEntries,
  settings,
  onDelete,
}: {
  entries: SleepEntry[]
  moodEntries: MoodEntry[]
  settings: SleepSettings
  onDelete: (id: string) => void
}) {
  const nights = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-14),
    [entries],
  )
  const impact = factorImpact(entries)
  const paired = useMemo(() => nights.flatMap((night) => {
    const values = moodEntries.filter((entry) => dayKey(new Date(entry.at)) === night.date && Number.isFinite(entry.mood) && entry.mood >= 1 && entry.mood <= 5)
    if (!values.length) return []
    return [{ date: night.date, hours: duration(night.bedtime, night.wake), mood: values.reduce((sum, entry) => sum + entry.mood, 0) / values.length }]
  }), [nights, moodEntries])
  if (!entries.length)
    return (
      <div className="sleep-card sleep-empty">
        <BedDouble size={28} aria-hidden="true" />
        <p>Log a few nights to see your patterns.</p>
      </div>
    )
  const max = Math.max(settings.targetHours + 1, ...nights.map((n) => duration(n.bedtime, n.wake)))
  return (
    <div className="sleep-insights">
      <div className="sleep-card sleep-mood-card">
        <h3 aria-label="Sleep and mood check-ins"><Moon size={18} aria-hidden="true" /> <span className="sr-only">Sleep and mood check-ins</span></h3>
        {paired.length ? <>
          <p className="wb-muted">Nights and mood check-ins on the same wake-up date. Each dot is one day.</p>
          <svg className="sleep-mood-chart" viewBox="0 0 400 210" role="img" aria-label={`Sleep and mood on ${paired.length} matched ${paired.length === 1 ? 'day' : 'days'}`}>
            <text x="4" y="23">12h</text><text x="14" y="83">0h</text><text x="18" y="122">5</text><text x="18" y="183">1</text>
            <line x1="42" y1="80" x2="390" y2="80" stroke="currentColor" opacity=".25" />
            <line x1="42" y1="180" x2="390" y2="180" stroke="currentColor" opacity=".25" />
            <polyline fill="none" stroke="#6b7fd7" strokeWidth="2" points={paired.map((day, i) => `${paired.length === 1 ? 210 : 55 + i * 320 / (paired.length - 1)},${80 - Math.min(12, day.hours) * 5}`).join(' ')} />
            <polyline fill="none" stroke="#e27396" strokeWidth="2" points={paired.map((day, i) => `${paired.length === 1 ? 210 : 55 + i * 320 / (paired.length - 1)},${180 - (day.mood - 1) * 15}`).join(' ')} />
            {paired.map((day, i) => {
              const x = paired.length === 1 ? 210 : 55 + i * 320 / (paired.length - 1)
              const moodY = 180 - (day.mood - 1) * 15
              const sleepY = 80 - Math.min(12, day.hours) * 5
              return <g key={day.date}>
                <circle cx={x} cy={sleepY} r="5" fill="#6b7fd7"><title>{day.date}: {day.hours} hours slept</title></circle>
                <circle cx={x} cy={moodY} r="5" fill="#e27396"><title>{day.date}: mood {day.mood.toFixed(1)} of 5</title></circle>
                {(i % 2 === 0 || paired.length <= 7) && <text x={x} y="200" textAnchor="middle">{day.date.slice(5)}</text>}
              </g>
            })}
          </svg>
          <p className="sleep-mood-legend"><span>● Sleep hours (0–12)</span><span>● Mood (1–5)</span></p>
          <p className="wb-muted">Latest match: {paired[paired.length - 1].date} · {paired[paired.length - 1].hours}h sleep · mood {paired[paired.length - 1].mood.toFixed(1)}/5.</p>
          <p className="wb-muted">These are your recorded days, not evidence that one caused the other.</p>
        </> : <p className="wb-muted">Log a night and a mood check-in on its wake-up date to see them together.</p>}
      </div>
      <div className="sleep-card">
        <h3>Last {nights.length} {nights.length === 1 ? 'night' : 'nights'}</h3>
        <div className="sleep-chart" role="img" aria-label="Hours slept per night">
          <span
            className="sleep-goal-line"
            style={{ bottom: `${(settings.targetHours / max) * 100}%` }}
            aria-hidden="true"
          />
          {nights.map((n) => {
            const h = duration(n.bedtime, n.wake)
            return (
              <div key={n.id} className="sleep-bar-wrap">
                <motion.span
                  className="sleep-bar"
                  data-quality={n.quality}
                  initial={prefersReducedMotion() ? false : { height: 0 }}
                  animate={{ height: `${(h / max) * 100}%` }}
                  title={`${n.date}: ${h}h`}
                />
                <small>{new Date(`${n.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</small>
              </div>
            )
          })}
        </div>
      </div>
      <div className="sleep-card">
        <h3>What affects your sleep</h3>
        {impact.length ? (
          <ul className="sleep-impact">
            {impact.map(({ factor, delta }) => (
              <li key={factor.id} data-good={delta > 0}>
                <span>
                  {factor.emoji} {factor.label}
                </span>
                <strong>
                  {delta > 0 ? '+' : ''}
                  {delta} quality
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="wb-muted">Tag a few nights with factors to compare.</p>
        )}
        <ul className="sleep-history">
          {[...entries]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map((e) => (
              <li key={e.id}>
                <span>{e.date}</span>
                <span>
                  {e.bedtime}–{e.wake} · {duration(e.bedtime, e.wake)}h {qualities[e.quality - 1]}
                </span>
                <button className="icon-button" aria-label={`Delete night ${e.date}`} onClick={() => onDelete(e.id)}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
