import { useEffect, useRef, useState } from 'react'
import Gantt from 'frappe-gantt'
import '../../../node_modules/frappe-gantt/dist/frappe-gantt.css'
import { CalendarRange, CheckSquare, ClipboardCheck, Flag, Plus, Target, Trash2 } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { Segmented, Slider, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { dayKey } from '../../dates'
import { ROADMAP_KEY, ganttTasks, goalColors, goalProgress, onTrack, reviewDue, reviewPrompts, sampleGoal, type Goal, type Milestone, type RoadmapStore } from './roadmapModel'
import './roadmap.css'

const on = (id: string) => subOn('goalRoadmap', id)

function GanttView({ goals, view, onDates, onProgress }: { goals: Goal[]; view: RoadmapStore['view']; onDates: (id: string, start: string, end: string) => void; onProgress: (id: string, p: number) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const chart = useRef<Gantt | null>(null)
  const cb = useRef({ onDates, onProgress })
  cb.current = { onDates, onProgress }
  const tasks = ganttTasks(goals)
  const key = JSON.stringify(tasks)
  useEffect(() => {
    if (!host.current) return
    host.current.innerHTML = ''
    if (!tasks.length) return
    chart.current = new Gantt(host.current, tasks, {
      view_mode: view,
      bar_height: 28,
      padding: 16,
      readonly_dates: !on('dragDates'),
      readonly_progress: !on('progress'),
      arrow_curve: 8,
      today_button: false,
      view_mode_select: false,
      scroll_to: 'today',
      popup: false,
      on_date_change: (t: { id: string }, start: Date, end: Date) => cb.current.onDates(t.id, dayKey(start), dayKey(end)),
      on_progress_change: (t: { id: string }, p: number) => cb.current.onProgress(t.id, Math.round(p)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild when tasks or view change
  }, [key, view])
  return <div ref={host} className="rm-gantt" />
}

export function RoadmapPage({ setData }: FeaturePageProps) {
  const today = dayKey()
  const [store, setStoreState] = useState<RoadmapStore>(() => {
    const s = readStore<RoadmapStore>(ROADMAP_KEY, { goals: [], view: 'Week' })
    return s.goals.length ? s : { ...s, goals: [sampleGoal(today)] }
  })
  const setStore = (fn: (s: RoadmapStore) => RoadmapStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(ROADMAP_KEY, n)
      return n
    })
  const [tab, setTab] = useState('timeline')
  const [sel, setSelState] = useState(() => {
    const saved = localStorage.getItem('bloom-roadmap-goal')
    return saved && store.goals.some((g) => g.id === saved) ? saved : (store.goals[0]?.id ?? '')
  })
  const setSel = (id: string) => {
    setSelState(id)
    try { localStorage.setItem('bloom-roadmap-goal', id) } catch { /* optional */ }
  }
  const [title, setTitle] = useState('')
  const [msTitle, setMsTitle] = useState('')
  const [msWeeks, setMsWeeks] = useState(2)
  const [review, setReview] = useState<string[]>(['', '', '', ''])
  const goal = store.goals.find((g) => g.id === sel) ?? store.goals[0]
  const btn = useRef<HTMLButtonElement>(null)

  const updateGoal = (id: string, fn: (g: Goal) => Goal) => setStore((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? fn(g) : g)) }))
  const updateMs = (msId: string, fn: (m: Milestone) => Milestone) => setStore((s) => ({ ...s, goals: s.goals.map((g) => ({ ...g, milestones: g.milestones.map((m) => (m.id === msId ? fn(m) : m)) })) }))

  const timeline = () => (
    <div className="rm-timeline">
      <div className="studio-chip-row">
        <button type="button" className="studio-chip" onClick={() => setTab('new')}>
          <Plus size={13} /> New goal
        </button>
        <button type="button" className="studio-chip" onClick={() => setSel((store.goals[0]?.id ?? ''))}>
          Focus current goal
        </button>
        <button type="button" className="studio-chip" onClick={() => setTab('timeline')}>
          Jump to today
        </button>
      </div>
      {on('views') && (
        <Segmented label="View" value={store.view} onChange={(v) => setStore((s) => ({ ...s, view: v }))} options={[{ id: 'Week', label: 'Weeks' }, { id: 'Month', label: 'Months' }, { id: 'Year', label: 'Year' }]} />
      )}
      <div className="studio-card rm-chart">
        <GanttView
          goals={store.goals}
          view={store.view}
          onDates={(id, start, end) => updateMs(id, (m) => ({ ...m, start, end }))}
          onProgress={(id, p) => {
            updateMs(id, (m) => ({ ...m, progress: p }))
            if (p >= 100) burst(null, 'stars')
          }}
        />
      </div>
      <div className="rm-legend bloom-wrap">
        {store.goals.map((g, i) => (
          <button key={g.id} type="button" className="studio-chip" onClick={() => (setSel(g.id), setTab('goal'))}>
            <i style={{ background: goalColors[i % goalColors.length] }} /> {g.title} · {Math.round(goalProgress(g) * 100)}%
          </button>
        ))}
      </div>
    </div>
  )

  const track = goal && on('onTrack') ? onTrack(goal, today) : null
  const goalTab = () =>
    !goal ? (
      <p className="studio-empty">Add a goal to begin.</p>
    ) : (
      <div className="studio-split">
        <div className="studio-card rm-side bloom-start-stack">
          <div className="studio-chip-row">
            {store.goals.map((g) => (
              <button key={g.id} type="button" className="studio-chip" aria-pressed={g.id === goal.id} onClick={() => setSel(g.id)}>
                {g.title}
              </button>
            ))}
          </div>
          <input className="studio-input rm-title" aria-label="Goal title" value={goal.title} onChange={(e) => updateGoal(goal.id, (g) => ({ ...g, title: e.target.value }))} />
          <div className="rm-bar" aria-label="Goal progress">
            <span style={{ width: `${goalProgress(goal) * 100}%` }} />
            {track && <i style={{ left: `${track.expected * 100}%` }} title="Where you’d be on an even pace" />}
          </div>
          {track && <p className="studio-empty">{Math.round(track.actual * 100)}% done · {track.status}</p>}
          {on('keyResults') &&
            goal.krs.map((k) => (
              <div key={k.id} className="rm-kr">
                <Slider label={k.title} value={k.current} min={0} max={k.target} step={k.target > 20 ? 1 : 0.5} format={(v) => `${v} / ${k.target}`} onChange={(v) => updateGoal(goal.id, (g) => ({ ...g, krs: g.krs.map((x) => (x.id === k.id ? { ...x, current: v } : x)) }))} />
              </div>
            ))}
          {on('keyResults') && (
            <button type="button" className="studio-chip" onClick={() => updateGoal(goal.id, (g) => ({ ...g, krs: [...g.krs, { id: crypto.randomUUID(), title: 'New key result', current: 0, target: 10 }] }))}>
              <Plus size={13} /> Key result
            </button>
          )}
          {on('confidence') && <Slider label="Confidence" value={goal.confidence} min={1} max={10} format={(v) => `${v}/10`} onChange={(v) => updateGoal(goal.id, (g) => ({ ...g, confidence: v }))} />}
          <button
            type="button"
            className="studio-chip"
            onClick={() => {
              if (!window.confirm(`Delete the goal “${goal.title}” and its milestones?`)) return
              setStore((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== goal.id) }))
              setSel('')
            }}
          >
            <Trash2 size={13} /> Delete goal
          </button>
        </div>
        <div className="studio-card rm-side bloom-start-stack">
          <h3>
            <Flag size={16} /> Milestones
          </h3>
          <ul className="rm-ms bloom-list">
            {goal.milestones.map((m) => (
              <li key={m.id}>
                <span>
                  <strong>{m.title}</strong>
                  <small>
                    {m.start.slice(5)} → {m.end.slice(5)} · {m.progress}%
                  </small>
                </span>
                {on('linkTasks') && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Add ${m.title} to tasks`}
                    onClick={(e) => {
                      setData((d) => ({ ...d, todos: [...d.todos, { id: crypto.randomUUID(), title: m.title.slice(0, 150), done: false, due: m.end, completedAt: null, challengeId: null, rewarded: false, priority: 'P2', tags: ['goal'], recurrence: 'none', seriesId: null, subtasks: [] }] }))
                      burst(e.currentTarget, 'stars')
                    }}
                  >
                    <CheckSquare size={15} />
                  </button>
                )}
                <button type="button" className="icon-button" aria-label={`Delete ${m.title}`} onClick={() => updateGoal(goal.id, (g) => ({ ...g, milestones: g.milestones.filter((x) => x.id !== m.id) }))}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <input
            className="studio-input"
            aria-label="Milestone"
            placeholder="Next milestone (Enter to add)"
            value={msTitle}
            onChange={(e) => setMsTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && msTitle.trim()) (e.currentTarget.parentElement?.querySelector('.studio-go') as HTMLButtonElement | null)?.click()
            }}
          />
          <Slider label="Takes" value={msWeeks} min={1} max={26} unit="weeks" compact onChange={setMsWeeks} />
          <button
            type="button"
            className="studio-go"
            disabled={!msTitle.trim()}
            onClick={() => {
              const last = goal.milestones.at(-1)
              const start = last?.end ?? today
              const end = new Date(`${start}T12:00:00`)
              end.setDate(end.getDate() + msWeeks * 7)
              updateGoal(goal.id, (g) => ({ ...g, milestones: [...g.milestones, { id: crypto.randomUUID(), title: msTitle.trim(), start, end: dayKey(end), progress: 0, dependsOn: on('dependencies') ? last?.id : undefined }] }))
              setMsTitle('')
            }}
          >
            <Plus size={16} /> Add milestone
          </button>
        </div>
      </div>
    )

  const reviewTab = () =>
    !goal ? null : (
      <div className="studio-split">
        <div className="studio-card rm-side bloom-start-stack">
          <h3>
            <ClipboardCheck size={16} /> Weekly review · {goal.title}
          </h3>
          {reviewPrompts.map((p, i) => (
            <label key={p} className="rm-prompt">
              {p}
              <textarea className="studio-input" rows={2} value={review[i]} onChange={(e) => setReview((r) => r.map((x, j) => (j === i ? e.target.value : x)))} />
            </label>
          ))}
          <button
            ref={btn}
            type="button"
            className="studio-go"
            onClick={() => {
              updateGoal(goal.id, (g) => ({ ...g, reviewedAt: today, note: review.filter(Boolean).join('\n') }))
              setReview(['', '', '', ''])
              logActivity('goalReview')
              burst(btn.current, 'stars')
            }}
          >
            Save review
          </button>
        </div>
        <div className="studio-card rm-side bloom-start-stack">
          <h3>Goals needing a review</h3>
          {store.goals.filter((g) => reviewDue(g, today)).map((g) => (
            <button key={g.id} type="button" className="studio-chip" onClick={() => setSel(g.id)}>
              {g.title}
            </button>
          ))}
          {goal.note && <p className="studio-empty">Last note: {goal.note.split('\n')[0]}</p>}
        </div>
      </div>
    )

  const addGoal = () => (
    <div className="studio-center">
      <Target size={40} />
      <input className="studio-input rm-title" aria-label="New goal" placeholder="What do you want to achieve?" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button
        type="button"
        className="studio-go"
        disabled={!title.trim()}
        onClick={() => {
          const g: Goal = { id: crypto.randomUUID(), title: title.trim(), color: goalColors[store.goals.length % goalColors.length], confidence: 6, krs: [], milestones: [{ id: crypto.randomUUID(), title: 'First step', start: today, end: dayKey(new Date(Date.now() + 14 * 86400000)), progress: 0 }] }
          setStore((s) => ({ ...s, goals: [...s.goals, g] }))
          setSel(g.id)
          setTitle('')
          setTab('goal')
        }}
      >
        <Plus size={16} /> Create goal
      </button>
    </div>
  )

  return (
    <Studio
      name="roadmap"
      accent="#e2703f"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#ffd89b', '#c9b8ff', '#9fdcc8']} line="mountain" />}
      tabs={[
        { id: 'timeline', label: 'Timeline', icon: <CalendarRange size={15} />, render: timeline },
        { id: 'goal', label: 'Goal', icon: <Target size={15} />, render: goalTab },
        ...(on('review') ? [{ id: 'review', label: 'Review', icon: <ClipboardCheck size={15} />, render: reviewTab }] : []),
        { id: 'new', label: 'New goal', icon: <Plus size={15} />, render: addGoal },
      ]}
    />
  )
}
