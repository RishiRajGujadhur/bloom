import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { journalText } from '../../search/db'
import type { JournalEntry } from '../../components/daybook/types'
import type { MoodEntry } from '../wellbeing/store'

/** One searchable row, whatever it came from. */
export type ExploreRecord = {
  id: string
  type: 'journal' | 'daybook' | 'mood'
  date: string
  weekday: string
  mood: number | null
  mode: string
  tags: string[]
  text: string
  habits: string[]
}

const weekdayOf = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en', { weekday: 'long' })

/** Journal, Daybook and mood entries joined with the habits done that day. */
export function buildRecords(
  data: AppData,
  daybook: JournalEntry[],
  moods: MoodEntry[],
): ExploreRecord[] {
  const habitsOn = (date: string) =>
    data.habits.filter((h) => h.dates.includes(date)).map((h) => h.title)
  const make = (r: Omit<ExploreRecord, 'weekday' | 'habits'>): ExploreRecord => ({
    ...r,
    weekday: weekdayOf(r.date),
    habits: habitsOn(r.date),
  })
  return [
    ...data.sessions.map((s) =>
      make({
        id: `journal:${s.metadata.id}`,
        type: 'journal',
        date: dayKey(new Date(s.metadata.date)),
        mood: s.metadata.mood,
        mode: s.metadata.entryType === 'micro' ? 'Quick entry' : 'Guided journal',
        tags: s.metadata.tags,
        text: s.messages
          .filter((m) => m.sender === 'user')
          .map((m) => m.text)
          .join(' '),
      }),
    ),
    ...daybook.map((e) =>
      make({
        id: `daybook:${e.id}`,
        type: 'daybook',
        date: e.createdAt.slice(0, 10),
        mood: null,
        mode: e.modeTitle,
        tags: [],
        text: journalText(e.content),
      }),
    ),
    ...moods.map((m) =>
      make({
        id: `mood:${m.id}`,
        type: 'mood',
        date: dayKey(new Date(m.at)),
        mood: m.mood,
        mode: 'Mood check-in',
        tags: m.emotions ?? [],
        text: m.note,
      }),
    ),
  ].sort((a, b) => b.date.localeCompare(a.date))
}

/* ---- Query evaluation (react-querybuilder JSON) ------------------------- */
export type Rule = { field: string; operator: string; value: unknown }
export type RuleGroup = { combinator: string; not?: boolean; rules: (Rule | RuleGroup)[] }

const isGroup = (r: Rule | RuleGroup): r is RuleGroup => 'rules' in r

function fieldValue(record: ExploreRecord, field: string): unknown {
  switch (field) {
    case 'habit':
      return record.habits
    case 'tags':
      return record.tags
    default:
      return record[field as keyof ExploreRecord]
  }
}

function evaluateRule(record: ExploreRecord, rule: Rule): boolean {
  const actual = fieldValue(record, rule.field)
  const expected = rule.value
  const text = (v: unknown) => String(v ?? '').toLowerCase()
  if (Array.isArray(actual)) {
    const has = actual.some((a) => text(a) === text(expected) || text(a).includes(text(expected)))
    if (rule.operator === 'contains' || rule.operator === '=') return has
    if (rule.operator === 'doesNotContain' || rule.operator === '!=') return !has
    return false
  }
  // An empty value matches everything, so half-built rules don't hide all results.
  if (expected === '' || expected === undefined || expected === null) return true
  const n = Number(actual)
  const m = Number(expected)
  switch (rule.operator) {
    case '=':
      return text(actual) === text(expected)
    case '!=':
      return text(actual) !== text(expected)
    case '<':
      return actual !== null && (typeof actual === 'string' && isNaN(n) ? text(actual) < text(expected) : n < m)
    case '>':
      return actual !== null && (typeof actual === 'string' && isNaN(n) ? text(actual) > text(expected) : n > m)
    case '<=':
      return actual !== null && (typeof actual === 'string' && isNaN(n) ? text(actual) <= text(expected) : n <= m)
    case '>=':
      return actual !== null && (typeof actual === 'string' && isNaN(n) ? text(actual) >= text(expected) : n >= m)
    case 'contains':
      return text(actual).includes(text(expected))
    case 'doesNotContain':
      return !text(actual).includes(text(expected))
    case 'beginsWith':
      return text(actual).startsWith(text(expected))
    default:
      return true
  }
}

export function evaluateGroup(record: ExploreRecord, group: RuleGroup): boolean {
  const results = group.rules.map((r) => (isGroup(r) ? evaluateGroup(record, r) : evaluateRule(record, r)))
  const outcome =
    results.length === 0
      ? true
      : group.combinator === 'or'
        ? results.some(Boolean)
        : results.every(Boolean)
  return group.not ? !outcome : outcome
}
