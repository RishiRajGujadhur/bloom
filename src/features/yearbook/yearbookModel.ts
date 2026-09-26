import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import type { JournalEntry } from '../../components/daybook/types'
import type { GratitudeEntry, MoodEntry } from '../wellbeing/store'

/** A printable block from TipTap JSON, keeping headings and list items. */
export type Block = { kind: 'h' | 'p' | 'li' | 'quote'; text: string }

const inline = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const n = node as { type?: string; text?: string; content?: unknown[] }
  if (n.type === 'text') return n.text ?? ''
  if (n.type === 'hardBreak') return '\n'
  return (n.content ?? []).map(inline).join('')
}

export function tiptapBlocks(value: unknown): Block[] {
  if (typeof value === 'string') return value.trim() ? [{ kind: 'p', text: value }] : []
  if (!value || typeof value !== 'object') return []
  const node = value as { type?: string; content?: unknown[] }
  switch (node.type) {
    case 'heading':
      return [{ kind: 'h', text: inline(node) }]
    case 'paragraph': {
      const text = inline(node)
      return text.trim() ? [{ kind: 'p', text }] : []
    }
    case 'listItem':
    case 'taskItem':
      return [{ kind: 'li', text: inline(node) }]
    case 'blockquote':
      return [{ kind: 'quote', text: inline(node) }]
    case undefined:
      // A Daybook page's content is a map of fields (body / prompt-0 / …).
      return Object.values(node).flatMap(tiptapBlocks)
    default:
      return (node.content ?? []).flatMap(tiptapBlocks)
  }
}

export type YearbookChapters = {
  stats: boolean
  daybook: boolean
  journal: boolean
  gratitude: boolean
  moods: boolean
}

export type YearbookData = {
  year: number
  title: string
  author: string
  stats: { label: string; value: string }[]
  daybook: { date: string; title: string; blocks: Block[] }[]
  journal: { date: string; text: string; tags: string[] }[]
  gratitude: { date: string; text: string }[]
  moodByMonth: { month: string; average: number | null }[]
}

/** Gathers everything from `year` into a book-ready structure. */
export function buildYearbook(
  data: AppData,
  daybook: JournalEntry[],
  gratitude: GratitudeEntry[],
  moods: MoodEntry[],
  year: number,
  title: string,
  author: string,
): YearbookData {
  const inYear = (date: string) => date.startsWith(String(year))
  const tasksDone = data.todos.filter(
    (t) => t.done && t.completedAt && inYear(dayKey(new Date(t.completedAt))),
  ).length
  const focus = data.rpg.focusHistory.filter((f) => inYear(dayKey(new Date(f.completedAt))))
  const checkins = data.habits.reduce((n, h) => n + h.dates.filter(inYear).length, 0)
  const pages = daybook
    .filter((e) => inYear(e.createdAt.slice(0, 10)))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const sessions = data.sessions
    .filter((s) => inYear(dayKey(new Date(s.metadata.date))))
    .sort((a, b) => a.metadata.date.localeCompare(b.metadata.date))
  const notes = gratitude.filter((g) => inYear(dayKey(new Date(g.at))))
  const months = Array.from({ length: 12 }, (_, m) => {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`
    const values = moods.filter((x) => dayKey(new Date(x.at)).startsWith(key)).map((x) => x.mood)
    return {
      month: new Date(year, m, 1).toLocaleDateString('en', { month: 'short' }),
      average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    }
  })
  return {
    year,
    title,
    author,
    stats: [
      { label: 'Daybook pages', value: String(pages.length) },
      { label: 'Journal entries', value: String(sessions.length) },
      { label: 'Habit check-ins', value: String(checkins) },
      { label: 'Tasks completed', value: String(tasksDone) },
      { label: 'Focus minutes', value: String(focus.reduce((n, f) => n + f.minutes, 0)) },
      { label: 'Good things noted', value: String(notes.length) },
    ],
    daybook: pages.map((p) => ({
      date: p.createdAt.slice(0, 10),
      title: p.modeTitle,
      blocks: tiptapBlocks(p.content),
    })),
    journal: sessions.map((s) => ({
      date: dayKey(new Date(s.metadata.date)),
      text: s.messages
        .filter((m) => m.sender === 'user')
        .map((m) => m.text)
        .join('\n\n'),
      tags: s.metadata.tags,
    })),
    gratitude: notes.map((g) => ({ date: dayKey(new Date(g.at)), text: g.text })),
    moodByMonth: months,
  }
}
