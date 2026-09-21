import {
  defaults,
  parseData,
  projectSchema,
  taskSchema,
  type CalendarBlock,
} from '../src/model'
import {
  blockError,
  dayCapacity,
  deleteProject,
  emptyPerspective,
  matchesPerspective,
  moveAction,
  projectPath,
  taskAvailability,
} from '../src/features/planning'
import { toggleTodo } from '../src/features/productivity'

const task = (id: string, projectId: string | null, order: number) =>
  taskSchema.parse({
    id,
    title: id,
    done: false,
    due: '2026-09-21',
    challengeId: null,
    planning: { projectId, order },
  })
const project = (
  id: string,
  parentId: string | null,
  mode = 'parallel',
  order = 0,
) => projectSchema.parse({ id, title: id, parentId, mode, order })
const today = new Date('2026-09-21T12:00:00')
const block = (
  id: string,
  start: string,
  end: string,
  taskId: string | null = null,
): CalendarBlock => ({
  id,
  title: id,
  start: new Date(`2026-09-21T${start}:00`).toISOString(),
  end: new Date(`2026-09-21T${end}:00`).toISOString(),
  taskId,
  deepWork: true,
})

test('older saves migrate without losing tasks and new planning data round trips', () => {
  const old = { ...defaults(), todos: [task('existing', null, 0)] } as Record<
    string,
    unknown
  >
  delete old.projects
  delete old.perspectives
  delete old.calendarBlocks
  delete old.calendarHours
  const loaded = parseData(old)
  expect(loaded.projects).toEqual([])
  expect(loaded.todos[0].title).toBe('existing')
  loaded.projects.push(project('parent', null))
  loaded.perspectives.push({
    ...emptyPerspective,
    id: 'morning',
    title: 'Morning work',
    context: 'Office',
    energy: 'high',
    timeOfDay: 'morning',
  })
  loaded.calendarBlocks.push(block('work', '09:00', '10:00', 'existing'))
  expect(parseData(JSON.parse(JSON.stringify(loaded)))).toEqual(loaded)
})

test('nested sequential projects wait for every action in the preceding parallel project', () => {
  let data = defaults()
  data.projects = [
    project('launch', null, 'sequential'),
    project('prepare', 'launch', 'parallel', 0),
    project('publish', 'launch', 'sequential', 1),
  ]
  data.todos = [
    task('research', 'prepare', 0),
    task('draft', 'prepare', 1),
    task('release', 'publish', 0),
    task('announce', 'publish', 1),
  ]
  expect(taskAvailability(data, data.todos[0], today)).toBe('available')
  expect(taskAvailability(data, data.todos[1], today)).toBe('available')
  expect(taskAvailability(data, data.todos[2], today)).toBe('blocked')
  expect(toggleTodo(data, 'release', +today)).toBe(data)
  data = toggleTodo(data, 'research', +today)
  expect(taskAvailability(data, data.todos[2], today)).toBe('blocked')
  data = toggleTodo(data, 'draft', +today)
  expect(taskAvailability(data, data.todos[2], today)).toBe('available')
  expect(taskAvailability(data, data.todos[3], today)).toBe('blocked')
  data = toggleTodo(data, 'release', +today)
  expect(taskAvailability(data, data.todos[3], today)).toBe('available')
})

test('deferral inherits from ancestors and deferred first actions still block later actions', () => {
  const data = defaults()
  data.projects = [
    project('parent', null, 'sequential'),
    project('child', 'parent'),
  ]
  data.todos = [task('first', 'child', 0), task('second', 'parent', 1)]
  data.projects[1].deferUntil = '2026-09-22'
  expect(taskAvailability(data, data.todos[0], today)).toBe('deferred')
  expect(taskAvailability(data, data.todos[1], today)).toBe('blocked')
  expect(
    taskAvailability(data, data.todos[0], new Date('2026-09-22T00:00:00')),
  ).toBe('available')
})

test('reordering actions changes the available next action and deleting a project preserves children', () => {
  let data = defaults()
  data.projects = [
    project('root', null, 'sequential'),
    project('child', 'root', 'parallel', 0),
  ]
  data.todos = [task('a', 'child', 0), task('b', 'root', 1)]
  data = moveAction(data, 'root', 'b', -1)
  expect(taskAvailability(data, data.todos[1], today)).toBe('available')
  expect(taskAvailability(data, data.todos[0], today)).toBe('blocked')
  data = deleteProject(data, 'child')
  expect(data.todos).toHaveLength(2)
  expect(data.todos[0].planning?.projectId).toBe('root')
  expect(taskAvailability(data, data.todos[1], today)).toBe('available')
  expect(taskAvailability(data, data.todos[0], today)).toBe('blocked')
})

test('empty subprojects do not block sequential actions', () => {
  const data = defaults()
  data.projects = [
    project('root', null, 'sequential'),
    project('empty', 'root'),
  ]
  data.todos = [task('ready', 'root', 1)]
  expect(taskAvailability(data, data.todos[0], today)).toBe('available')
})

test('project path is cycle-safe and perspective criteria combine with AND including descendants', () => {
  const data = defaults()
  data.projects = [project('root', null), project('child', 'root')]
  const action = task('write', 'child', 0)
  action.planning = {
    ...action.planning!,
    context: 'Office',
    energy: 'high',
    timeOfDay: 'morning',
  }
  data.todos = [action]
  const filter = {
    ...emptyPerspective,
    projectId: 'root',
    context: 'office',
    energy: 'high' as const,
    timeOfDay: 'morning' as const,
    availability: 'available' as const,
  }
  expect(matchesPerspective(data, action, filter, today)).toBe(true)
  expect(
    matchesPerspective(data, action, { ...filter, energy: 'low' }, today),
  ).toBe(false)
  expect(
    matchesPerspective(data, action, { ...filter, timeOfDay: 'night' }, today),
  ).toBe(false)
  data.projects[0].parentId = 'child'
  expect(projectPath(data.projects, 'child')).toHaveLength(2)
})

test('calendar rejects overlaps and invalid ranges, accepts adjacent blocks, and respects deferral', () => {
  const data = defaults()
  data.calendarBlocks = [block('busy', '09:00', '10:00')]
  expect(blockError(data, block('overlap', '09:30', '10:30'))).toMatch(
    /overlaps/,
  )
  expect(blockError(data, block('adjacent', '10:00', '11:00'))).toBe('')
  expect(blockError(data, block('backward', '10:00', '09:00'))).toMatch(/after/)
  expect(blockError(data, block('busy', '09:30', '10:30'))).toBe('')
  data.todos = [task('later', null, 0)]
  data.todos[0].planning!.deferUntil = '2026-09-22'
  expect(
    blockError(data, block('deferred', '11:00', '12:00', 'later')),
  ).toMatch(/deferred/)
})

test('capacity clips at daily availability and does not double-count overlapping imported blocks', () => {
  const data = defaults()
  data.calendarHours = { start: 8, end: 18 }
  data.calendarBlocks = [
    block('early', '07:00', '09:00'),
    block('overlap', '08:30', '10:00'),
    { ...block('meeting', '17:00', '19:00'), deepWork: false },
  ]
  expect(dayCapacity(data, '2026-09-21')).toEqual({
    capacity: 600,
    booked: 180,
    free: 420,
    deep: 120,
  })
})

test('recurrence carries planning metadata and advances deferral without copying calendar blocks', () => {
  const data = defaults()
  data.todos = [task('repeat', null, 0)]
  data.todos[0].recurrence = 'daily'
  data.todos[0].planning!.deferUntil = '2026-09-21'
  data.todos[0].planning!.context = 'Office'
  data.calendarBlocks = [block('work', '09:00', '10:00', 'repeat')]
  const next = toggleTodo(data, 'repeat', +today)
  expect(next.todos[1].planning?.context).toBe('Office')
  expect(next.todos[1].planning?.deferUntil).toBe('2026-09-22')
  expect(next.calendarBlocks).toHaveLength(1)
})
