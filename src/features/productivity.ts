import type { AppData } from '../model'
import { id as createId } from '../model'
import { dayKey } from '../dates'
import { planningOf, taskAvailability } from './planning'

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export function nextRecurringDate(due: string, recurrence: Recurrence) {
  const [year, month, day] = due.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  if (recurrence === 'daily') date.setDate(date.getDate() + 1)
  if (recurrence === 'weekly') date.setDate(date.getDate() + 7)
  if (recurrence === 'monthly') {
    const targetMonth = date.getMonth() + 1
    date.setDate(1)
    date.setMonth(targetMonth)
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate()
    date.setDate(Math.min(day, lastDay))
  }
  return dayKey(date)
}

export function toggleSubtask(
  data: AppData,
  todoId: string,
  subtaskId: string,
): AppData {
  return {
    ...data,
    todos: data.todos.map((task) =>
      task.id === todoId
        ? {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, done: !subtask.done }
                : subtask,
            ),
          }
        : task,
    ),
  }
}

export function addSubtask(
  data: AppData,
  todoId: string,
  title: string,
): AppData {
  const trimmed = title.trim()
  if (!trimmed) return data
  return {
    ...data,
    todos: data.todos.map((task) =>
      task.id === todoId
        ? {
            ...task,
            subtasks: [
              ...task.subtasks,
              { id: createId(), title: trimmed, done: false },
            ],
          }
        : task,
    ),
  }
}

export const challenges = [
  {
    id: 'small-start',
    title: 'Small beginnings',
    goal: 'Build a three-day rhythm',
    days: 3,
    sprite: 'hero-0',
    reward: 30,
    tasks: [
      'Choose one small habit',
      'Make time for it again',
      'Reflect on what helped',
    ],
  },
  {
    id: 'focus-path',
    title: 'Find your focus',
    goal: 'Make space for deep work',
    days: 3,
    sprite: 'spirit',
    reward: 40,
    tasks: [
      'Clear one distraction',
      'Complete a focus session',
      'Plan your next focus block',
    ],
  },
  {
    id: 'kind-week',
    title: 'A kinder week',
    goal: 'Practice one small act of care each day',
    days: 5,
    sprite: 'fox',
    reward: 50,
    tasks: [
      'Take a screen-free break',
      'Write down one good thing',
      'Make time to move',
      'Reach out to someone',
      'Reflect on your week',
    ],
  },
] as const
export function acceptChallenge(
  data: AppData,
  challengeId: string,
  now = Date.now(),
): AppData {
  const challenge = challenges.find((item) => item.id === challengeId)
  if (!challenge || data.challenges.some((item) => item.id === challengeId))
    return data
  const tasks = challenge.tasks.map((title, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() + index)
    return {
      id: `challenge:${challengeId}:${index}`,
      title,
      done: false,
      due: dayKey(date),
      challengeId,
      rewarded: false,
      priority: 'P3' as const,
      tags: ['challenge'],
      recurrence: 'none' as const,
      seriesId: null,
      subtasks: [],
    }
  })
  return {
    ...data,
    todos: [...data.todos, ...tasks],
    challenges: [
      ...data.challenges,
      { id: challengeId, acceptedAt: now, rewarded: false },
    ],
  }
}
export function toggleTodo(
  data: AppData,
  id: string,
  now = Date.now(),
): AppData {
  const task = data.todos.find((item) => item.id === id)
  if (!task) return data
  if (!task.done && taskAvailability(data, task, new Date(now)) !== 'available')
    return data
  const earn = !task.done && !task.rewarded
  const completing = !task.done
  const seriesId = task.seriesId ?? task.id
  const nextDue =
    completing && task.recurrence !== 'none'
      ? nextRecurringDate(task.due, task.recurrence)
      : null
  const recurrenceExists = nextDue
    ? data.todos.some(
        (item) => item.seriesId === seriesId && item.due === nextDue,
      )
    : false
  let next: AppData = {
    ...data,
    todos: [
      ...data.todos.map((item) =>
        item.id === id
          ? {
              ...item,
              done: !item.done,
              completedAt: completing ? now : null,
              rewarded: item.rewarded || earn,
            }
          : item,
      ),
      ...(nextDue && !recurrenceExists
        ? [
            {
              ...task,
              id: `recurrence:${seriesId}:${nextDue}`,
              due: nextDue,
              done: false,
              completedAt: null,
              rewarded: false,
              ...(task.planning
                ? {
                    planning: {
                      ...planningOf(task),
                      order: now,
                      deferUntil: task.planning.deferUntil
                        ? nextRecurringDate(
                            task.planning.deferUntil,
                            task.recurrence,
                          )
                        : '',
                    },
                  }
                : {}),
              seriesId,
              subtasks: task.subtasks.map((subtask) => ({
                ...subtask,
                id: createId(),
                done: false,
              })),
            },
          ]
        : []),
    ],
  }
  const reward = (key: string, exp: number, gold: number) => {
    next = {
      ...next,
      rpg: {
        ...next.rpg,
        gold: next.rpg.gold + gold,
        ledger: {
          ...next.rpg.ledger,
          [key]: {
            day: dayKey(new Date(now)),
            at: now,
            exp,
            gold,
            stat: 'spirit',
            points: 2,
            active: true,
            kind: 'priority',
            sourceId: key,
          },
        },
      },
    }
  }
  if (earn)
    reward(
      `todo:${id}`,
      10 + (data.rpg.skills.zen?.state === 'unlocked' ? 5 : 0),
      2,
    )
  for (const accepted of next.challenges) {
    const definition = challenges.find((item) => item.id === accepted.id)
    const tasks = next.todos.filter((item) => item.challengeId === accepted.id)
    if (
      definition &&
      !accepted.rewarded &&
      tasks.length === definition.tasks.length &&
      tasks.every((item) => item.done)
    ) {
      reward(`challenge:${accepted.id}`, definition.reward, 10)
      next = {
        ...next,
        challenges: next.challenges.map((item) =>
          item.id === accepted.id ? { ...item, rewarded: true } : item,
        ),
      }
    }
  }
  return next
}
