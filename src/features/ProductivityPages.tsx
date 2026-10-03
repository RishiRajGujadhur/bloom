import { useTabTitle } from '../utils/useTabTitle'
import { prefersReducedMotion } from '../utils/motion'
import { launchImpact } from './impact/ImpactLayer'
import { taskWeight } from './impact/impactModel'
import { burst } from '../components/ui/celebrate'
import { loadSettings } from '../SettingsPage'
import { subOn } from './subFeatures'
import { TodosQuick } from './quick/TodosQuick'
import { SummitTrail } from './showcase/SummitTrail'
import { ShowMore } from '../components/ui/Flow'
import { usePageActions } from '../components/ui/PageMenu'

/** Only heavy tasks drop by default; switching "Heavy tasks only" off lets any task fall. */
const impactThreshold = () => (subOn('impactTasks', 'heavyOnly') ? 1 : 0)
import { CardRail } from '../components/BloomExperience'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import gsap from 'gsap'
import './waterdo.css'
import './todos/quickTask.css'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ListTree,
  Plus,
  Pencil,
  Repeat2,
  SlidersHorizontal,
  Tag,
  X,
} from 'lucide-react'
import type { AppData } from '../model'
import { dayKey, id } from '../model'
import { Sprite } from '../rpg/Sprite'
import {
  PlanningTools,
  TaskPlanningFields,
  type PlanningFilter,
} from './PlanningTools'
import {
  emptyPerspective,
  emptyPlanning,
  matchesPerspective,
  planningOf,
  projectPath,
  taskAvailability,
} from './planning'
import {
  acceptChallenge,
  addSubtask,
  challengeCategories,
  challenges,
  toggleSubtask,
  toggleTodo,
} from './productivity'

type Props = { data: AppData; setData: Dispatch<SetStateAction<AppData>> }
export function ChallengesPage({
  data,
  setData,
  onTasks,
}: Props & { onTasks: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [category, setCategoryState] = useState<string>(() => localStorage.getItem('bloom-challenge-cat') || 'all')
  const setCategory = (c: string) => {
    setCategoryState(c)
    try { localStorage.setItem('bloom-challenge-cat', c) } catch { /* optional */ }
  }
  const shown = challenges.filter(
    (c) => category === 'all' || c.category === category,
  )
  const palette = ['#e0703f', '#3f7fd0', '#3f8a5a', '#8f7ae5', '#f0a500']
  const climbers = data.challenges.map((c, i) => {
    const def = challenges.find((x) => x.id === c.id)
    const tasks = data.todos.filter((t) => t.challengeId === c.id)
    return { id: c.id, label: def?.title ?? c.id, progress: tasks.length ? tasks.filter((t) => t.done).length / tasks.length : 0, color: palette[i % palette.length], emoji: '🧗' }
  })
  const nextOpen = data.todos.find((t) => !t.done && t.challengeId)
  usePageActions([
    ...(nextOpen ? [{ id: 'ch-next', label: `Next step: ${nextOpen.title}`, icon: '🧗', run: onTasks }] : []),
    { id: 'ch-all', label: 'Show every challenge', icon: '🏔️', run: () => setCategory('all') },
  ])
  return (
    <div id="challenges-page">
      {subOn('adaptiveGoals', 'summitTrail', { ignoreParent: true }) && <SummitTrail climbers={climbers} onPick={(cid) => setSelected(cid)} />}
      <div className="filter-chips" role="tablist" aria-label="Challenge type">
        {challengeCategories.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <CardRail label="Challenges" key={category}>
        {shown.map((challenge) => {
          const accepted = data.challenges.find(
            (item) => item.id === challenge.id,
          )
          const tasks = data.todos.filter(
            (task) => task.challengeId === challenge.id,
          )
          const done = tasks.filter((task) => task.done).length
          const open = selected === challenge.id
          return (
            <article className="quest-card" key={challenge.id}>
              <Sprite
                name={challenge.sprite}
                label={challenge.title}
                size={64}
              />
              <span className="eyebrow">
                {challenge.days} days · +{challenge.reward} XP
              </span>
              <h2>{challenge.title}</h2>
              <p>{challenge.goal}</p>
              {accepted ? (
                <>
                  <progress
                    max={challenge.tasks.length}
                    value={done}
                    aria-label={`${challenge.title} progress`}
                  />
                  <span>
                    {done}/{challenge.tasks.length} complete
                    {accepted.rewarded ? ' · Reward earned' : ''}
                  </span>
                  {(() => {
                    const next = tasks.find((t) => !t.done)
                    return next ? (
                      <small className="quest-next">
                        Next: <strong>{next.title}</strong>
                        {challenge.tasks.length - done === 1 ? ' — last one!' : ''}
                      </small>
                    ) : null
                  })()}
                  <button className="quiet-button" onClick={onTasks}>
                    View tasks <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="quiet-button"
                    aria-expanded={open}
                    onClick={() => setSelected(open ? null : challenge.id)}
                  >
                    {open ? 'Hide steps' : 'Preview steps'}
                  </button>
                  {open && (
                    <ol>
                      {challenge.tasks.map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ol>
                  )}
                  <button
                    className="primary"
                    onClick={() => {
                      setData((current) =>
                        acceptChallenge(current, challenge.id),
                      )
                      setNotice(
                        `${challenge.title}: ${challenge.tasks.length} tasks added.`,
                      )
                    }}
                  >
                    Accept challenge <Plus size={16} />
                  </button>
                </>
              )}
            </article>
          )
        })}
      </CardRail>
      <p role="status">{notice}</p>
    </div>
  )
}
import { addDays, parseQuickTask, splitLines } from './todos/quickTask'

export function TodoPage({ data, setData }: Props) {
  const composerRef = useRef<HTMLInputElement>(null)
  const [waterDo, setWaterDo] = useState(() => localStorage.getItem('bloom-waterdo') === 'true')
  const [planning, setPlanning] = useState({ ...emptyPlanning })
  const [editPlanning, setEditPlanning] = useState({ ...emptyPlanning })
  const [perspective, setPerspective] = useState<PlanningFilter>({
    ...emptyPerspective,
  })
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(dayKey)
  // The add form keeps the priority you last used.
  const [priority, setPriorityState] = useState<'P1' | 'P2' | 'P3' | 'P4'>(() => {
    const saved = localStorage.getItem('bloom-todo-priority')
    return saved === 'P1' || saved === 'P2' || saved === 'P4' ? saved : 'P3'
  })
  const setPriority = (p: 'P1' | 'P2' | 'P3' | 'P4') => {
    setPriorityState(p)
    try { localStorage.setItem('bloom-todo-priority', p) } catch { /* optional */ }
  }
  const [tags, setTags] = useState('')
  const [recurrence, setRecurrence] = useState<
    'none' | 'daily' | 'weekly' | 'monthly'
  >('none')
  const [showOptions, setShowOptions] = useState(false)
  const [filter, setFilterState] = useState(() => localStorage.getItem('bloom-todo-filter') || 'open')
  const setFilter = (f: string) => {
    setFilterState(f)
    try { localStorage.setItem('bloom-todo-filter', f) } catch { /* optional */ }
  }
  const [tagFilter, setTagFilter] = useState('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDue, setEditDue] = useState('')
  const [editPriority, setEditPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>(
    'P3',
  )
  const [editTags, setEditTags] = useState('')
  const [editRecurrence, setEditRecurrence] = useState<
    'none' | 'daily' | 'weekly' | 'monthly'
  >('none')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const parseTags = (value: string) =>
    [
      ...new Set(
        value
          .split(/[\s,]+/)
          .map((tag) => tag.replace(/^#/, '').toLowerCase())
          .filter(Boolean),
      ),
    ].slice(0, 6)
  const [taskQuery, setTaskQuery] = useState('')
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        event.key.toLowerCase() !== 'n' ||
        event.ctrlKey || event.metaKey || event.altKey ||
        target?.isContentEditable ||
        target?.closest('input, textarea, select, button, [contenteditable="true"]')
      ) return
      event.preventDefault()
      composerRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  const allTags = [...new Set(data.todos.flatMap((task) => task.tags))].sort()
  const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 }
  const filterCounts = {
    open: data.todos.filter((task) => !task.done).length,
    today: data.todos.filter((task) => !task.done && task.due <= dayKey()).length,
    soon: data.todos.filter((task) => !task.done && task.due > dayKey() && task.due <= addDays(dayKey(), 7)).length,
    done: data.todos.filter((task) => task.done).length,
  }
  const tasks = data.todos
    .filter((task) => {
      const matchesStatus =
        filter === 'done'
          ? task.done
          : filter === 'today'
            ? !task.done && task.due <= dayKey()
            : filter === 'soon'
              ? !task.done && task.due > dayKey() && task.due <= addDays(dayKey(), 7)
              : !task.done
      return (
        matchesStatus &&
        (!taskQuery.trim() || `${task.title} ${task.tags.join(' ')}`.toLowerCase().includes(taskQuery.trim().toLowerCase())) &&
        (tagFilter === 'all' || task.tags.includes(tagFilter)) &&
        matchesPerspective(data, task, perspective)
      )
    })
    .sort(
      (a, b) =>
        Number(!a.done && b.due < dayKey()) -
          Number(!b.done && a.due < dayKey()) ||
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.due.localeCompare(b.due),
    )
  const quick = parseQuickTask(title, dayKey())
  const addMany = (lines: string[]) => {
    const made = lines.map((line) => {
      const q = parseQuickTask(line, dayKey())
      const rec = q.recurrence !== 'none' ? q.recurrence : recurrence
      return {
          id: id(),
          title: q.title,
          due: q.due ?? due,
          done: false,
          challengeId: null,
          rewarded: false,
          priority: q.priority ?? priority,
          tags: [...new Set([...parseTags(tags), ...q.tags])].slice(0, 6),
          recurrence: rec,
          seriesId: rec === 'none' ? null : id(),
          subtasks: [],
          planning: {
            ...planning,
            context: planning.context.trim(),
            order: Date.now(),
          },
        }
    })
    setData((current) => ({ ...current, todos: [...current.todos, ...made] }))
    setTitle('')
    setTags('')
  }
  const add = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    addMany([title])
  }
  const shiftDue = (taskId: string, days: number) =>
    setData((current) => ({
      ...current,
      todos: current.todos.map((t) =>
        t.id === taskId
          ? { ...t, due: addDays(t.due < dayKey() ? dayKey() : t.due, days) }
          : t,
      ),
    }))
  const overdue = tasks.filter((t) => !t.done && t.due < dayKey())
  const dueToday = data.todos.filter((t) => !t.done && t.due <= dayKey()).length
  useTabTitle(dueToday ? `${dueToday} to do today` : '', 'To-dos', 'todos')
  return (
    <section id="todo-page" className="task-workspace planning-workspace">
      <TodosQuick data={data} setData={setData} />
      <PlanningTools
        data={data}
        setData={setData}
        filter={perspective}
        setFilter={(next) => {
          if (next.projectId !== perspective.projectId)
            setPlanning((current) => ({
              ...current,
              projectId: data.projects.some((p) => p.id === next.projectId)
                ? next.projectId
                : null,
            }))
          setPerspective(next)
        }}
      />
      <div className="todo-overview" role="group" aria-label="Task overview">
        <button type="button" aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>
          <strong>{filterCounts.open}</strong>
          <span>Open tasks</span>
        </button>
        <button type="button" aria-pressed={filter === 'today'} onClick={() => setFilter('today')}>
          <strong>{filterCounts.today}</strong>
          <span>Due today</span>
        </button>
        <button type="button" aria-pressed={filter === 'done'} onClick={() => setFilter('done')}>
          <strong>{filterCounts.done}</strong>
          <span>Completed</span>
        </button>
      </div>
      <form className="task-composer" onSubmit={add}>
        <div className="task-add">
          <input
            ref={composerRef}
            aria-label="New task"
            placeholder="What needs doing?"
            maxLength={150}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onPaste={(event) => {
              const lines = splitLines(event.clipboardData.getData('text'))
              if (lines.length < 2) return
              event.preventDefault()
              addMany(lines)
            }}
            required
          />
          <button
            className="quiet-button"
            type="button"
            aria-expanded={showOptions}
            onClick={() => setShowOptions((value) => !value)}
          >
            <SlidersHorizontal size={17} /> Details
          </button>
          <button className="primary" type="submit">
            <Plus size={17} /> Add
          </button>
        </div>
        {title.trim() &&
          (quick.due || quick.priority || quick.tags.length > 0 || quick.recurrence !== 'none') && (
            <div className="quick-chips" aria-live="polite">
              <span>Will add “{quick.title}”</span>
              {quick.due && <b>📅 {quick.due}</b>}
              {quick.priority && <b>⚑ {quick.priority}</b>}
              {quick.recurrence !== 'none' && <b>↻ {quick.recurrence}</b>}
              {quick.tags.map((t) => <b key={t}>#{t}</b>)}
            </div>
          )}
        <small className="quick-hint">Tip: type “tomorrow p1 #home every week”, paste a list to add many, or press N to add a task.</small>
        {data.todos.some((t) => t.done && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()) && (
          <small className="quick-hint"> · ✓ {data.todos.filter((t) => t.done && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length} done today</small>
        )}
        <div className="filter-chips" role="tablist" aria-label="Task status filters">
          {[
            { id: 'open', label: 'Open' },
            { id: 'today', label: 'Due today' },
            { id: 'soon', label: 'Due soon' },
            { id: 'done', label: 'Done' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={filter === chip.id}
              onClick={() => setFilter(chip.id)}
            >
              {chip.label} ({filterCounts[chip.id as keyof typeof filterCounts]})
            </button>
          ))}
          {(taskQuery || filter !== 'open') && (
            <button type="button" className="quiet-button" onClick={() => { setFilter('open'); setTaskQuery('') }}>
              Reset filters
            </button>
          )}
        </div>
        {data.todos.length > 6 && (
          <input type="search" className="todo-search" aria-label="Search tasks" placeholder="Search tasks or #tags…" value={taskQuery} onChange={(e) => setTaskQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
        )}
        {data.todos.filter((t) => t.done).length > 2 && (
          <button
            type="button"
            className="clear-done"
            onClick={() => {
              const n = data.todos.filter((t) => t.done).length
              if (window.confirm(`Remove ${n} completed tasks? This can't be undone.`)) setData((d) => ({ ...d, todos: d.todos.filter((t) => !t.done) }))
            }}
          >
            Clear completed ({data.todos.filter((t) => t.done).length})
          </button>
        )}
        {overdue.length > 0 && (
          <div className="overdue-bar">
            <span>{overdue.length} overdue — shown first</span>
            <button type="button" onClick={() => overdue.forEach((t) => shiftDue(t.id, 0))}>Move all to today</button>
            <button type="button" onClick={() => setData((current) => overdue.reduce((d, t) => toggleTodo(d, t.id), current))}>Complete all</button>
          </div>
        )}
        {showOptions && (
          <>
            <div className="task-options">
              <label>
                Due
                <input
                  aria-label="Due date"
                  type="date"
                  value={due}
                  onChange={(event) => setDue(event.target.value)}
                  required
                />
                <span className="due-chips">
                  {([['Today', 0], ['Tomorrow', 1], ['Next week', 7]] as const).map(([label, n]) => {
                    const d = new Date()
                    d.setDate(d.getDate() + n)
                    const v = dayKey(d)
                    return (
                      <button key={label} type="button" aria-pressed={due === v} onClick={() => setDue(v)}>
                        {label}
                      </button>
                    )
                  })}
                </span>
              </label>
              <label>
                Priority
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as typeof priority)
                  }
                >
                  <option value="P1">P1 · Urgent</option>
                  <option value="P2">P2 · Important</option>
                  <option value="P3">P3 · Normal</option>
                  <option value="P4">P4 · Low</option>
                </select>
              </label>
              <label>
                Repeat
                <select
                  value={recurrence}
                  onChange={(event) =>
                    setRecurrence(event.target.value as typeof recurrence)
                  }
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="tag-field">
                Tags
                <input
                  aria-label="Tags"
                  placeholder="#deep-work, #errands"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
            </div>
            <TaskPlanningFields
              value={planning}
              onChange={setPlanning}
              projects={data.projects}
            />
          </>
        )}
      </form>
      <button type="button" className="waterdo-toggle" aria-pressed={waterDo} onClick={() => {
        setWaterDo((value) => {
          localStorage.setItem('bloom-waterdo', String(!value))
          return !value
        })
      }} aria-label="WaterDo bubble completion mode" title="WaterDo: pop bubbles to finish tasks">
        <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden="true"><circle cx="14" cy="14" r="10" /><path d="M8 11c1-3 3-5 6-5" /><circle cx="20" cy="19" r="1" /></svg>
        <span>WaterDo</span>
      </button>
      <div className="segmented" aria-label="Filter tasks">
        {['open', 'today', 'done'].map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value === 'today'
              ? 'Due today'
              : value === 'done'
                ? 'Completed'
                : 'All open'}
          </button>
        ))}
      </div>
      {allTags.length > 0 && (
        <div className="tag-filters" aria-label="Filter by tag">
          <button
            aria-pressed={tagFilter === 'all'}
            onClick={() => setTagFilter('all')}
          >
            All tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              aria-pressed={tagFilter === tag}
              onClick={() => setTagFilter(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
      {data.challenges.length > 0 && (
        <details className="goal-list">
          <summary>Goals · {data.challenges.length}</summary>
          {data.challenges.map((accepted) => {
            const goal = challenges.find((item) => item.id === accepted.id)
            if (!goal) return null
            const linked = data.todos.filter(
              (task) => task.challengeId === accepted.id,
            )
            return (
              <div key={accepted.id}>
                <strong>{goal.goal}</strong>
                <progress
                  aria-label={goal.goal}
                  value={linked.filter((task) => task.done).length}
                  max={linked.length}
                />
              </div>
            )
          })}
        </details>
      )}
      <ShowMore as="ul" key={`${filter}-${tagFilter}`} className="task-list" initial={10} label="tasks">
        {tasks.map((task) => {
          const completedSteps = task.subtasks.filter(
            (step) => step.done,
          ).length
          const open = expanded === task.id
          return (
            <li
              key={task.id}
              className={`task-item priority-${task.priority.toLowerCase()}`}
            >
              <div className="task-row">
                <button
                  className={`task-check ${task.done ? 'done' : ''} ${waterDo ? 'waterdo-bubble' : ''}`}
                  aria-label={`Complete ${task.title}`}
                  aria-pressed={task.done}
                  disabled={
                    !task.done && taskAvailability(data, task) !== 'available'
                  }
                  title={
                    taskAvailability(data, task) === 'blocked'
                      ? 'Complete earlier project actions first'
                      : taskAvailability(data, task) === 'deferred'
                        ? 'This action is deferred'
                        : undefined
                  }
                  onClick={(event) => {
                    if (waterDo && !task.done && !loadSettings().reducedMotion && !prefersReducedMotion()) {
                      const source = event.currentTarget
                      const rect = source.getBoundingClientRect()
                      const bubble = source.cloneNode(true) as HTMLElement
                      bubble.setAttribute('aria-hidden', 'true')
                      bubble.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;pointer-events:none;z-index:9999`
                      document.body.appendChild(bubble)
                      gsap.to(bubble, { scale: 1.8, opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: () => bubble.remove() })
                    }
                    // Heavy tasks become physics objects when completed.
                    const weight = task.done ? 0 : taskWeight(task)
                    const row = event.currentTarget.closest('.task-row')
                    if (
                      !waterDo && weight >= impactThreshold() &&
                      row &&
                      loadSettings().features.impactTasks &&
                      launchImpact({ taskId: task.id, title: task.title, rect: row.getBoundingClientRect(), weight })
                    ) {
                      // The physics body takes over; skip the small burst.
                    } else if (!task.done) burst(event.currentTarget)
                    setData((current) => toggleTodo(current, task.id))
                  }}
                >
                  {waterDo && !task.done ? <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true"><circle cx="14" cy="14" r="10" /><path d="M8 11c1-3 3-5 6-5" /></svg> : <Check size={18} />}
                </button>
                {editing === task.id ? (
                  <form
                    className="task-edit"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (!editTitle.trim()) return
                      setData((current) => ({
                        ...current,
                        todos: current.todos.map((item) =>
                          item.id === task.id
                            ? {
                                ...item,
                                title: editTitle.trim(),
                                due: editDue,
                                priority: editPriority,
                                tags: parseTags(editTags),
                                recurrence: editRecurrence,
                                planning: {
                                  ...editPlanning,
                                  context: editPlanning.context.trim(),
                                },
                                seriesId:
                                  editRecurrence === 'none'
                                    ? null
                                    : (item.seriesId ?? item.id),
                              }
                            : item,
                        ),
                      }))
                      setEditing(null)
                    }}
                  >
                    <input
                      aria-label="Task title"
                      autoFocus
                      maxLength={150}
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      required
                    />
                    <input
                      aria-label="Edit due date"
                      type="date"
                      value={editDue}
                      onChange={(event) => setEditDue(event.target.value)}
                      required
                    />
                    <select
                      aria-label="Edit priority"
                      value={editPriority}
                      onChange={(event) =>
                        setEditPriority(
                          event.target.value as typeof editPriority,
                        )
                      }
                    >
                      {['P1', 'P2', 'P3', 'P4'].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Edit recurrence"
                      value={editRecurrence}
                      onChange={(event) =>
                        setEditRecurrence(
                          event.target.value as typeof editRecurrence,
                        )
                      }
                    >
                      <option value="none">No repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <input
                      aria-label="Edit tags"
                      placeholder="#tags"
                      value={editTags}
                      onChange={(event) => setEditTags(event.target.value)}
                    />
                    <button aria-label="Save task">
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancel edit"
                      onClick={() => setEditing(null)}
                    >
                      <X size={16} />
                    </button>
                    <TaskPlanningFields
                      value={editPlanning}
                      onChange={setEditPlanning}
                      projects={data.projects}
                      prefix="Edit "
                    />
                  </form>
                ) : (
                  <div className="task-copy">
                    <div className="task-title-line">
                      <span
                        className={`priority-badge ${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                      <strong
                        tabIndex={0}
                        title="Enter or double-click to edit · 1–4 set priority"
                        onDoubleClick={(e) => e.currentTarget.closest('li')?.querySelector<HTMLButtonElement>('button[aria-label^="Edit "]')?.click()}
                        onKeyDown={(e) => {
                          if (/^[1-4]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                            e.preventDefault()
                            const p = `P${e.key}` as typeof task.priority
                            setData((d) => ({ ...d, todos: d.todos.map((x) => (x.id === task.id ? { ...x, priority: p } : x)) }))
                            return
                          }
                          if (e.key !== 'Enter') return
                          e.preventDefault()
                          e.currentTarget.closest('li')?.querySelector<HTMLButtonElement>('button[aria-label^="Edit "]')?.click()
                        }}
                      >
                        {task.title}
                      </strong>
                    </div>
                    <div className="task-meta">
                      <small className={!task.done && task.due < dayKey() ? 'task-overdue' : undefined}>{task.due}</small>
                      {task.planning && (
                        <>
                          <span>
                            {projectPath(data.projects, task.planning.projectId)
                              .map((p) => p.title)
                              .join(' / ') || 'Inbox'}
                          </span>
                          {task.planning.context && (
                            <span>@{task.planning.context}</span>
                          )}
                          {task.planning.energy !== 'any' && (
                            <span>{task.planning.energy} energy</span>
                          )}
                          {task.planning.timeOfDay !== 'any' && (
                            <span>{task.planning.timeOfDay}</span>
                          )}
                          <span>
                            {task.planning.minutes} min
                            {task.planning.deepWork ? ' / Deep work' : ''}
                          </span>
                        </>
                      )}
                      {!task.done &&
                        taskAvailability(data, task) !== 'available' && (
                          <span className="availability-badge">
                            {taskAvailability(data, task)}
                            {taskAvailability(data, task) === 'deferred'
                              ? ` until ${[planningOf(task).deferUntil, ...projectPath(data.projects, planningOf(task).projectId).map((p) => p.deferUntil)].sort().at(-1)}`
                              : ''}
                          </span>
                        )}
                      {task.recurrence !== 'none' && (
                        <span>
                          <Repeat2 size={12} /> {task.recurrence}
                        </span>
                      )}
                      {task.tags.map((tag) => (
                        <span className="task-tag" key={tag}>
                          <Tag size={11} />#{tag}
                        </span>
                      ))}
                      {task.challengeId ? (
                        <span>
                          {
                            challenges.find(
                              (item) => item.id === task.challengeId,
                            )?.title
                          }
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
                {editing !== task.id && !task.done && (
                  <span className="task-snooze">
                    <button type="button" title="Move to tomorrow" aria-label={`Move ${task.title} to tomorrow`} onClick={() => shiftDue(task.id, 1)}>→ Tmrw</button>
                    <button type="button" title="Snooze a week" aria-label={`Snooze ${task.title} a week`} onClick={() => shiftDue(task.id, 7)}>+1w</button>
                  </span>
                )}
                {editing !== task.id && (
                  <button
                    className="icon-button"
                    aria-label={`Edit ${task.title}`}
                    onClick={() => {
                      setEditing(task.id)
                      setEditTitle(task.title)
                      setEditDue(task.due)
                      setEditPriority(task.priority)
                      setEditTags(task.tags.map((tag) => `#${tag}`).join(' '))
                      setEditRecurrence(task.recurrence)
                      setEditPlanning(planningOf(task))
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
              <button
                className="checklist-toggle"
                aria-expanded={open}
                onClick={() => {
                  setExpanded(open ? null : task.id)
                  setSubtaskTitle('')
                }}
              >
                <ListTree size={15} />
                {task.subtasks.length
                  ? `${completedSteps}/${task.subtasks.length} steps`
                  : 'Add steps'}
                {task.subtasks.length > 0 && (
                  <span className="step-bar" aria-hidden="true"><i style={{ width: `${(completedSteps / task.subtasks.length) * 100}%` }} /></span>
                )}
                <ChevronDown size={14} className={open ? 'turned' : ''} />
              </button>
              {open && (
                <div className="checklist">
                  {task.subtasks.map((step) => (
                    <div className="checklist-item" key={step.id}>
                      <button
                        className={`mini-check ${step.done ? 'done' : ''}`}
                        aria-label={`${step.done ? 'Reopen' : 'Complete'} ${step.title}`}
                        onClick={() =>
                          setData((current) =>
                            toggleSubtask(current, task.id, step.id),
                          )
                        }
                      >
                        <Check size={13} />
                      </button>
                      <span className={step.done ? 'completed-copy' : ''}>
                        {step.title}
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${step.title}`}
                        onClick={() =>
                          setData((current) => ({
                            ...current,
                            todos: current.todos.map((item) =>
                              item.id === task.id
                                ? {
                                    ...item,
                                    subtasks: item.subtasks.filter(
                                      (candidate) => candidate.id !== step.id,
                                    ),
                                  }
                                : item,
                            ),
                          }))
                        }
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <form
                    className="subtask-add"
                    onSubmit={(event) => {
                      event.preventDefault()
                      setData((current) =>
                        addSubtask(current, task.id, subtaskTitle),
                      )
                      setSubtaskTitle('')
                    }}
                  >
                    <input
                      aria-label={`New step for ${task.title}`}
                      placeholder="Add a small next step"
                      maxLength={120}
                      value={subtaskTitle}
                      onChange={(event) => setSubtaskTitle(event.target.value)}
                      required
                    />
                    <button className="quiet-button" type="submit">
                      <Plus size={15} /> Add step
                    </button>
                  </form>
                </div>
              )}
            </li>
          )
        })}
      </ShowMore>
      {!tasks.length && (
        <div className="calm-empty">
          <Sprite name="fox" label="Resting fox" size={64} />
          <p>
            {filter === 'done'
              ? 'Your completed tasks will appear here.'
              : 'A little breathing room.'}
          </p>
        </div>
      )}
    </section>
  )
}
