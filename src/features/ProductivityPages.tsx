import { useState, type Dispatch, type SetStateAction } from 'react'
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
  return (
    <div id="challenges-page">
      <div className="choice-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => {
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
      </div>
      <p role="status">{notice}</p>
    </div>
  )
}
export function TodoPage({ data, setData }: Props) {
  const [planning, setPlanning] = useState({ ...emptyPlanning })
  const [editPlanning, setEditPlanning] = useState({ ...emptyPlanning })
  const [perspective, setPerspective] = useState<PlanningFilter>({
    ...emptyPerspective,
  })
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(dayKey)
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P3')
  const [tags, setTags] = useState('')
  const [recurrence, setRecurrence] = useState<
    'none' | 'daily' | 'weekly' | 'monthly'
  >('none')
  const [showOptions, setShowOptions] = useState(false)
  const [filter, setFilter] = useState('open')
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
  const allTags = [...new Set(data.todos.flatMap((task) => task.tags))].sort()
  const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 }
  const tasks = data.todos
    .filter((task) => {
      const matchesStatus =
        filter === 'done'
          ? task.done
          : filter === 'today'
            ? !task.done && task.due <= dayKey()
            : !task.done
      return (
        matchesStatus &&
        (tagFilter === 'all' || task.tags.includes(tagFilter)) &&
        matchesPerspective(data, task, perspective)
      )
    })
    .sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.due.localeCompare(b.due),
    )
  const add = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setData((current) => ({
      ...current,
      todos: [
        ...current.todos,
        {
          id: id(),
          title: title.trim(),
          due,
          done: false,
          challengeId: null,
          rewarded: false,
          priority,
          tags: parseTags(tags),
          recurrence,
          seriesId: recurrence === 'none' ? null : id(),
          subtasks: [],
          planning: {
            ...planning,
            context: planning.context.trim(),
            order: Date.now(),
          },
        },
      ],
    }))
    setTitle('')
    setTags('')
  }
  return (
    <section id="todo-page" className="task-workspace planning-workspace">
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
      <form className="task-composer" onSubmit={add}>
        <div className="task-add">
          <input
            aria-label="New task"
            placeholder="What needs doing?"
            maxLength={150}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
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
      <ul className="task-list">
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
                  className={`task-check ${task.done ? 'done' : ''}`}
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
                  onClick={() =>
                    setData((current) => toggleTodo(current, task.id))
                  }
                >
                  <Check size={18} />
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
                      <strong>{task.title}</strong>
                    </div>
                    <div className="task-meta">
                      <small>{task.due}</small>
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
      </ul>
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
