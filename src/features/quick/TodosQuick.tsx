import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import * as chrono from 'chrono-node'
import { format } from 'date-fns'
import { dayKey, id, type AppData } from '../../model'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import { pageOn } from '../subFeatures'

const on = (opt: string) => pageOn('todos', opt)
type P = 'P1' | 'P2' | 'P3' | 'P4'

/** Which priorities suit a mood: high energy → hard things, low → easy wins. */
export const moodPriorities: Record<string, P[]> = {
  energised: ['P1', 'P2'],
  focused: ['P1', 'P2'],
  happy: ['P2', 'P3'],
  calm: ['P2', 'P3'],
  tired: ['P4', 'P3'],
  low: ['P4'],
  anxious: ['P4', 'P3'],
  stressed: ['P3', 'P4'],
}

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return dayKey(d)
}

/** "call mum tomorrow 5pm !1 #family" → title, due, priority, tags. */
export function parseQuickTask(text: string, ref = new Date()) {
  let rest = text
  const tags = [...rest.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase())
  rest = rest.replace(/#\w+/g, '')
  const pr = rest.match(/(?:^|\s)!([1-4])\b/)
  rest = rest.replace(/(?:^|\s)![1-4]\b/, '')
  const found = chrono.parse(rest, ref, { forwardDate: true })[0]
  if (found) rest = rest.replace(found.text, '')
  return {
    title: rest.replace(/\s+/g, ' ').trim(),
    due: found ? dayKey(found.start.date()) : dayKey(ref),
    priority: (pr ? `P${pr[1]}` : 'P3') as P,
    tags,
    when: found?.text ?? null,
  }
}

export function TodosQuick({ data, setData }: { data: AppData; setData: Dispatch<SetStateAction<AppData>> }) {
  const [mood, setMood] = useState(() => lastMood('todos'))
  const [text, setText] = useState('')
  const today = dayKey()
  const open = data.todos.filter((t) => !t.done)
  const preview = useMemo(() => (text.trim() ? parseQuickTask(text) : null), [text])
  const fit = mood && on('moodMatch') ? open.filter((t) => moodPriorities[mood]?.includes(t.priority)).slice(0, 3) : []
  const triage = open.filter((t) => t.due < today)
  const move = (taskId: string, due: string) => setData((d) => ({ ...d, todos: d.todos.map((t) => (t.id === taskId ? { ...t, due } : t)) }))
  const tagged = (taskId: string) => setData((d) => ({ ...d, todos: d.todos.map((t) => (t.id === taskId ? { ...t, tags: [...new Set([...t.tags, 'someday'])], due: format(new Date(Date.now() + 30 * 864e5), 'yyyy-MM-dd') } : t)) }))

  return (
    <QuickPanel id="todos" title="Quick plan">
      {on('naturalAdd') && (
        <form
          className="quick-add"
          onSubmit={(e) => {
            e.preventDefault()
            if (!preview?.title) return
            setData((d) => ({
              ...d,
              todos: [
                ...d.todos,
                { id: id(), title: preview.title, due: preview.due, done: false, challengeId: null, rewarded: false, priority: preview.priority, tags: preview.tags, recurrence: 'none', seriesId: null, subtasks: [] },
              ],
            }))
            setText('')
          }}
        >
          <input aria-label="Quick add" placeholder='Try "call mum tomorrow !1 #family"' value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="primary" disabled={!preview?.title}>Quick add</button>
          {preview?.title && (
            <small className="quick-note">
              “{preview.title}” · {preview.due === today ? 'today' : preview.due} · {preview.priority}
              {preview.tags.map((t) => ` #${t}`)}
            </small>
          )}
        </form>
      )}
      {on('moodMatch') && (
        <MoodGuide value={mood} onChange={(m) => { setMood(m); logMood('todos', m) }} label="Energy check — what suits you now?" />
      )}
      {fit.length > 0 && (
        <ul className="quick-done">
          {fit.map((t) => <li key={t.id}>👉 {t.title} <small>{t.priority}</small></li>)}
        </ul>
      )}
      {on('triage') && (
        <SwipeDeck
          label="Triage: keep for today or push to tomorrow"
          yes="Today"
          no="Later"
          cards={triage.map((t) => ({ id: t.id, emoji: t.priority === 'P1' ? '🔥' : '📝', title: t.title, detail: `Overdue since ${t.due}` }))}
          empty="Nothing to triage. Your day is clear."
          onSwipe={(card, yes) => {
            if (yes) move(card.id, today)
            else if (on('somedayOnNo') && (data.todos.find((t) => t.id === card.id)?.due ?? today) < today) tagged(card.id)
            else move(card.id, tomorrow())
          }}
        />
      )}
    </QuickPanel>
  )
}
