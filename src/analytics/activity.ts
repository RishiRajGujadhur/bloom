import { dayKey, previousDay } from '../dates'
import type { Session } from '../model'
import type { JournalEntry } from '../components/daybook/types'

export type ActivitySource = 'daybook' | 'chat'
export interface Activity {
  id: string
  source: ActivitySource
  day: string
  at: number
}
export function validDay(day: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    dayKey(new Date(`${day}T12:00:00`)) === day
  )
}
export function writtenText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(writtenText).join(' ')
  if (!value || typeof value !== 'object') return ''
  const node = value as Record<string, unknown>
  if (node.type === 'text')
    return typeof node.text === 'string' ? node.text : ''
  return writtenText(
    typeof node.type === 'string' ? node.content : Object.values(node),
  )
}
export function daybookHistory(
  entry: JournalEntry,
): { day: string; at: number }[] {
  if (entry.activity)
    return entry.activity.filter(
      (item) => validDay(item.day) && Number.isFinite(item.at),
    )
  // Only the latest saved date is recoverable from the old overwrite-per-mode format.
  const at = Date.parse(entry.updatedAt)
  return writtenText(entry.content).trim() && Number.isFinite(at)
    ? [{ at, day: dayKey(new Date(at)) }]
    : []
}
export function completedDaybook(
  next: JournalEntry,
  previous?: JournalEntry,
  now = new Date(),
): JournalEntry {
  const activity = previous ? daybookHistory(previous) : []
  const day = dayKey(now)
  if (
    writtenText(next.content).trim() &&
    !activity.some((item) => item.day === day)
  )
    activity.push({ day, at: now.getTime() })
  return { ...next, activity }
}
export function chatActivity(session: Session): Activity | null {
  const messages = session.messages.filter(
    (message) => message.sender === 'user' && message.text.trim(),
  )
  if (!session.flow.complete || !messages.length) return null
  const at =
    session.metadata.completedAt ??
    Math.max(...messages.map((message) => message.timestamp))
  if (!Number.isFinite(at)) return null
  const day = session.metadata.completedDay ?? dayKey(new Date(at))
  return validDay(day)
    ? { id: session.metadata.id, source: 'chat', at, day }
    : null
}
export function collectActivity(
  entries: JournalEntry[],
  sessions: Session[],
  today: string,
): Activity[] {
  const events: Activity[] = entries.flatMap((entry) =>
    daybookHistory(entry).map((item) => ({
      ...item,
      id: entry.id,
      source: 'daybook' as const,
    })),
  )
  for (const session of sessions) {
    const event = chatActivity(session)
    if (event) events.push(event)
  }
  return [
    ...new Map(
      events
        .filter((event) => event.day <= today)
        .map((event) => [`${event.source}:${event.id}:${event.day}`, event]),
    ).values(),
  ]
}
export function dateRange(today: string, length: number): string[] {
  const days = [today]
  while (days.length < length) days.push(previousDay(days[days.length - 1]))
  return days.reverse()
}
export function streaks(events: Activity[], today: string) {
  const days = new Set(
    events
      .map((event) => event.day)
      .filter((day) => validDay(day) && day <= today),
  )
  let cursor = days.has(today) ? today : previousDay(today),
    current = 0,
    longest = 0,
    run = 0,
    last = ''
  while (days.has(cursor)) {
    current++
    cursor = previousDay(cursor)
  }
  for (const day of [...days].sort()) {
    run = previousDay(day) === last ? run + 1 : 1
    longest = Math.max(longest, run)
    last = day
  }
  const month = [...days].filter(
    (day) => day.slice(0, 7) === today.slice(0, 7),
  ).length
  return { current, longest, month }
}
