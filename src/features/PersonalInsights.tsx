import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { AppData } from '../model'
import { dayKey } from '../dates'
import { CardRail, Disclosure } from '../components/BloomExperience'
import { activityDays, memories, type ActivityDay } from './insights'
import './insights.css'

type Metric = 'tasks' | 'focus' | 'journals' | 'habits' | 'mood'
const labels: Record<Metric, string> = {
  tasks: 'Tasks',
  focus: 'Focus minutes',
  journals: 'Journaling',
  habits: 'Habits',
  mood: 'Mood',
}

export function PersonalInsights({
  data,
  setData,
  initialView = 'insights',
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  initialView?: 'insights' | 'memories'
}) {
  const [view, setView] = useState(initialView)
  const [metric, setMetric] = useState<Metric>('tasks')
  const [date, setDate] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [month, setMonth] = useState(dayKey().slice(0, 7))
  const days = useMemo(() => activityDays(data), [data])
  const events = useMemo(() => memories(data), [data])
  const today = dayKey()
  const dayMap = new Map(days.map((d) => [d.date, d]))
  const cells = Array.from({ length: 91 }, (_, i) => {
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() - 90 + i)
    return dayKey(d)
  })
  const cutoff = cells[cells.length - 7]
  const previousCutoff = cells[cells.length - 14]
  const total = (items: ActivityDay[], key: Exclude<Metric, 'mood'>) =>
    items.reduce((sum, d) => sum + d[key], 0)
  const recent = days.filter((d) => d.date >= cutoff && d.date <= today)
  const previous = days.filter(
    (d) => d.date >= previousCutoff && d.date < cutoff,
  )
  const filtered = events.filter(
    (e) =>
      (!date || e.date === date) &&
      (!savedOnly || data.savedMemories?.includes(e.id)),
  )
  const selected = dayMap.get(date)
  const monthDays = days.filter((d) => d.date.startsWith(month))
  const record = [...days].sort((a, b) => b.focus - a.focus)[0]
  const journalRecord = [...days].sort((a, b) => b.journals - a.journals)[0]
  const rhythm = new Map<string, number>()
  data.rpg.focusHistory.forEach((s) => {
    const label = new Date(s.completedAt).toLocaleDateString(undefined, {
      weekday: 'long',
    })
    rhythm.set(label, (rhythm.get(label) ?? 0) + s.minutes)
  })
  const favorite = [...rhythm].sort((a, b) => b[1] - a[1])[0]
  const openDay = (value: string) => {
    setDate(value)
    setPage(0)
    setSavedOnly(false)
    setView('memories')
  }
  return (
    <section
      className="personal-insights"
      aria-label="Personal insights and memories"
    >
      <header className="insight-heading">
        <div>
          <span className="bloom-kicker">SMALL STEPS, A BIGGER PICTURE</span>
          <h2>
            {view === 'insights' ? 'Personal Insights' : 'Memory Timeline'}
          </h2>
          <p>
            {view === 'insights'
              ? 'Discover your rhythm through the moments you record.'
              : 'What happened, how it felt, and what you want to keep.'}
          </p>
        </div>
        <div className="insight-switch bloom-controls">
          <button
            aria-pressed={view === 'insights'}
            onClick={() => setView('insights')}
          >
            Insights
          </button>
          <button
            aria-pressed={view === 'memories'}
            onClick={() => setView('memories')}
          >
            Memories
          </button>
        </div>
      </header>
      {view === 'insights' ? (
        <>
          <CardRail label="Your week in perspective">
            {(['tasks', 'focus', 'journals', 'habits'] as const).map((key) => {
              const current = total(recent, key),
                old = total(previous, key)
              return (
                <article className="insight-stat bloom-stack" key={key}>
                  <span>{labels[key]}</span>
                  <strong>{current}</strong>
                  <small>
                    {old
                      ? `${current >= old ? '+' : ''}${Math.round(((current - old) / old) * 100)}% vs previous 7 days`
                      : 'No activity in the previous 7 days'}
                  </small>
                </article>
              )
            })}
          </CardRail>
          <section className="insight-panel">
            <div className="insight-heading">
              <div>
                <h3>Your activity, day by day</h3>
                <p>Past 13 weeks · Select a day to open its memories.</p>
              </div>
              <label>
                Show{' '}
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as Metric)}
                >
                  {Object.entries(labels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="heatmap">
              {cells.map((key) => {
                const value = dayMap.get(key)?.[metric] ?? 0
                const intensity =
                  value === 0
                    ? 0
                    : metric === 'focus'
                      ? Math.min(4, Math.ceil(value / 25))
                      : Math.min(4, Math.ceil(value))
                return (
                  <button
                    key={key}
                    data-intensity={intensity}
                    title={`${key}: ${value ? Math.round(value * 10) / 10 : 'No recorded'} ${labels[metric]}`}
                    aria-label={`${key}: ${value || 'No recorded'} ${labels[metric]}. View memories`}
                    onClick={() => openDay(key)}
                  />
                )
              })}
            </div>
            <div className="heatmap-legend">
              <span>{cells[0]}</span>
              <span>Less ░ ▒ ▓ More</span>
              <span>{today}</span>
            </div>
            <p className="insight-note">
              Tasks use actual completion dates recorded from this update
              onward. Older undated completions are excluded. Mood is the daily
              journal average (1–5). Meditation history is not recorded yet.
            </p>
          </section>
          <CardRail label="Discover your rhythm">
            <article className="insight-panel">
              <h3>Your rhythm</h3>
              <strong className="insight-value">
                {favorite?.[0] ?? 'Still taking shape'}
              </strong>
              <p>
                {favorite
                  ? `${favorite[1]} focus minutes recorded on this weekday across your history.`
                  : 'Complete focus sessions to discover your most active weekday.'}
              </p>
              <small>
                Describes recorded activity, not a measure of wellbeing.
              </small>
            </article>
            <article className="insight-panel">
              <h3>Personal records</h3>
              <strong className="insight-value">
                {record?.focus ? `${record.focus} min` : 'Your first is ahead'}
              </strong>
              <p>
                {record?.focus
                  ? `Most focused day · ${record.date}`
                  : 'Your longest focus day will appear here.'}
              </p>
              <p>
                {journalRecord?.journals
                  ? `Most reflections in a day: ${journalRecord.journals} · ${journalRecord.date}`
                  : 'Your reflection records will grow with you.'}
              </p>
              {record?.focus ? (
                <button onClick={() => openDay(record.date)}>
                  Revisit this day →
                </button>
              ) : null}
            </article>
          </CardRail>
          <Disclosure title="Planned vs done · Last 7 days">
            <p className="insight-note">
              Tasks grouped by their current due date. Done means completed now,
              including late completions; this is not a historical planning
              snapshot.
            </p>
            {cells.slice(-7).map((key) => {
              const tasks = data.todos.filter((t) => t.due === key),
                done = tasks.filter((t) => t.done).length
              return (
                <div className="planning-comparison" key={key}>
                  <span>{key.slice(5)}</span>
                  <progress
                    value={done}
                    max={tasks.length || 1}
                    aria-label={`${key}: ${done} done of ${tasks.length} planned`}
                  />
                  <span>
                    {done} / {tasks.length}
                  </span>
                </div>
              )
            })}
          </Disclosure>
          <Disclosure title="Your monthly story">
            <label>
              Choose month{' '}
              <input
                type="month"
                value={month}
                max={today.slice(0, 7)}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <CardRail label={`${month} in Bloom`}>
              {(['tasks', 'focus', 'journals', 'habits'] as const).map(
                (key) => (
                  <article className="insight-stat bloom-stack" key={key}>
                    <span>{labels[key]}</span>
                    <strong>{total(monthDays, key)}</strong>
                    <small>Recorded in {month}</small>
                  </article>
                ),
              )}
            </CardRail>
            {!monthDays.length && (
              <p>No recorded activity for this month yet.</p>
            )}
          </Disclosure>
        </>
      ) : (
        <>
          <div className="memory-filters bloom-controls">
            <label>
              Day{' '}
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setPage(0)
                }}
              />
            </label>
            <button
              onClick={() => {
                setDate('')
                setPage(0)
              }}
            >
              All dates
            </button>
            <button
              aria-pressed={savedOnly}
              onClick={() => {
                setSavedOnly(!savedOnly)
                setPage(0)
              }}
            >
              Saved memories
            </button>
          </div>
          {selected && (
            <p className="day-summary">
              That day: {selected.tasks} tasks · {selected.focus} focus min ·{' '}
              {selected.journals} reflections · {selected.habits} habits
              {selected.mood !== null
                ? ` · Mood ${selected.mood.toFixed(1)}/5`
                : ''}
            </p>
          )}
          {!date &&
            events.some(
              (e) => e.date < today && e.date.slice(5) === today.slice(5),
            ) && (
              <Disclosure title="On this day" open>
                {events
                  .filter(
                    (e) => e.date < today && e.date.slice(5) === today.slice(5),
                  )
                  .map((e) => (
                    <p key={e.id}>
                      {e.date} · {e.title}
                    </p>
                  ))}
              </Disclosure>
            )}
          <div className="memory-timeline">
            {filtered.slice(page * 6, page * 6 + 6).map((event) => (
              <article key={event.id} className="memory-item">
                <div>
                  <time dateTime={event.date}>{event.date}</time>
                  <span>{event.kind}</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.detail}</p>
                <button
                  aria-pressed={!!data.savedMemories?.includes(event.id)}
                  onClick={() =>
                    setData((current) => ({
                      ...current,
                      savedMemories: current.savedMemories?.includes(event.id)
                        ? current.savedMemories.filter((id) => id !== event.id)
                        : [...(current.savedMemories ?? []), event.id],
                    }))
                  }
                >
                  {data.savedMemories?.includes(event.id)
                    ? '★ Saved'
                    : '☆ Save memory'}
                </button>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <p className="insight-panel">
              No memories here yet. Journal, finish a task, or complete a focus
              session to leave a trace.
            </p>
          )}
          {filtered.length > 6 && (
            <div className="memory-filters bloom-controls">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span role="status">
                Page {page + 1} of {Math.ceil(filtered.length / 6)}
              </span>
              <button
                disabled={(page + 1) * 6 >= filtered.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
