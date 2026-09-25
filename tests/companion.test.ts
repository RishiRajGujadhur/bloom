import { defaults, parseData, projectSchema, taskSchema } from '../src/model'
import {
  applyProposal,
  intentSchema,
  proposePlan,
  proposalIsCurrent,
  understandRequest,
  weeklyMemory,
} from '../src/companion/planner'

const now = new Date('2026-09-25T12:00:00')
const task = (id: string, planning = {}) =>
  taskSchema.parse({
    id,
    title: id,
    due: '2026-09-25',
    done: false,
    challengeId: null,
    planning: { minutes: 15, ...planning },
  })

test('recognizes bounded time and low energy without a model', () => {
  expect(understandRequest('I am exhausted and have an hour')).toMatchObject({
    intent: 'plan',
    minutes: 60,
    energy: 'low',
  })
  expect(understandRequest('Plan 500 hours')).toMatchObject({ minutes: 240 })
  expect(understandRequest('I have half an hour')).toMatchObject({
    minutes: 30,
  })
  expect(understandRequest('Look back at my week').intent).toBe('progress')
  expect(
    intentSchema.safeParse({
      intent: 'deleteTask',
      minutes: 20,
      energy: 'low',
      message: '',
    }).success,
  ).toBe(false)
})

test('plans within budget and respects dependencies, deferrals, energy and bookings', () => {
  const data = defaults()
  data.projects = [
    projectSchema.parse({
      id: 'project',
      title: 'Project',
      mode: 'sequential',
    }),
  ]
  data.todos = [
    task('first', { projectId: 'project', order: 0 }),
    task('blocked', { projectId: 'project', order: 1 }),
    task('deferred', { deferUntil: '2026-09-26' }),
    task('hard', { energy: 'high' }),
    task('booked'),
    task('small'),
  ]
  data.calendarBlocks = [
    {
      id: 'block',
      title: 'Booked',
      taskId: 'booked',
      start: new Date('2026-09-25T13:00:00').toISOString(),
      end: new Date('2026-09-25T14:00:00').toISOString(),
      deepWork: false,
    },
  ]
  const proposal = proposePlan(
    data,
    understandRequest('I am tired and have 40 minutes'),
    now,
  )
  expect(proposal.tasks.map((t) => t.id)).toEqual(['first', 'small'])
  expect(
    proposal.tasks.reduce((sum, t) => sum + t.minutes, proposal.pause),
  ).toBeLessThanOrEqual(40)
})

test('accept is idempotent, persists in existing schema and preserves original records', () => {
  const data = defaults()
  data.todos = [task('small')]
  const proposal = proposePlan(data, understandRequest('Plan today'), now)
  const applied = applyProposal(data, proposal, now)
  expect(applied.plans).toHaveLength(1)
  expect(applyProposal(applied, proposal, now)).toBe(applied)
  expect(applied.todos).toBe(data.todos)
  expect(applied.rpg).toBe(data.rpg)
  expect(parseData(JSON.parse(JSON.stringify(applied))).plans).toEqual(
    applied.plans,
  )
})

test('refuses stale plans after task edits, deletion, completion and midnight', () => {
  const data = defaults()
  data.todos = [task('small')]
  const proposal = proposePlan(data, understandRequest('Plan today'), now)
  for (const todos of [
    [],
    [{ ...data.todos[0], title: 'Changed' }],
    [{ ...data.todos[0], done: true }],
    [task('small', { minutes: 90 })],
  ]) {
    const changed = { ...data, todos }
    expect(proposalIsCurrent(changed, proposal, now)).toBe(false)
    expect(applyProposal(changed, proposal, now)).toBe(changed)
  }
  expect(applyProposal(data, proposal, new Date('2026-09-26T12:00:00'))).toBe(
    data,
  )
})

test('weekly memory counts actual activity within local date boundaries', () => {
  const data = defaults()
  data.habits[0].dates = [
    '2026-09-18',
    '2026-09-19',
    '2026-09-19',
    '2026-09-25',
    '2026-09-26',
  ]
  data.rpg.focusHistory = [
    { id: 'focus', completedAt: +now, minutes: 25, taskTitle: 'Read' },
    {
      id: 'future',
      completedAt: +now + 86400000,
      minutes: 90,
      taskTitle: 'Future',
    },
  ]
  expect(weeklyMemory(data, now)).toMatchObject({
    rituals: 2,
    reflections: 0,
    focus: 25,
  })
})
