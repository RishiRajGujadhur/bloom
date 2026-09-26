import { subOn } from './subFeatures'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Hourglass, Trophy } from 'lucide-react'
import type { AppData } from '../model'
import './urgeClock.css'

type UrgeEvent = AppData['urgeEvents'][number]
type UrgeHabit = AppData['urgeHabits'][number]

/**
 * Elapsed-time engine for the urge tracker. The clock runs from the latest
 * slip (or, before any slip, from the first time the habit was logged). The
 * best streak is the longest gap between consecutive slips, including the
 * current run — beating it is the high score.
 */
export function urgeClockStats(events: UrgeEvent[], habitId: string, now: number) {
  const mine = events
    .filter((e) => e.habitId === habitId)
    .sort((a, b) => a.timestamp - b.timestamp)
  if (!mine.length) return null
  const slips = mine.filter((e) => e.kind === 'slip').map((e) => e.timestamp)
  const start = slips.length ? slips[slips.length - 1] : mine[0].timestamp
  const current = Math.max(0, now - start)
  const anchors = [mine[0].timestamp, ...slips]
  let best = current
  for (let i = 1; i < anchors.length; i++) best = Math.max(best, anchors[i] - anchors[i - 1])
  const resisted = mine.filter((e) => e.kind === 'urge' && e.timestamp >= start).length
  return { start, current, best, isRecord: current >= best && slips.length > 0, resisted, slips: slips.length }
}

export function splitDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function UrgeClocks({ habits, events }: { habits: UrgeHabit[]; events: UrgeEvent[] }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const clocks = habits
    .map((habit) => ({ habit, stats: urgeClockStats(events, habit.id, now) }))
    .filter((c) => c.stats)
  if (!clocks.length) return null
  return (
    <section className="urge-clocks" aria-label="Time since last slip">
      {clocks.map(({ habit, stats }) => {
        const t = splitDuration(stats!.current)
        const best = splitDuration(stats!.best)
        const progress = Math.min(1, stats!.current / Math.max(stats!.best, 1))
        return (
          <article key={habit.id} className="urge-clock" data-record={stats!.isRecord}>
            <header>
              <Hourglass size={16} aria-hidden="true" />
              <strong>{habit.title}</strong>
              {stats!.isRecord && subOn('urgeClock', 'highScore') && (
                <motion.span className="urge-record" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                  <Trophy size={13} aria-hidden="true" /> New best
                </motion.span>
              )}
            </header>
            <div className="urge-digits" aria-label={`${t.days} days ${t.hours} hours ${t.minutes} minutes`}>
              {(
                [
                  [t.days, 'd'],
                  [t.hours, 'h'],
                  [t.minutes, 'm'],
                  [t.seconds, 's'],
                ] as const
              )
                .filter(([, unit]) => unit !== 's' || subOn('urgeClock', 'seconds'))
                .map(([value, unit]) => (
                <span key={unit}>
                  <b>{unit === 'd' ? value : pad(value)}</b>
                  <small>{unit}</small>
                </span>
              ))}
            </div>
            <div className="urge-best-track" aria-hidden="true">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
            <p hidden={!subOn('urgeClock', 'highScore')}>
              Best {best.days}d {best.hours}h {best.minutes}m
              {subOn('urgeClock', 'resisted') && ` · ${stats!.resisted} urges resisted this run`}
            </p>
          </article>
        )
      })}
    </section>
  )
}
