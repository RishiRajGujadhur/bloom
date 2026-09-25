import type { AppData } from '../model'
import { dayKey } from '../dates'

export type ActivityDay = {
  date: string
  tasks: number
  focus: number
  journals: number
  habits: number
  mood: number | null
}
export type Memory = {
  id: string
  date: string
  title: string
  detail: string
  kind: 'journal' | 'focus' | 'task' | 'milestone'
}
export const localDate = (value: number | string) => dayKey(new Date(value))

export function activityDays(data: AppData): ActivityDay[] {
  const days = new Map<string, ActivityDay>()
  const get = (date: string) => {
    if (!days.has(date))
      days.set(date, {
        date,
        tasks: 0,
        focus: 0,
        journals: 0,
        habits: 0,
        mood: null,
      })
    return days.get(date)!
  }
  for (const task of data.todos)
    if (task.done && task.completedAt) get(localDate(task.completedAt)).tasks++
  for (const session of data.rpg.focusHistory)
    get(localDate(session.completedAt)).focus += session.minutes
  const moods = new Map<string, number[]>()
  for (const session of data.sessions) {
    const date = localDate(session.metadata.date)
    get(date).journals++
    if (session.metadata.mood !== null)
      moods.set(date, [...(moods.get(date) ?? []), session.metadata.mood])
  }
  for (const [date, values] of moods)
    get(date).mood = values.reduce((a, b) => a + b, 0) / values.length
  for (const habit of data.habits)
    for (const date of new Set(habit.dates)) get(date).habits++
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function memories(data: AppData): Memory[] {
  const result: Memory[] = [
    {
      id: 'joined',
      date: localDate(data.rpg.createdAt),
      title: 'Your Bloom began',
      detail: 'A little space to grow, at your own pace.',
      kind: 'milestone',
    },
  ]
  for (const entry of data.sessions) {
    const words = entry.messages
      .filter((m) => m.sender === 'user')
      .map((m) => m.text)
      .join(' ')
    result.push({
      id: `journal:${entry.metadata.id}`,
      date: localDate(entry.metadata.date),
      title: words.slice(0, 80) || 'A quiet reflection',
      detail: words || 'A moment recorded in your journal.',
      kind: 'journal',
    })
  }
  for (const entry of data.rpg.focusHistory)
    result.push({
      id: `focus:${entry.id}`,
      date: localDate(entry.completedAt),
      title: `${entry.minutes} minutes of focus`,
      detail: entry.taskTitle || 'Made room for one thing at a time.',
      kind: 'focus',
    })
  const tasks = data.todos
    .filter((t) => t.done && t.completedAt)
    .sort((a, b) => a.completedAt! - b.completedAt!)
  for (const task of tasks)
    result.push({
      id: `task:${task.id}`,
      date: localDate(task.completedAt!),
      title: task.title,
      detail: 'Task completed',
      kind: 'task',
    })
  for (const [kind, entries] of [
    ['task', tasks.map((t) => localDate(t.completedAt!))],
    ['journal', data.sessions.map((s) => localDate(s.metadata.date)).sort()],
    [
      'focus',
      data.rpg.focusHistory.map((s) => localDate(s.completedAt)).sort(),
    ],
  ] as const) {
    for (const count of [1, 10, 100, 500, 1000])
      if (entries.length >= count)
        result.push({
          id: `${kind}-milestone:${count}`,
          date: entries[count - 1],
          title:
            count === 1
              ? `First recorded ${kind}`
              : `${count} recorded ${kind} moments`,
          detail: 'A milestone in your recorded history.',
          kind: 'milestone',
        })
  }
  return result.sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  )
}
