import { subOn } from './subFeatures'
import { UrgeClocks } from './urgeClock'
import { loadSettings } from '../SettingsPage'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  CircleAlert,
  Eye,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { AppData, UrgeEvent } from '../model'
import {
  addUrgeHabit,
  buildUrgeInsight,
  calculateCorrelations,
  createUrgeEvent,
  timeBucketLabels,
  urgeContexts,
  urgeInterruptionRate,
} from './urgeEngine'
import './urge.css'

type Props = {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
}

function usePassiveContext() {
  const started = useRef(Date.now())
  const visibilityChanges = useRef(0)
  useEffect(() => {
    const changed = () => {
      visibilityChanges.current += 1
    }
    document.addEventListener('visibilitychange', changed)
    return () => document.removeEventListener('visibilitychange', changed)
  }, [])
  return () => ({
    sessionSeconds: (Date.now() - started.current) / 1000,
    visibilityChanges: visibilityChanges.current,
  })
}

export function UrgePage({ data, setData }: Props) {
  const [view, setView] = useState<'log' | 'patterns'>('log')
  const [habitId, setHabitId] = useState<string | null>(null)
  const [kind, setKind] = useState<UrgeEvent['kind'] | null>(null)
  const [intensity, setIntensity] = useState<number | null>(null)
  const [lastEvent, setLastEvent] = useState<UrgeEvent | null>(null)
  const [newHabit, setNewHabit] = useState('')
  const snapshotContext = usePassiveContext()
  const habits = data.urgeHabits.filter((habit) => !habit.archived)
  const chosenHabit = data.urgeHabits.find((habit) => habit.id === habitId)
  const step = lastEvent ? 4 : !habitId ? 1 : !intensity ? 2 : 3

  const reset = () => {
    setHabitId(null)
    setKind(null)
    setIntensity(null)
    setLastEvent(null)
  }

  const submit = (tag: string) => {
    if (!habitId || !kind || !intensity) return
    const event = createUrgeEvent(
      { habitId, kind, intensity, tags: [tag] },
      subOn('urgeTracker', 'context')
        ? snapshotContext()
        : { sessionSeconds: 0, visibilityChanges: 0 },
    )
    setData((current) => ({
      ...current,
      urgeEvents: [...current.urgeEvents, event],
    }))
    setLastEvent(event)
  }

  const addContext = (tag: string) => {
    if (!lastEvent || lastEvent.tags.includes(tag)) return
    const updated = { ...lastEvent, tags: [...lastEvent.tags, tag] }
    setLastEvent(updated)
    setData((current) => ({
      ...current,
      urgeEvents: current.urgeEvents.map((event) =>
        event.id === updated.id ? updated : event,
      ),
    }))
  }

  return (
    <section id="urge-page" className="urge-page flex flex-col gap-5">
      {loadSettings().features.urgeClock && (
        <UrgeClocks habits={habits} events={data.urgeEvents} />
      )}
      <div className="segmented urge-tabs" aria-label="Urge tracker view">
        <button aria-pressed={view === 'log'} onClick={() => setView('log')}>
          <ShieldCheck size={16} /> Interrupt & log
        </button>
        {subOn('urgeTracker', 'patterns') && (
          <button
            aria-pressed={view === 'patterns'}
            onClick={() => setView('patterns')}
          >
            <BarChart3 size={16} /> Patterns
          </button>
        )}
      </div>
      {view === 'patterns' && subOn('urgeTracker', 'patterns') ? (
        <UrgePatterns data={data} />
      ) : (
        <div className="urge-log-layout grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="card urge-logger rounded-ui-lg border border-ui-border bg-surface p-5 sm:p-6">
            <ol className="urge-progress" aria-label="Logging progress">
              {['Habit', 'Intensity', 'Context'].map((label, index) => (
                <li
                  key={label}
                  aria-current={step === index + 1 ? 'step' : undefined}
                  className={step > index + 1 ? 'complete' : ''}
                >
                  <span>
                    {step > index + 1 ? <Check size={13} /> : index + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
            {step === 1 && (
              <div className="urge-step">
                <h2>What showed up?</h2>
                <div className="urge-habit-grid">
                  {habits.map((habit) => (
                    <article key={habit.id}>
                      <strong>{habit.title}</strong>
                      <div>
                        <button
                          className="urge-choice"
                          onClick={() => {
                            setHabitId(habit.id)
                            setKind('urge')
                          }}
                        >
                          Urge
                        </button>
                        <button
                          className="slip-choice"
                          onClick={() => {
                            setHabitId(habit.id)
                            setKind('slip')
                          }}
                        >
                          Slip
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <details className="urge-manage">
                  <summary>Manage habits</summary>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      setData((current) => addUrgeHabit(current, newHabit))
                      setNewHabit('')
                    }}
                  >
                    <input
                      aria-label="New urge habit"
                      placeholder="Add a habit to interrupt"
                      maxLength={80}
                      value={newHabit}
                      onChange={(event) => setNewHabit(event.target.value)}
                      required
                    />
                    <button className="quiet-button" type="submit">
                      <Plus size={15} /> Add
                    </button>
                  </form>
                  {habits.map((habit) => (
                    <button
                      className="archive-habit"
                      key={habit.id}
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          urgeHabits: current.urgeHabits.map((item) =>
                            item.id === habit.id
                              ? { ...item, archived: true }
                              : item,
                          ),
                        }))
                      }
                    >
                      Hide {habit.title}
                    </button>
                  ))}
                </details>
              </div>
            )}
            {step === 2 && (
              <div className="urge-step">
                <button className="back-step" onClick={reset}>
                  <ArrowLeft size={15} /> Back
                </button>
                <span className={`event-kind ${kind}`}>{kind}</span>
                <h2>How strong was it?</h2>
                <p>{chosenHabit?.title}</p>
                <div className="intensity-scale" aria-label="Urge intensity">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      aria-label={`Intensity ${value} of 5`}
                      onClick={() => setIntensity(value)}
                    >
                      <strong>{value}</strong>
                      <small>
                        {
                          ['Faint', 'Mild', 'Present', 'Strong', 'Peak'][
                            value - 1
                          ]
                        }
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="urge-step">
                <button
                  className="back-step"
                  onClick={() => setIntensity(null)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <h2>What’s around this moment?</h2>
                <p>Choose the strongest signal. This tap saves the log.</p>
                <ContextGrid onChoose={submit} />
              </div>
            )}
            {lastEvent && (
              <div className="urge-saved">
                <span className="saved-mark">
                  <Check size={24} />
                </span>
                <h2>Pattern captured</h2>
                <p>
                  {kind === 'urge'
                    ? 'You noticed the chain before it took over.'
                    : 'No judgment. This data helps make the next interruption easier.'}
                </p>
                <div className="captured-context">
                  {Object.values(urgeContexts)
                    .flat()
                    .filter((tag) => !lastEvent.tags.includes(tag))
                    .map((tag) => (
                      <button key={tag} onClick={() => addContext(tag)}>
                        + {tag}
                      </button>
                    ))}
                </div>
                <button className="primary" onClick={reset}>
                  Log another <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
          <aside className="urge-privacy">
            <Eye size={18} />
            <div>
              <strong>Context, captured quietly</strong>
              <span>
                Time, day type, this app session, and tab changes stay on this
                device.
              </span>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

function ContextGrid({ onChoose }: { onChoose: (tag: string) => void }) {
  return (
    <div className="context-groups">
      {Object.entries(urgeContexts).map(([group, tags]) => (
        <fieldset key={group}>
          <legend>{group}</legend>
          <div>
            {tags.map((tag) => (
              <button key={tag} onClick={() => onChoose(tag)}>
                {tag}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

function UrgePatterns({ data }: { data: AppData }) {
  const [habitFilter, setHabitFilter] = useState('all')
  const events = useMemo(
    () =>
      habitFilter === 'all'
        ? data.urgeEvents
        : data.urgeEvents.filter((event) => event.habitId === habitFilter),
    [data.urgeEvents, habitFilter],
  )
  const correlations = calculateCorrelations(events)
  const insight = buildUrgeInsight(events)
  const rate = urgeInterruptionRate(events)
  const bucketCounts = events.reduce<Record<string, number>>(
    (counts, event) => ({
      ...counts,
      [event.timeBucket]: (counts[event.timeBucket] ?? 0) + 1,
    }),
    {},
  )
  const maxBucket = Math.max(1, ...Object.values(bucketCounts))
  const habitName = (id: string) =>
    data.urgeHabits.find((habit) => habit.id === id)?.title ?? 'Habit'

  if (!data.urgeEvents.length)
    return (
      <div className="card urge-empty rounded-ui-lg border border-ui-border bg-surface p-5 sm:p-6">
        <Activity size={34} />
        <h2>Your patterns will form here</h2>
        <p>
          Log an urge or slip to begin. A useful pattern needs repeated moments,
          not a perfect streak.
        </p>
      </div>
    )

  return (
    <div className="urge-patterns flex flex-col gap-5">
      <div className="pattern-filter">
        <label htmlFor="pattern-habit">Pattern for</label>
        <select
          id="pattern-habit"
          value={habitFilter}
          onChange={(event) => setHabitFilter(event.target.value)}
        >
          <option value="all">All habits</option>
          {data.urgeHabits.map((habit) => (
            <option value={habit.id} key={habit.id}>
              {habit.title}
            </option>
          ))}
        </select>
      </div>
      <div className="urge-stats grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="card">
          <span>Logged moments</span>
          <strong>{events.length}</strong>
        </article>
        <article className="card">
          <span>Urges caught early</span>
          <strong>{rate}%</strong>
        </article>
        <article className="card">
          <span>Top context</span>
          <strong>{correlations[0]?.tag ?? '—'}</strong>
        </article>
      </div>
      {insight ? (
        <article className="insight-card">
          <Sparkles size={20} />
          <div>
            <span>Insight · {insight.daysObserved} days</span>
            <h2>{habitName(insight.habitId)}</h2>
            <p>{insight.message}</p>
            <strong>Try this: {insight.suggestion}</strong>
          </div>
        </article>
      ) : (
        <article className="pattern-progress">
          <CircleAlert size={18} />
          <span>
            Actionable insights unlock after at least 5 logs across 7 days.
          </span>
        </article>
      )}
      <div className="pattern-grid grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card trigger-list">
          <h2>Trigger strength</h2>
          <p>How often a context was present when an episode became a slip.</p>
          {correlations.slice(0, 6).map((item) => (
            <div key={`${item.habitId}-${item.tag}`}>
              <span>
                <strong>{item.tag}</strong>
                <small>
                  {habitName(item.habitId)} · {item.observations} logs
                </small>
              </span>
              <b>{item.probability}%</b>
            </div>
          ))}
        </section>
        <section className="card time-patterns">
          <h2>Time windows</h2>
          <p>When logged episodes tend to appear.</p>
          {Object.entries(timeBucketLabels).map(([bucket, label]) => {
            const count = bucketCounts[bucket] ?? 0
            return (
              <div key={bucket}>
                <span>{label}</span>
                <i>
                  <span style={{ width: `${(count / maxBucket) * 100}%` }} />
                </i>
                <b>{count}</b>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
