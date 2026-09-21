import type {
  AppData,
  CalendarBlock,
  Perspective,
  Project,
  TaskPlanning,
  Todo,
} from '../model'
import { dayKey } from '../dates'

export const emptyPlanning: TaskPlanning = {
  projectId: null,
  deferUntil: '',
  context: '',
  energy: 'any',
  timeOfDay: 'any',
  minutes: 30,
  deepWork: false,
  order: 0,
}
export const emptyPerspective: Omit<Perspective, 'id' | 'title'> = {
  projectId: 'all',
  context: '',
  energy: 'any',
  timeOfDay: 'any',
  availability: 'all',
}
export const planningOf = (task: Todo): TaskPlanning => ({
  ...emptyPlanning,
  ...task.planning,
})

export function projectPath(projects: Project[], id: string | null): Project[] {
  const path: Project[] = []
  const seen = new Set<string>()
  while (id && !seen.has(id)) {
    seen.add(id)
    const project = projects.find((item) => item.id === id)
    if (!project) break
    path.unshift(project)
    id = project.parentId
  }
  return path
}

export function projectTasks(data: AppData, projectId: string): Todo[] {
  return data.todos.filter((task) =>
    projectPath(data.projects, planningOf(task).projectId).some(
      (project) => project.id === projectId,
    ),
  )
}

export function projectChildren(data: AppData, parentId: string | null) {
  return [
    ...data.projects
      .filter((p) => p.parentId === parentId)
      .map((p) => ({
        id: p.id,
        kind: 'project' as const,
        order: p.order,
        done: projectTasks(data, p.id).every((t) => t.done),
      })),
    ...data.todos
      .filter((t) => planningOf(t).projectId === parentId)
      .map((t) => ({
        id: t.id,
        kind: 'task' as const,
        order: planningOf(t).order,
        done: t.done,
      })),
  ].sort((a, b) => a.order - b.order)
}

export function taskAvailability(
  data: AppData,
  task: Todo,
  now = new Date(),
): 'available' | 'deferred' | 'blocked' | 'done' {
  if (task.done) return 'done'
  const planning = planningOf(task)
  const path = projectPath(data.projects, planning.projectId)
  const today = dayKey(now)
  if (planning.deferUntil > today || path.some((p) => p.deferUntil > today))
    return 'deferred'
  for (let index = 0; index < path.length; index++) {
    const project = path[index]
    if (project.mode !== 'sequential') continue
    const currentId = path[index + 1]?.id ?? task.id
    const siblings = projectChildren(data, project.id)
    const position = siblings.findIndex((item) => item.id === currentId)
    if (siblings.slice(0, position).some((item) => !item.done)) return 'blocked'
  }
  return 'available'
}

export function matchesPerspective(
  data: AppData,
  task: Todo,
  filter: Omit<Perspective, 'id' | 'title'>,
  now = new Date(),
) {
  const plan = planningOf(task)
  return (
    (filter.projectId === 'all' ||
      (filter.projectId === 'inbox'
        ? !plan.projectId
        : projectPath(data.projects, plan.projectId).some(
            (p) => p.id === filter.projectId,
          ))) &&
    (!filter.context ||
      plan.context.toLowerCase() === filter.context.toLowerCase()) &&
    (filter.energy === 'any' || plan.energy === filter.energy) &&
    (filter.timeOfDay === 'any' || plan.timeOfDay === filter.timeOfDay) &&
    (filter.availability === 'all' ||
      taskAvailability(data, task, now) === filter.availability)
  )
}

export function moveAction(
  data: AppData,
  parentId: string | null,
  actionId: string,
  direction: -1 | 1,
): AppData {
  const children = projectChildren(data, parentId)
  const index = children.findIndex((child) => child.id === actionId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= children.length) return data
  ;[children[index], children[target]] = [children[target], children[index]]
  const orders = new Map(children.map((child, order) => [child.id, order]))
  return {
    ...data,
    projects: data.projects.map((p) =>
      orders.has(p.id) ? { ...p, order: orders.get(p.id)! } : p,
    ),
    todos: data.todos.map((t) =>
      orders.has(t.id)
        ? { ...t, planning: { ...planningOf(t), order: orders.get(t.id)! } }
        : t,
    ),
  }
}

export function deleteProject(data: AppData, id: string): AppData {
  const project = data.projects.find((p) => p.id === id)
  if (!project) return data
  const parentId = project.parentId
  // Promote children in place so deleting a container preserves action order.
  const siblings = projectChildren(data, parentId).flatMap((child) =>
    child.id === id ? projectChildren(data, id) : [child],
  )
  const orders = new Map(siblings.map((child, order) => [child.id, order]))
  return {
    ...data,
    projects: data.projects
      .filter((p) => p.id !== id)
      .map((p) => ({
        ...p,
        parentId: p.parentId === id ? parentId : p.parentId,
        order: orders.get(p.id) ?? p.order,
      })),
    todos: data.todos.map((t) =>
      planningOf(t).projectId === id || orders.has(t.id)
        ? {
            ...t,
            planning: {
              ...planningOf(t),
              projectId:
                planningOf(t).projectId === id
                  ? parentId
                  : planningOf(t).projectId,
              order: orders.get(t.id) ?? planningOf(t).order,
            },
          }
        : t,
    ),
    perspectives: data.perspectives.map((p) =>
      p.projectId === id ? { ...p, projectId: parentId ?? 'inbox' } : p,
    ),
  }
}

export function blockError(data: AppData, block: CalendarBlock): string {
  const start = new Date(block.start),
    end = new Date(block.end)
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start)
    return 'Choose an end time after the start.'
  if (!block.title.trim()) return 'Give this block a title.'
  if (
    data.calendarBlocks.some(
      (b) =>
        b.id !== block.id &&
        Date.parse(b.start) < +end &&
        Date.parse(b.end) > +start,
    )
  )
    return 'This time overlaps another block.'
  if (block.taskId) {
    const task = data.todos.find((t) => t.id === block.taskId)
    if (!task) return 'This task no longer exists.'
    const state = taskAvailability(data, task, start)
    if (state !== 'available')
      return state === 'deferred'
        ? 'This task is deferred until a later date.'
        : state === 'blocked'
          ? 'Complete the earlier project actions first.'
          : 'This task is already completed.'
  }
  return ''
}

export function dayCapacity(data: AppData, day: string) {
  const start = new Date(`${day}T00:00:00`),
    end = new Date(start)
  start.setHours(data.calendarHours.start)
  end.setHours(data.calendarHours.end)
  const intervals = data.calendarBlocks
    .map((block) => ({
      start: Math.max(+start, Date.parse(block.start)),
      end: Math.min(+end, Date.parse(block.end)),
      deepWork: block.deepWork,
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start)
  const sumUnion = (items: typeof intervals) => {
    let total = 0,
      edge = +start
    for (const item of items) {
      total += Math.max(0, item.end - Math.max(edge, item.start))
      edge = Math.max(edge, item.end)
    }
    return total / 60000
  }
  const capacity = (+end - +start) / 60000,
    booked = sumUnion(intervals)
  return {
    capacity,
    booked,
    free: capacity - booked,
    deep: sumUnion(intervals.filter((b) => b.deepWork)),
  }
}
