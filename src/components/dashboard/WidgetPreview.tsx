import type { Dispatch, SetStateAction } from 'react'
import { toggleHabit, type AppData } from '../../model'
import type { NavKey } from '../layout/Sidebar'

type Props = {
  page: NavKey
  data: AppData
  today: string
  setData: Dispatch<SetStateAction<AppData>>
}

export function WidgetPreview({ page, data, today, setData }: Props) {
  const pending = data.todos.filter((task) => !task.done)
  const plans = data.plans.filter((plan) => plan.date === today)
  const blocks = data.calendarBlocks
    .filter((block) => block.start.slice(0, 10) === today)
    .sort((a, b) => a.start.localeCompare(b.start))
  const todaySessions = data.sessions.filter(
    (session) => session.metadata.date.slice(0, 10) === today,
  )
  const todayUrges = data.urgeEvents.filter(
    (event) => new Date(event.timestamp).toLocaleDateString('en-CA') === today,
  )
  switch (page) {
    case 'habits':
      return (
        <div className="widget-preview">
          <small>
            {data.habits.filter((habit) => habit.dates.includes(today)).length}/
            {data.habits.length} complete today
          </small>
          {data.habits.slice(0, 2).map((habit) => (
            <label key={habit.id}>
              <input
                type="checkbox"
                checked={habit.dates.includes(today)}
                onChange={() =>
                  setData((current) => toggleHabit(current, habit.id, today))
                }
              />
              {habit.title}
            </label>
          ))}
        </div>
      )
    case 'todos':
      return (
        <div className="widget-preview">
          <small>{pending.length} to do</small>
          {pending.slice(0, 2).map((task) => (
            <label key={task.id}>
              <input
                type="checkbox"
                checked={false}
                onChange={() =>
                  setData((current) => ({
                    ...current,
                    todos: current.todos.map((item) =>
                      item.id === task.id
                        ? { ...item, done: true, completedAt: Date.now() }
                        : item,
                    ),
                  }))
                }
              />
              {task.title}
            </label>
          ))}
        </div>
      )
    case 'planning':
      return (
        <div className="widget-preview">
          <small>
            {plans.filter((plan) => plan.done).length}/{plans.length} intentions
            complete
          </small>
          {plans
            .filter((plan) => !plan.done)
            .slice(0, 2)
            .map((plan) => (
              <label key={plan.id}>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() =>
                    setData((current) => ({
                      ...current,
                      plans: current.plans.map((item) =>
                        item.id === plan.id ? { ...item, done: true } : item,
                      ),
                    }))
                  }
                />
                {plan.title}
              </label>
            ))}
        </div>
      )
    case 'calendar':
      return (
        <div className="widget-preview">
          <small>{blocks.length} blocks today</small>
          {blocks.slice(0, 2).map((block) => (
            <span key={block.id}>
              {new Date(block.start).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              · {block.title}
            </span>
          ))}
        </div>
      )
    case 'journal':
    case 'daybook':
      return (
        <div className="widget-preview">
          <small>{todaySessions.length} reflections today</small>
          <span>{data.sessions.length} reflections saved</span>
        </div>
      )
    case 'routines':
      return (
        <div className="widget-preview">
          <small>{data.routines?.length ?? 0} routines</small>
          <span>
            {data.routines?.filter((routine) => routine.dates.includes(today))
              .length ?? 0}{' '}
            completed today
          </span>
        </div>
      )
    case 'urges':
      return (
        <div className="widget-preview">
          <small>{todayUrges.length} check-ins today</small>
          <span>
            {data.urgeHabits.filter((habit) => !habit.archived).length} patterns
            tracked
          </span>
        </div>
      )
    case 'challenges':
      return (
        <div className="widget-preview">
          <small>{data.challenges.length} challenges accepted</small>
          <span>
            {data.challenges.filter((challenge) => challenge.rewarded).length}{' '}
            rewards earned
          </span>
        </div>
      )
    case 'growth':
      return (
        <div className="widget-preview">
          <small>
            {data.habits.reduce((sum, habit) => sum + habit.dates.length, 0)}{' '}
            habit check-ins
          </small>
          <span>{data.sessions.length} reflections</span>
        </div>
      )
    case 'epiphanies':
      return (
        <div className="widget-preview">
          <small>{data.savedMemories?.length ?? 0} memories saved</small>
        </div>
      )
    case 'focus':
    case 'focus-room':
      return (
        <div className="widget-preview">
          <small>
            {
              data.todos.filter((task) => task.priority === 'P1' && !task.done)
                .length
            }{' '}
            top priorities waiting
          </small>
          {pending[0] && <span>Next: {pending[0].title}</span>}
        </div>
      )
    case 'affirm':
      return (
        <div className="widget-preview">
          <small>
            {data.affirmation || 'Add an affirmation to carry with you today.'}
          </small>
        </div>
      )
    default:
      return null
  }
}
