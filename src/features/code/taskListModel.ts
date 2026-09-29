export type TaskItem = { id: string; title: string; done: boolean }
export type TaskFilter = 'all' | 'active' | 'done'

export function addTask(items: TaskItem[], title: string, id: string): TaskItem[] {
  const clean = title.trim()
  if (clean.length < 2 || !id) return items
  return [...items, { id, title: clean, done: false }]
}
export function toggleTask(items: TaskItem[], id: string): TaskItem[] {
  return items.map((item) => item.id === id ? { ...item, done: !item.done } : item)
}
export function removeTask(items: TaskItem[], id: string): TaskItem[] {
  return items.filter((item) => item.id !== id)
}
export function visibleTasks(items: TaskItem[], filter: TaskFilter): TaskItem[] {
  return filter === 'all' ? items : items.filter((item) => filter === 'done' ? item.done : !item.done)
}
export function parseTaskList(raw: string | null): TaskItem[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.filter((item): item is TaskItem => !!item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.done === 'boolean').slice(0, 100)
  } catch { return [] }
}
