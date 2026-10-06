import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { prefersReducedMotion } from '../../utils/motion'
import { addTask, parseTaskList, removeTask, toggleTask, visibleTasks, type TaskFilter, type TaskItem } from './taskListModel'
import './taskListCapstone.css'

const TASKS_KEY = 'bloom-code-task-capstone-v1'
const STEPS_KEY = 'bloom-code-task-capstone-steps-v1'
const STEPS = [
  { id: 'add', title: 'Add a task', concept: 'Form event + validation' },
  { id: 'complete', title: 'Complete a task', concept: 'Immutable array update' },
  { id: 'filter', title: 'Filter the list', concept: 'Array filter' },
  { id: 'remove', title: 'Remove a task', concept: 'Array removal' },
  { id: 'restore', title: 'Restore saved work', concept: 'localStorage' },
] as const
type StepId = typeof STEPS[number]['id']
type Progress = Partial<Record<StepId, boolean>>
function readTasks() { try { return parseTaskList(localStorage.getItem(TASKS_KEY)) } catch { return [] } }
function readProgress(): Progress { try { const value = JSON.parse(localStorage.getItem(STEPS_KEY) ?? 'null'); return value && typeof value === 'object' ? value : {} } catch { return {} } }

export function TaskListCapstone({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<TaskItem[]>(readTasks)
  const [progress, setProgress] = useState<Progress>(readProgress)
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [feedback, setFeedback] = useState('Build the list and complete each milestone.')
  const ring = useRef<SVGCircleElement>(null)
  const doneCount = STEPS.filter((item) => progress[item.id]).length
  const visible = visibleTasks(items, filter)
  const completed = items.filter((item) => item.done).length

  useLayoutEffect(() => {
    if (!ring.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(ring.current, { strokeDasharray: `0 283` }, { strokeDasharray: `${(doneCount / STEPS.length) * 283} 283`, duration: .55, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [doneCount])
  const saveItems = (next: TaskItem[]) => { setItems(next); try { localStorage.setItem(TASKS_KEY, JSON.stringify(next)) } catch { setFeedback('Storage is unavailable; the list remains in this session.') } }
  const mark = (step: StepId) => { const next = { ...progress, [step]: true }; setProgress(next); try { localStorage.setItem(STEPS_KEY, JSON.stringify(next)) } catch { /* retain session state */ } }
  const add = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = addTask(items, draft, crypto.randomUUID())
    if (next === items) { setFeedback('Enter at least two characters for a task.'); return }
    saveItems(next); setDraft(''); mark('add'); setFeedback('Task added and saved. Now complete one.')
  }
  const toggle = (id: string) => { saveItems(toggleTask(items, id)); mark('complete'); setFeedback('Task state updated and saved.') }
  const remove = (id: string) => { saveItems(removeTask(items, id)); mark('remove'); setFeedback('Task removed and storage updated.') }
  const chooseFilter = (next: TaskFilter) => { setFilter(next); if (next !== 'all') mark('filter'); setFeedback(`Showing ${next} tasks.`) }
  const restore = () => { const next = readTasks(); setItems(next); mark('restore'); setFeedback(`Restored ${next.length} saved ${next.length === 1 ? 'task' : 'tasks'} from localStorage.`) }

  return <LearningExercise className="task-capstone" aria-label="Interactive task list capstone" title={<>Ship your task list</>} description={<>Use form events, array updates, filters, and localStorage to build a working list. Complete all five milestones.</>} onClose={onClose}>

    <div className="task-capstone-grid"><div className="task-capstone-app"><h3>My tasks</h3><form onSubmit={add}><label htmlFor="capstone-title">New task</label><div><input id="capstone-title" value={draft} maxLength={100} onChange={(event) => setDraft(event.target.value)} placeholder="What needs doing?" /><button type="submit">Add task</button></div></form><div className="task-capstone-filters bloom-wrap" role="group" aria-label="Filter tasks">{(['all', 'active', 'done'] as const).map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => chooseFilter(option)}>{option[0].toUpperCase() + option.slice(1)}</button>)}</div><ul>{visible.map((item) => <li key={item.id}><label><input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} /><span className={item.done ? 'task-capstone-finished' : ''}>{item.title}</span></label><button type="button" aria-label={`Remove ${item.title}`} onClick={() => remove(item.id)}>Remove</button></li>)}</ul>{visible.length === 0 && <p>No tasks in this view.</p>}<div className="task-capstone-footer"><span>{completed} of {items.length} complete</span><button type="button" onClick={restore}>Restore saved list</button></div><p role="status">{feedback}</p></div>
    <div className="task-capstone-progress"><h3>Build checklist</h3><svg viewBox="0 0 120 120" role="img" aria-label={`${doneCount} of 5 milestones complete`}><circle cx="60" cy="60" r="45" className="task-capstone-track" /><circle ref={ring} cx="60" cy="60" r="45" className="task-capstone-fill" strokeDasharray={`${(doneCount / STEPS.length) * 283} 283`} /><text x="60" y="67" textAnchor="middle">{doneCount}/5</text></svg><ol>{STEPS.map((step) => <li key={step.id}><span aria-hidden="true">{progress[step.id] ? '✓' : '○'}</span><div><strong>{step.title}</strong><small>{step.concept}</small></div></li>)}</ol>{doneCount === STEPS.length && <p className="task-capstone-done" role="status">Capstone complete. Your task list is saved.</p>}</div></div>
  </LearningExercise>
}
