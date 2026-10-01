import { useTabTitle } from '../utils/useTabTitle'
import { PixelSprite } from './juice/PixelJuice'
import { pickSprite } from './juice/sprites'
import { loadSettings } from '../SettingsPage'
import { subOn } from './subFeatures'
import { CardRail } from '../components/BloomExperience'
import { useEffect, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import {
  Check,
  LibraryBig,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  SkipForward,
  X,
  Flame,
  Timer,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { dayKey, id, toggleHabit } from '../model'
import type { AppData } from '../model'
import { inferStat } from '../rpg/schema'
import { Modal } from '../components/Modal'
import { HabitLibrary, RoutineLibrary } from './AdoptLibrary'
import { burst, streakMilestone } from '../components/ui/celebrate'
import { ReminderButton } from './reminders/ReminderCenter'
import { gridDays, habitStats } from './habits'
import './habits.css'
import { HabitsQuick } from './quick/HabitsQuick'
import { StickerBook } from './showcase/StickerBook'

import { Archive, ArchiveRestore, ChevronLeft, ChevronRight } from 'lucide-react'
import { move, ordered, strength, useHabitExtras } from './habits/habitExtras'
import './habits/habitExtras.css'

type Habit = AppData['habits'][number]
type Routine = NonNullable<AppData['routines']>[number]
const colors = ['#16866b', '#cb5476', '#3788bd', '#bd791b', '#855abe']
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
type Run = {
  routine: Routine
  index: number
  remaining: number
  deadline: number | null
  skipped: number
}

export function HabitsPage({
  data,
  setData,
  today,
  reminders = false,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  today: string
  /** Show the reminder bell on habit and routine cards. */
  reminders?: boolean
}) {
  const [tab, setTab] = useState('habits')
  const [habit, setHabit] = useState<Habit | null>(null)
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [deleting, setDeleting] = useState<{
    id: string
    kind: 'habit' | 'routine'
  } | null>(null)
  const [period, setPeriod] = useState('all')
  const [run, setRun] = useState<Run | null>(null)
  const [message, setMessage] = useState('')
  const [library, setLibrary] = useState(false)
  const [extras, setExtras] = useHabitExtras()
  const [habitView, setHabitView] = useState<'all' | 'left' | 'done' | 'archived'>('all')
  const [noting, setNoting] = useState<string | null>(null)
  const yesterday = (() => { const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) })()
  const active = ordered(data.habits.filter((h) => !extras.archived.includes(h.id)), extras.order)
  const missedYesterday = active.filter((h) => !h.dates.includes(yesterday))
  const leftToday = active.filter((h) => !h.dates.includes(today)).length
  useTabTitle(active.length ? (leftToday ? `${leftToday} habits left` : 'All habits done ✓') : '', 'Habits', 'habits')
  const shown = habitView === 'archived'
    ? data.habits.filter((h) => extras.archived.includes(h.id))
    : active.filter((h) => habitView === 'all' || (habitView === 'done') === h.dates.includes(today))
  const adoptedHabits = new Set(data.habits.map((h) => h.title.toLowerCase()))
  const adoptedRoutines = new Set(
    (data.routines ?? []).map((r) => r.title.toLowerCase()),
  )
  useEffect(() => {
    if (!run?.deadline) return
    const timer = window.setInterval(
      () =>
        setRun((current) =>
          current?.deadline
            ? {
                ...current,
                remaining: Math.max(
                  0,
                  Math.ceil((current.deadline - Date.now()) / 1000),
                ),
              }
            : current,
        ),
      250,
    )
    return () => window.clearInterval(timer)
  }, [run?.deadline])
  const days = gridDays(today)
  const finishStep = (skip: boolean) => {
    if (!run) return
    const skipped = run.skipped + Number(skip)
    const next = run.index + 1
    if (next === run.routine.steps.length) {
      if (!skipped) burst(null, 'stars', 'routines')
      if (!skipped)
        setData((current) => ({
          ...current,
          routines: current.routines?.map((r) =>
            r.id === run.routine.id
              ? { ...r, dates: [...new Set([...r.dates, dayKey()])] }
              : r,
          ),
        }))
      setMessage(
        skipped
          ? `Session finished with ${skipped} skipped step${skipped === 1 ? '' : 's'}.`
          : `${run.routine.title} complete. Well done!`,
      )
      setRun(null)
    } else {
      const remaining = run.routine.steps[next].minutes * 60
      setRun({
        ...run,
        index: next,
        remaining,
        deadline: Date.now() + remaining * 1000,
        skipped,
      })
    }
  }
  const lootCount = data.habits.filter((h) => h.dates.includes(today)).length
  return (
    <div className="habits-workspace">
      {loadSettings().features.pixelJuice && subOn('pixelJuice', 'parallax') && lootCount > 0 && (
        <div className="habits-loot" aria-label={`Today's loot: ${lootCount}`}>
          <span>Today’s loot</span>
          <div className="px-shelf">
            {Array.from({ length: lootCount }, (_, i) => (
              <PixelSprite key={i} sprite={pickSprite(i + 1)} size={40} />
            ))}
          </div>
        </div>
      )}
      {tab === 'habits' && <HabitsQuick data={data} setData={setData} today={today} />}
      {tab === 'habits' && <StickerBook data={data} setData={setData} today={today} />}
      <div className="habits-toolbar">
        <div className="segmented" role="tablist" aria-label="Habit views">
          <button
            role="tab"
            aria-selected={tab === 'habits'}
            className={tab === 'habits' ? 'active' : ''}
            onClick={() => setTab('habits')}
          >
            Habits
          </button>
          {subOn('habitTracker', 'routines') && (
          <button
            role="tab"
            aria-selected={tab === 'routines'}
            className={tab === 'routines' ? 'active' : ''}
            onClick={() => setTab('routines')}
          >
            Routines
          </button>
          )}
        </div>
        <div className="habits-actions">
        {subOn('habitTracker', 'library') && (
        <button className="quiet-button" onClick={() => setLibrary(true)}>
          <LibraryBig size={16} aria-hidden="true" /> Browse library
        </button>
        )}
        <button
          className="primary"
          onClick={() =>
            tab === 'habits'
              ? setHabit({
                  id: id(),
                  title: '',
                  detail: '',
                  dates: [],
                  stat: 'spirit',
                  color: colors[0],
                })
              : setRoutine({
                  id: id(),
                  title: '',
                  period: 'morning',
                  days: [0, 1, 2, 3, 4, 5, 6],
                  steps: [{ id: id(), title: '', minutes: 5 }],
                  dates: [],
                })
          }
        >
          <Plus size={16} />
          {tab === 'habits' ? 'New habit' : 'New routine'}
        </button>
        </div>
      </div>
      {library && (
        <Modal
          title={tab === 'habits' ? 'Habit library' : 'Routine library'}
          onClose={() => setLibrary(false)}
        >
          {tab === 'habits' ? (
            <HabitLibrary
              adopted={adoptedHabits}
              onAdopt={(h) => {
                setData((current) => ({
                  ...current,
                  habits: [
                    ...current.habits,
                    {
                      id: id(),
                      title: h.title,
                      detail: h.detail,
                      dates: [],
                      stat: h.stat,
                      color: h.color,
                    },
                  ],
                }))
                setMessage(`${h.title} added to your habits.`)
              }}
            />
          ) : (
            <RoutineLibrary
              adopted={adoptedRoutines}
              onAdopt={(r) => {
                setData((current) => ({
                  ...current,
                  routines: [
                    ...(current.routines ?? []),
                    {
                      id: id(),
                      title: r.title,
                      period: r.period,
                      days: r.days,
                      steps: r.steps.map((step) => ({ id: id(), ...step })),
                      dates: [],
                    },
                  ],
                }))
                setMessage(`${r.title} added to your routines.`)
              }}
            />
          )}
        </Modal>
      )}
      <p role="status" className="habit-message">
        {message}
      </p>
      {run && (
        <section className="routine-player" aria-label="Active routine">
          <div>
            <span>
              {run.routine.title} / Step {run.index + 1} of{' '}
              {run.routine.steps.length}
            </span>
            <h2>{run.routine.steps[run.index].title}</h2>
          </div>
          <strong className="routine-clock" role="timer">
            {String(Math.floor(run.remaining / 60)).padStart(2, '0')}:
            {String(run.remaining % 60).padStart(2, '0')}
          </strong>
          {run.remaining === 0 && (
            <p role="status">
              Time is up. Complete this step when you are ready.
            </p>
          )}
          <div className="habit-actions">
            <button
              className="icon-button"
              title={run.deadline ? 'Pause' : 'Resume'}
              aria-label={run.deadline ? 'Pause routine' : 'Resume routine'}
              onClick={() =>
                setRun({
                  ...run,
                  deadline: run.deadline
                    ? null
                    : Date.now() + run.remaining * 1000,
                })
              }
            >
              {run.deadline ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="quiet-button"
              onClick={() =>
                setRun({
                  ...run,
                  remaining: run.remaining + 60,
                  deadline: run.deadline ? run.deadline + 60000 : null,
                })
              }
            >
              <Plus size={16} />1 min
            </button>
            <button
              className="icon-button"
              title="Skip step"
              aria-label="Skip step"
              onClick={() => finishStep(true)}
            >
              <SkipForward size={18} />
            </button>
            <button className="primary" onClick={() => finishStep(false)}>
              <Check size={16} />
              Complete step
            </button>
            <button
              className="icon-button"
              title="End session"
              aria-label="End session"
              onClick={() => {
                setRun(null)
                setMessage(
                  'Session ended. Your completed routines are unchanged.',
                )
              }}
            >
              <X size={18} />
            </button>
          </div>
        </section>
      )}
      {tab === 'habits' ? (
        <>
          <div className="habit-summary">
            <div>
              <strong>
                {data.habits.filter((h) => h.dates.includes(today)).length} /{' '}
                {data.habits.length}
              </strong>
              <span>Completed today</span>
            </div>
            <div>
              <strong>
                {Math.max(
                  0,
                  ...data.habits.map((h) => habitStats(h.dates, today).current),
                )}{' '}
                days
              </strong>
              <span>Longest active streak</span>
            </div>
            <div>
              <strong>
                {data.habits.reduce(
                  (n, h) => n + habitStats(h.dates, today).total,
                  0,
                )}
              </strong>
              <span>Total check-ins</span>
            </div>
          </div>
          {!data.habits.length && (
            <p>No habits yet. Start with one small daily commitment.</p>
          )}
          <div className="hx-bar">
            <div className="hx-seg" role="radiogroup" aria-label="Show habits">
              {([['all', 'All'], ['left', 'Left today'], ['done', 'Done'], ['archived', `Archived (${extras.archived.filter((id) => data.habits.some((h) => h.id === id)).length})`]] as const).map(([v, label]) => (
                <button key={v} type="button" role="radio" aria-checked={habitView === v} className={habitView === v ? 'on' : ''} onClick={() => setHabitView(v)}>{label}</button>
              ))}
            </div>
            {active.length > 0 && habitView !== 'archived' && (
              <small className="hx-rate">
                {(() => {
                  const days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(`${today}T12:00:00`)
                    d.setDate(d.getDate() - i)
                    return d.toISOString().slice(0, 10)
                  })
                  const done = active.reduce((a, h) => a + days.filter((d) => h.dates.includes(d)).length, 0)
                  return `This week: ${Math.round((done / (active.length * 7)) * 100)}% of check-ins done`
                })()}{' '}
                <button
                  type="button"
                  className="hx-copy"
                  title="Copy today's habits as a checklist"
                  onClick={(e) => {
                    void navigator.clipboard?.writeText(active.map((h) => `${h.dates.includes(today) ? '☑' : '☐'} ${h.title}`).join('\n'))
                    e.currentTarget.textContent = '✓ copied'
                  }}
                >
                  📋 copy today
                </button>
              </small>
            )}
            {missedYesterday.length > 0 && habitView !== 'archived' && (
              <button type="button" className="hx-yday" onClick={() => setData((d) => ({ ...d, habits: d.habits.map((h) => missedYesterday.some((m) => m.id === h.id) ? { ...h, dates: [...h.dates, yesterday].sort() } : h) }))}>
                ✓ Mark yesterday done for {missedYesterday.length === 1 ? `“${missedYesterday[0].title}”` : `all ${missedYesterday.length}`}
              </button>
            )}
          </div>
          <CardRail label="Your habits">
            {shown.map((h, index) => {
              const stats = habitStats(h.dates, today)
              const note = extras.notes[h.id]?.[today] ?? ''
              const ids = active.map((x) => x.id)
              const done = h.dates.includes(today)
              return (
                <article
                  className="habit-grid-card"
                  key={h.id}
                  style={
                    {
                      '--habit-color': h.color ?? colors[index % colors.length],
                    } as CSSProperties
                  }
                >
                  <header>
                    <div>
                      <h2>{h.title}</h2>
                      <p>{h.detail || 'Daily practice'}</p>
                    </div>
                    <div className="habit-actions">
                      {reminders && subOn('reminders', 'habits') && <ReminderButton id={h.id} title={h.title} />}
                      {habitView !== 'archived' && <>
                        <button className="icon-button hx-mini" title="Move earlier" aria-label={`Move ${h.title} earlier`} disabled={ids[0] === h.id} onClick={() => setExtras((x) => ({ ...x, order: move(ids, h.id, -1) }))}><ChevronLeft size={16} /></button>
                        <button className="icon-button hx-mini" title="Move later" aria-label={`Move ${h.title} later`} disabled={ids.at(-1) === h.id} onClick={() => setExtras((x) => ({ ...x, order: move(ids, h.id, 1) }))}><ChevronRight size={16} /></button>
                      </>}
                      <button className="icon-button hx-mini" title={habitView === 'archived' ? 'Unarchive' : 'Archive'} aria-label={`${habitView === 'archived' ? 'Unarchive' : 'Archive'} ${h.title}`} onClick={() => setExtras((x) => ({ ...x, archived: x.archived.includes(h.id) ? x.archived.filter((i) => i !== h.id) : [...x.archived, h.id] }))}>{habitView === 'archived' ? <ArchiveRestore size={16} /> : <Archive size={16} />}</button>
                      <button
                        className="icon-button"
                        title="Edit habit"
                        aria-label={`Edit ${h.title}`}
                        onClick={() => setHabit(h)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        title="Delete habit"
                        aria-label={`Delete ${h.title}`}
                        // Deleted habits go to the Trash with an Undo toast, so no confirm step.
                        onClick={() => setData((d) => ({ ...d, habits: d.habits.filter((x) => x.id !== h.id) }))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </header>
                  {subOn('habitTracker', 'grid') && (<>
                  <div className="habit-grid-caption">
                    <span>
                      {new Date(`${days[0]}T12:00:00`).toLocaleDateString(
                        undefined,
                        { month: 'short', year: 'numeric' },
                      )}
                    </span>
                    <span>
                      {new Date(`${today}T12:00:00`).toLocaleDateString(
                        undefined,
                        { month: 'short', year: 'numeric' },
                      )}
                    </span>
                  </div>
                  <div
                    className="habit-contribution-grid"
                    aria-label={`${h.title} completion history`}
                  >
                    {days.map((day) => (
                      <button
                        key={day}
                        className={`${h.dates.includes(day) ? 'filled' : ''} ${day === today ? 'today' : ''}`}
                        disabled={day > today}
                        title={`${day}: ${h.dates.includes(day) ? 'Completed' : 'Not completed'}${extras.notes[h.id]?.[day] ? ` — ${extras.notes[h.id][day]}` : ''}`}
                        aria-label={`${h.title}, ${day}`}
                        aria-pressed={h.dates.includes(day)}
                        onClick={() =>
                          setData((d) => toggleHabit(d, h.id, day))
                        }
                      />
                    ))}
                  </div>
                  </>)}
                  <footer>
                    <span>
                      <Flame size={15} />
                      {stats.current
                        ? `${stats.current} day streak`
                        : h.dates.length
                          ? 'Ready to pick up again'
                          : 'Your first day awaits'}
                    </span>
                    <span>
                      {h.dates.length} {h.dates.length === 1 ? 'day' : 'days'} kept · best {stats.best}
                    </span>
                    <span className="hx-strength" title="Habit strength: weighted over the last 60 days">
                      <i style={{ width: `${strength(h.dates, today)}%` }} />strength {strength(h.dates, today)}%
                    </span>
                    {noting === h.id ? (
                      <input className="hx-note" autoFocus maxLength={120} placeholder="A note for today…" defaultValue={note} aria-label={`Note for ${h.title} today`}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur() }}
                        onBlur={(e) => { const v = e.currentTarget.value.trim(); setExtras((x) => ({ ...x, notes: { ...x.notes, [h.id]: { ...(x.notes[h.id] ?? {}), [today]: v } } })); setNoting(null) }} />
                    ) : (
                      <button type="button" className="hx-note-btn" onClick={() => setNoting(h.id)}>{note ? `📝 ${note}` : '＋ note'}</button>
                    )}
                    <button
                      className={done ? 'quiet-button' : 'primary'}
                      aria-label={`Check in: ${h.title}`}
                      aria-pressed={done}
                      onClick={(event) => {
                        if (!done) {
                          burst(event.currentTarget)
                          streakMilestone(stats.current + 1, h.title)
                        }
                        setData((d) => toggleHabit(d, h.id, today))
                      }}
                    >
                      <Check size={16} />
                      {done ? 'Done today' : 'Check in'}
                    </button>
                  </footer>
                </article>
              )
            })}
          </CardRail>
        </>
      ) : (
        <>
          <div className="habits-toolbar">
            <h2>Your routines</h2>
            <select
              aria-label="Time of day"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">All day</option>
              {['morning', 'afternoon', 'evening', 'night'].map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {!(data.routines ?? []).filter(
            (r) => period === 'all' || r.period === period,
          ).length && (
            <p>No routines here yet. Make time for your next daily ritual.</p>
          )}
          <CardRail label="Your routines">
            {(data.routines ?? [])
              .filter((r) => period === 'all' || r.period === period)
              .map((r) => (
                <article className="habit-grid-card" key={r.id}>
                  <header>
                    <div>
                      <span className="routine-period">{r.period}</span>
                      <h2>{r.title}</h2>
                    </div>
                    <div className="habit-actions">
                      {reminders && subOn('reminders', 'routines') && <ReminderButton id={r.id} title={r.title} />}
                      <button
                        className="icon-button"
                        title="Edit routine"
                        aria-label={`Edit ${r.title}`}
                        onClick={() => setRoutine(r)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        title="Delete routine"
                        aria-label={`Delete ${r.title}`}
                        onClick={() =>
                          setDeleting({ id: r.id, kind: 'routine' })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </header>
                  <p>
                    {r.days.length === 7
                      ? 'Every day'
                      : r.days.map((d) => weekdays[d]).join(', ')}{' '}
                    /{' '}
                    {r.days.includes(new Date(`${today}T12:00:00`).getDay())
                      ? 'Scheduled today'
                      : 'Rest day'}
                  </p>
                  <ol className="routine-step-list">
                    {r.steps.map((s) => (
                      <li key={s.id}>
                        <span>{s.title}</span>
                        <span>{s.minutes} min</span>
                      </li>
                    ))}
                  </ol>
                  <footer>
                    <span>
                      <Timer size={16} />
                      {r.steps.reduce((n, s) => n + s.minutes, 0)} min
                    </span>
                    <span>
                      {r.dates.includes(today)
                        ? 'Completed today'
                        : `${r.dates.length} completions`}
                    </span>
                    <button
                      className="primary"
                      disabled={!!run}
                      onClick={() => {
                        const remaining = r.steps[0].minutes * 60
                        setRun({
                          routine: r,
                          index: 0,
                          remaining,
                          deadline: Date.now() + remaining * 1000,
                          skipped: 0,
                        })
                        setMessage('')
                      }}
                    >
                      <Play size={16} />
                      Start
                    </button>
                  </footer>
                </article>
              ))}
          </CardRail>
        </>
      )}
      {habit && (
        <Modal
          title={
            data.habits.some((h) => h.id === habit.id)
              ? 'Edit habit'
              : 'New habit'
          }
          onClose={() => setHabit(null)}
        >
          <form
            className="habit-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!habit.title.trim()) return
              setData((d) => ({
                ...d,
                habits: d.habits.some((h) => h.id === habit.id)
                  ? d.habits.map((h) =>
                      h.id === habit.id
                        ? {
                            ...habit,
                            title: habit.title.trim(),
                            dates: h.dates,
                          }
                        : h,
                    )
                  : [
                      ...d.habits,
                      {
                        ...habit,
                        title: habit.title.trim(),
                        stat: inferStat(habit.title),
                      },
                    ],
              }))
              setHabit(null)
            }}
          >
            <label>
              Name
              <input
                autoFocus
                required
                maxLength={100}
                value={habit.title}
                onChange={(e) => setHabit({ ...habit, title: e.target.value })}
              />
            </label>
            <label>
              Daily intention
              <input
                maxLength={200}
                value={habit.detail}
                onChange={(e) => setHabit({ ...habit, detail: e.target.value })}
              />
            </label>
            <fieldset>
              <legend>Color</legend>
              <div className="habit-actions">
                {colors.map((color, i) => (
                  <button
                    key={color}
                    type="button"
                    className="habit-swatch"
                    style={{ background: color }}
                    aria-label={['Green', 'Rose', 'Blue', 'Amber', 'Violet'][i]}
                    aria-pressed={(habit.color ?? colors[0]) === color}
                    onClick={() => setHabit({ ...habit, color })}
                  >
                    {(habit.color ?? colors[0]) === color && (
                      <Check size={18} />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="primary" type="submit">
              <Check size={16} />
              Save habit
            </button>
          </form>
        </Modal>
      )}
      {routine && (
        <Modal
          title={
            data.routines?.some((r) => r.id === routine.id)
              ? 'Edit routine'
              : 'New routine'
          }
          onClose={() => setRoutine(null)}
        >
          <form
            className="habit-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (
                !routine.title.trim() ||
                !routine.days.length ||
                routine.steps.some((s) => !s.title.trim())
              )
                return
              const saved = {
                ...routine,
                title: routine.title.trim(),
                steps: routine.steps.map((s) => ({
                  ...s,
                  title: s.title.trim(),
                })),
              }
              setData((d) => ({
                ...d,
                routines: d.routines?.some((r) => r.id === routine.id)
                  ? d.routines.map((r) =>
                      r.id === routine.id ? { ...saved, dates: r.dates } : r,
                    )
                  : [...(d.routines ?? []), saved],
              }))
              setRoutine(null)
            }}
          >
            <label>
              Name
              <input
                required
                autoFocus
                maxLength={100}
                value={routine.title}
                onChange={(e) =>
                  setRoutine({ ...routine, title: e.target.value })
                }
              />
            </label>
            <label>
              Time of day
              <select
                value={routine.period}
                onChange={(e) =>
                  setRoutine({
                    ...routine,
                    period: e.target.value as Routine['period'],
                  })
                }
              >
                {['morning', 'afternoon', 'evening', 'night'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Repeat on</legend>
              <div className="routine-days">
                {weekdays.map((day, i) => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={routine.days.includes(i)}
                      onChange={() =>
                        setRoutine({
                          ...routine,
                          days: routine.days.includes(i)
                            ? routine.days.filter((d) => d !== i)
                            : [...routine.days, i].sort(),
                        })
                      }
                    />
                    {day}
                  </label>
                ))}
              </div>
              {!routine.days.length && (
                <p role="alert">Choose at least one day.</p>
              )}
            </fieldset>
            <fieldset>
              <legend>Steps</legend>
              {routine.steps.map((s, i) => (
                <div className="routine-edit-step" key={s.id}>
                  <label>
                    Step {i + 1}
                    <input
                      required
                      maxLength={100}
                      value={s.title}
                      onChange={(e) =>
                        setRoutine({
                          ...routine,
                          steps: routine.steps.map((step) =>
                            step.id === s.id
                              ? { ...step, title: e.target.value }
                              : step,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Minutes
                    <input
                      type="number"
                      min={1}
                      max={180}
                      required
                      value={s.minutes}
                      onChange={(e) =>
                        setRoutine({
                          ...routine,
                          steps: routine.steps.map((step) =>
                            step.id === s.id
                              ? { ...step, minutes: Number(e.target.value) }
                              : step,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="habit-actions">
                    {[-1, 1].map((delta) => (
                      <button
                        type="button"
                        className="icon-button"
                        key={delta}
                        disabled={
                          i + delta < 0 || i + delta >= routine.steps.length
                        }
                        aria-label={`Move step ${i + 1} ${delta < 0 ? 'up' : 'down'}`}
                        title={delta < 0 ? 'Move up' : 'Move down'}
                        onClick={() => {
                          const steps = [...routine.steps]
                          ;[steps[i], steps[i + delta]] = [
                            steps[i + delta],
                            steps[i],
                          ]
                          setRoutine({ ...routine, steps })
                        }}
                      >
                        {delta < 0 ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}
                      </button>
                    ))}
                    <button
                      className="icon-button"
                      type="button"
                      title="Remove step"
                      aria-label={`Remove step ${i + 1}`}
                      disabled={routine.steps.length === 1}
                      onClick={() =>
                        setRoutine({
                          ...routine,
                          steps: routine.steps.filter(
                            (step) => step.id !== s.id,
                          ),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="quiet-button"
                onClick={() =>
                  setRoutine({
                    ...routine,
                    steps: [
                      ...routine.steps,
                      { id: id(), title: '', minutes: 5 },
                    ],
                  })
                }
              >
                <Plus size={16} />
                Add step
              </button>
            </fieldset>
            <button
              type="submit"
              className="primary"
              disabled={!routine.days.length}
            >
              <Check size={16} />
              Save routine
            </button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={`Delete ${deleting.kind}?`}
          onClose={() => setDeleting(null)}
        >
          <p>This removes its completion history as well.</p>
          <div className="habit-actions">
            <button className="quiet-button" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="primary"
              onClick={() => {
                setData((d) =>
                  deleting.kind === 'habit'
                    ? {
                        ...d,
                        habits: d.habits.filter((h) => h.id !== deleting.id),
                      }
                    : {
                        ...d,
                        routines: d.routines?.filter(
                          (r) => r.id !== deleting.id,
                        ),
                      },
                )
                if (run?.routine.id === deleting.id) setRun(null)
                setDeleting(null)
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
