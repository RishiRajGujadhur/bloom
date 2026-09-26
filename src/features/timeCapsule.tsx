import { subOn } from './subFeatures'
import { Hourglass, Shuffle } from 'lucide-react'
import { useState } from 'react'
import type { AppData } from '../model'
import { dayKey } from '../dates'
import { journalText } from '../search/db'
import { DAYBOOK_STORAGE_KEY } from '../components/daybook/storage'
import type { JournalEntry } from '../components/daybook/types'
import { GRATITUDE_KEY, type GratitudeEntry } from './wellbeing/store'
import { OverviewCard } from '../components/dashboard/Overview'

export type Capsule = {
  kind: 'year' | 'month' | 'week' | 'gratitude'
  label: string
  date: string
  title: string
  text: string
}
type Memory = { date: string; title: string; text: string }

const shift = (today: string, days = 0, months = 0, years = 0) => {
  const d = new Date(`${today}T12:00:00`)
  d.setFullYear(d.getFullYear() - years)
  d.setMonth(d.getMonth() - months)
  d.setDate(d.getDate() - days)
  return dayKey(d)
}

/** Deterministic per-day pick so the capsule doesn't change on every render. */
const daySeed = (today: string, salt = 0) =>
  [...today].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7 + salt)

/**
 * Chooses today's capsule: a memory from exactly a year, a month or a week ago
 * (in that order), otherwise a random note from the gratitude jar.
 */
export function pickCapsule(
  memories: Memory[],
  gratitude: GratitudeEntry[],
  today: string,
  salt = 0,
  options = { onThisDay: true, gratitude: true },
): Capsule | null {
  const windows = [
    { kind: 'year' as const, label: 'One year ago today', date: shift(today, 0, 0, 1) },
    { kind: 'month' as const, label: 'One month ago today', date: shift(today, 0, 1) },
    { kind: 'week' as const, label: 'One week ago', date: shift(today, 7) },
  ]
  for (const w of options.onThisDay ? windows : []) {
    const found = memories.filter((m) => m.date === w.date && m.text.trim())
    if (found.length) {
      const m = found[daySeed(today, salt) % found.length]
      return { kind: w.kind, label: w.label, date: m.date, title: m.title, text: m.text }
    }
  }
  if (!gratitude.length || !options.gratitude) return null
  const note = gratitude[daySeed(today, salt) % gratitude.length]
  return {
    kind: 'gratitude',
    label: 'From your gratitude jar',
    date: dayKey(new Date(note.at)),
    title: 'A good thing',
    text: note.text,
  }
}

function readJson<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

export function collectMemories(data: AppData): Memory[] {
  const daybook = readJson<JournalEntry>(DAYBOOK_STORAGE_KEY).map((e) => ({
    date: e.createdAt.slice(0, 10),
    title: e.modeTitle,
    text: journalText(e.content).trim(),
  }))
  const chats = data.sessions.map((s) => ({
    date: dayKey(new Date(s.metadata.date)),
    title: 'Guided journal',
    text: s.messages
      .filter((m) => m.sender === 'user')
      .map((m) => m.text)
      .join(' '),
  }))
  return [...daybook, ...chats]
}

export function TimeCapsuleCard({ data, today }: { data: AppData; today: string }) {
  const [salt, setSalt] = useState(0)
  const capsule = pickCapsule(collectMemories(data), readJson<GratitudeEntry>(GRATITUDE_KEY), today, salt, {
    onThisDay: subOn('timeCapsule', 'onThisDay'),
    gratitude: subOn('timeCapsule', 'gratitude'),
  })
  const morning = new Date().getHours() < 12
  return (
    <OverviewCard
      icon={Hourglass}
      tone="sun"
      title={morning ? 'Good morning, from the past' : 'Time capsule'}
      labelledBy="ov-capsule"
      className="ov-capsule"
      action={
        capsule && subOn('timeCapsule', 'shuffle') ? (
          <button className="icon-button" aria-label="Another memory" onClick={() => setSalt((s) => s + 1)}>
            <Shuffle size={16} />
          </button>
        ) : undefined
      }
    >
      {capsule ? (
        <figure className="capsule-body">
          <figcaption>
            <span>{capsule.label}</span>
            <small>
              {capsule.title} · {new Date(`${capsule.date}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </small>
          </figcaption>
          <blockquote>“{capsule.text.length > 220 ? `${capsule.text.slice(0, 220)}…` : capsule.text}”</blockquote>
        </figure>
      ) : (
        <p className="ov-muted">
          Write a little each day. Your capsule opens with memories from a week, a month and a year ago.
        </p>
      )}
    </OverviewCard>
  )
}
