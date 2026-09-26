import { subOn } from '../subFeatures'
import { useMemo, useState } from 'react'
import { QueryBuilder, type Field, type RuleGroupType } from 'react-querybuilder'
import 'react-querybuilder/dist/query-builder.css'
import { BookOpen, NotebookPen, Smile } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import type { JournalEntry } from '../../components/daybook/types'
import { MOOD_KEY, type MoodEntry } from '../wellbeing/store'
import { buildRecords, evaluateGroup, type RuleGroup } from './exploreModel'
import './explore.css'

function readJson<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

const textOps = [
  { name: 'contains', label: 'contains' },
  { name: 'doesNotContain', label: 'does not contain' },
  { name: '=', label: 'is' },
]
const numberOps = [
  { name: '>=', label: '≥' },
  { name: '<=', label: '≤' },
  { name: '=', label: '=' },
  { name: '>', label: '>' },
  { name: '<', label: '<' },
]
const isOps = [
  { name: '=', label: 'is' },
  { name: '!=', label: 'is not' },
]
const presets: { label: string; query: RuleGroupType }[] = [
  {
    label: 'Good-mood Fridays',
    query: {
      combinator: 'and',
      rules: [
        { field: 'weekday', operator: '=', value: 'Friday' },
        { field: 'mood', operator: '>=', value: 4 },
      ],
    },
  },
  {
    label: 'Hard days',
    query: { combinator: 'and', rules: [{ field: 'mood', operator: '<=', value: 2 }] },
  },
  {
    label: 'Mentions of work or sleep',
    query: {
      combinator: 'or',
      rules: [
        { field: 'text', operator: 'contains', value: 'work' },
        { field: 'text', operator: 'contains', value: 'sleep' },
      ],
    },
  },
]

/**
 * A visual "data scientist" query builder over every journal, Daybook page
 * and mood check-in, joined with the habits completed that day.
 */
export function ExplorePage({ data }: FeaturePageProps) {
  const records = useMemo(
    () => buildRecords(data, readJson<JournalEntry>(DAYBOOK_STORAGE_KEY), readJson<MoodEntry>(MOOD_KEY)),
    [data],
  )
  const modes = useMemo(() => [...new Set(records.map((r) => r.mode))], [records])
  const fields: Field[] = useMemo(
    () => [
      { name: 'text', label: 'Words', operators: textOps, placeholder: 'e.g. grateful' },
      { name: 'mood', label: 'Mood (1–5)', inputType: 'number', operators: numberOps, defaultValue: 4 },
      {
        name: 'type',
        label: 'Kind',
        valueEditorType: 'select',
        operators: isOps,
        values: [
          { name: 'journal', label: 'Guided journal' },
          { name: 'daybook', label: 'Daybook page' },
          { name: 'mood', label: 'Mood check-in' },
        ],
        defaultValue: 'daybook',
      },
      {
        name: 'mode',
        label: 'Mode',
        valueEditorType: 'select',
        operators: isOps,
        values: modes.map((m) => ({ name: m, label: m })),
        defaultValue: modes[0] ?? '',
      },
      {
        name: 'weekday',
        label: 'Weekday',
        valueEditorType: 'select',
        operators: isOps,
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => ({
          name: d,
          label: d,
        })),
        defaultValue: 'Monday',
      },
      { name: 'date', label: 'Date', inputType: 'date', operators: numberOps.slice(0, 2) },
      {
        name: 'habit',
        label: 'Habit done that day',
        valueEditorType: 'select',
        operators: [
          { name: 'contains', label: 'includes' },
          { name: 'doesNotContain', label: 'excludes' },
        ],
        values: data.habits.map((h) => ({ name: h.title, label: h.title })),
        defaultValue: data.habits[0]?.title ?? '',
      },
      { name: 'tags', label: 'Tag or emotion', operators: textOps.slice(0, 2), placeholder: 'e.g. grateful' },
    ],
    [modes, data.habits],
  )
  const [query, setQuery] = useState<RuleGroupType>({
    combinator: 'and',
    rules: [{ field: 'mood', operator: '>=', value: 4 }],
  })
  const results = records.filter((r) => evaluateGroup(r, query as unknown as RuleGroup))
  const avgMood = (() => {
    const moods = results.map((r) => r.mood).filter((m): m is number => m !== null)
    return moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : '—'
  })()

  return (
    <section className="explore-page" aria-label="Explore your data">
      <div className="explore-presets filter-chips" aria-label="Example questions" hidden={!subOn('queryBuilder', 'presets')}>
        {presets.map((p) => (
          <button key={p.label} onClick={() => setQuery(p.query)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="explore-builder">
        <QueryBuilder
          fields={fields.filter(
            (f) =>
              (f.name !== 'habit' || subOn('queryBuilder', 'habitField')) &&
              (f.name !== 'tags' || subOn('queryBuilder', 'tagsField')) &&
              (f.name !== 'date' || subOn('queryBuilder', 'dateField')),
          )}
          query={query}
          onQueryChange={setQuery}
          controlClassnames={{ queryBuilder: 'queryBuilder-branches' }}
          controlElements={subOn('queryBuilder', 'groups') ? undefined : { addGroupAction: () => null }}
          translations={{
            addRule: { label: '+ Rule', title: 'Add rule' },
            addGroup: { label: '+ Group', title: 'Add group' },
          }}
        />
      </div>
      <div className="explore-results">
        <header>
          <strong>
            {results.length} of {records.length} entries match
          </strong>
          {subOn('queryBuilder', 'moodAverage') && <span>Average mood {avgMood}</span>}
        </header>
        <ul>
          {results.slice(0, 60).map((r) => (
            <li key={r.id}>
              <span className="explore-icon" aria-hidden="true">
                {r.type === 'daybook' ? <NotebookPen size={16} /> : r.type === 'mood' ? <Smile size={16} /> : <BookOpen size={16} />}
              </span>
              <span className="explore-main">
                <strong>{r.mode}</strong>
                <small>{r.text.slice(0, 140) || 'No text'}</small>
              </span>
              <span className="explore-meta">
                {r.weekday.slice(0, 3)} {r.date}
                {r.mood !== null && <b>mood {r.mood}</b>}
              </span>
            </li>
          ))}
        </ul>
        {!results.length && <p className="wb-muted">No entries match. Loosen a rule or switch AND to OR.</p>}
      </div>
    </section>
  )
}
