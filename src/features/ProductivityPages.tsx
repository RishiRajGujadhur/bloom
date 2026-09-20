import { useState, type Dispatch, type SetStateAction } from 'react'
import { ArrowRight, Check, Plus, Pencil, X } from 'lucide-react'
import type { AppData } from '../model'
import { dayKey, id } from '../model'
import { Sprite } from '../rpg/Sprite'
import { acceptChallenge, challenges, toggleTodo } from './productivity'

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
      <div className="choice-grid">
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
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(dayKey)
  const [filter, setFilter] = useState('open')
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDue, setEditDue] = useState('')
  const tasks = data.todos.filter((task) =>
    filter === 'done'
      ? task.done
      : filter === 'today'
        ? !task.done && task.due <= dayKey()
        : !task.done,
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
        },
      ],
    }))
    setTitle('')
  }
  return (
    <section id="todo-page" className="card task-workspace">
      <form className="task-add" onSubmit={add}>
        <input
          aria-label="New task"
          placeholder="What needs doing?"
          maxLength={150}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <input
          aria-label="Due date"
          type="date"
          value={due}
          onChange={(event) => setDue(event.target.value)}
          required
        />
        <button className="primary" type="submit">
          <Plus size={17} /> Add
        </button>
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
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              className={`task-check ${task.done ? 'done' : ''}`}
              aria-label={`Complete ${task.title}`}
              aria-pressed={task.done}
              onClick={() => setData((current) => toggleTodo(current, task.id))}
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
                        ? { ...item, title: editTitle.trim(), due: editDue }
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
              </form>
            ) : (
              <div className="task-copy">
                <strong>{task.title}</strong>
                <small>
                  {task.due}
                  {task.challengeId
                    ? ` · ${challenges.find((item) => item.id === task.challengeId)?.title}`
                    : ''}
                </small>
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
                }}
              >
                <Pencil size={16} />
              </button>
            )}
          </li>
        ))}
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
