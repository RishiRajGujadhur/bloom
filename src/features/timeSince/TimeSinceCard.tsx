import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useMemo, useState } from 'react'
import FlipNumbersModule from 'react-flip-numbers'
import { format } from 'date-fns'
import { Plus, Timer, Trash2, X } from 'lucide-react'
import type { AppData } from '../../model'
import { OverviewCard } from '../../components/dashboard/Overview'
import { useStoredList } from '../wellbeing/store'
import { subOn } from '../subFeatures'
import { urgeClockStats } from '../urgeClock'
import { TIME_SINCE_KEY, counterParts, flapString, type Counter } from './timeSinceModel'
import './timeSince.css'

// The package ships CommonJS; under Vite the default export can arrive wrapped.
const FlipNumbers = ((FlipNumbersModule as unknown as { default?: typeof FlipNumbersModule }).default ??
  FlipNumbersModule) as typeof FlipNumbersModule

/** One counter row: a train-station split-flap board (or plain digits). */
function Board({ counter, now, removable, onRemove }: { counter: Counter; now: number; removable: boolean; onRemove: () => void }) {
  const parts = counterParts(counter, now)
  const numbers = flapString(parts)
  const reduced =
    typeof window !== 'undefined' && prefersReducedMotion()
  const flap = subOn('timeSince', 'splitFlap') && !reduced
  return (
    <li className="ts-row bloom-stack" data-kind={counter.kind}>
      <div className="ts-label">
        <span aria-hidden="true">{counter.emoji}</span>
        <strong>{counter.label}</strong>
        <small>
          {counter.kind === 'since' ? 'since' : parts.done ? 'arrived' : 'until'}{' '}
          {format(counter.at, 'd MMM yyyy')}
        </small>
        {removable && (
          <button className="icon-button" aria-label={`Remove ${counter.label}`} onClick={onRemove}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div
        className="ts-board"
        role="timer"
        aria-label={`${parts.days} days ${parts.hours} hours ${parts.minutes} minutes`}
      >
        {flap ? (
          <FlipNumbers
            height={30}
            width={20}
            color="#fff7ea"
            background="#1d1a26"
            play
            perspective={300}
            duration={0.6}
            numbers={numbers}
            nonNumberStyle={{ color: '#ffb37a', fontSize: 22, margin: '0 1px' }}
          />
        ) : (
          <span className="ts-plain">{numbers}</span>
        )}
        <span className="ts-units" aria-hidden="true">
          <i>days</i>
          <i>hrs</i>
          <i>min</i>
          <i>sec</i>
        </span>
      </div>
    </li>
  )
}

/**
 * "Time since" dashboard module: live counters for anything you care about —
 * days since a fresh start, time since the last slip, or a countdown to a
 * big day — shown on retro split-flap boards that flip every second.
 */
export function TimeSinceCard({ data }: { data: AppData }) {
  const [counters, setCounters] = useStoredList<Counter>(TIME_SINCE_KEY)
  const [now, setNow] = useState(() => Date.now())
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ label: '', emoji: '⏳', date: format(Date.now(), "yyyy-MM-dd'T'HH:mm"), kind: 'since' as Counter['kind'] })
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const derived = useMemo<Counter[]>(() => {
    const list: Counter[] = subOn('timeSince', 'withBloom')
      ? [{ id: 'bloom', label: 'With Bloom', emoji: '🌸', at: data.rpg.createdAt, kind: 'since' }]
      : []
    if (subOn('timeSince', 'urgeLink'))
      for (const habit of data.urgeHabits.filter((h) => !h.archived)) {
        const stats = urgeClockStats(data.urgeEvents, habit.id, Date.now())
        if (stats?.slips) list.push({ id: `urge-${habit.id}`, label: `Free from ${habit.title.toLowerCase()}`, emoji: '🛡️', at: stats.start, kind: 'since' })
      }
    return list
  }, [data.rpg.createdAt, data.urgeHabits, data.urgeEvents])
  const mine = subOn('timeSince', 'custom')
    ? counters.filter((c) => c.kind === 'since' || subOn('timeSince', 'countdowns'))
    : []
  const all = [...mine, ...derived]
  return (
    <OverviewCard
      icon={Timer}
      tone="sage"
      title="Time since"
      labelledBy="ov-time-since"
      className="ov-time-since"
      action={
        subOn('timeSince', 'custom') && <button className="icon-button" aria-label={adding ? 'Cancel' : 'Add a counter'} onClick={() => setAdding((a) => !a)}>
          {adding ? <X size={16} /> : <Plus size={16} />}
        </button>
      }
    >
      {adding && (
        <form
          className="ts-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!draft.label.trim()) return
            setCounters((list) => [
              ...list,
              { id: crypto.randomUUID(), label: draft.label.trim(), emoji: draft.emoji || '⏳', at: new Date(draft.date).getTime(), kind: draft.kind },
            ])
            setAdding(false)
            setDraft((d) => ({ ...d, label: '' }))
          }}
        >
          <input aria-label="Emoji" className="ts-emoji" value={draft.emoji} maxLength={4} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} />
          <input aria-label="Label" placeholder="e.g. Apartment handover" value={draft.label} maxLength={40} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          {subOn('timeSince', 'countdowns') && (
            <DropdownSelect aria-label="Direction" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Counter['kind'] })}>
              <option value="since">Since</option>
              <option value="until">Until</option>
            </DropdownSelect>
          )}
          <input aria-label="Date and time" type="datetime-local" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          <button className="ov-primary" type="submit">
            Add
          </button>
        </form>
      )}
      <ul className="ts-list bloom-list">
        {all.slice(0, 5).map((counter) => (
          <Board
            key={counter.id}
            counter={counter}
            now={now}
            removable={counters.some((c) => c.id === counter.id)}
            onRemove={() => setCounters((list) => list.filter((c) => c.id !== counter.id))}
          />
        ))}
      </ul>
    </OverviewCard>
  )
}
