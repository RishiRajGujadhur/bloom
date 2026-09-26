import { defaults, type AppData } from '../src/model'
import { daysAway, garden, growth, stages } from '../src/features/core/growthModel'
import { recognise } from '../src/features/core/recognition'
import { PITY_AFTER, maybeDiscover, roll } from '../src/features/core/discoveries'
import { dayComplete, modeFor, nextTask, seedFor, weekStory, whatNow } from '../src/features/core/nowModel'

const today = '2026-09-26'
const noExtras = { wellbeing: [], daybook: [] }
const back = (n: number) => {
  const d = new Date(`${today}T12:00:00`)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
const task = (over: Partial<AppData['todos'][number]> = {}): AppData['todos'][number] => ({
  id: Math.random().toString(36),
  title: 'Write report',
  done: false,
  due: today,
  completedAt: null,
  challengeId: null,
  rewarded: false,
  priority: 'P3',
  tags: [],
  recurrence: 'none',
  seriesId: null,
  subtasks: [],
  ...over,
})

test('growth grows with consistency and never collapses after time away', () => {
  const data = defaults()
  data.habits[0].dates = Array.from({ length: 40 }, (_, i) => back(i))
  const g = growth(data, today, noExtras)
  expect(g.stage.id).toBe('thriving')
  expect(g.lifetimeDays).toBe(40)
  // Two months away: the lifetime half is banked, so you don't drop to Seed.
  const later = growth(data, '2026-11-30', noExtras)
  expect(later.score).toBeGreaterThanOrEqual(30)
  expect(later.stage.id).not.toBe('seed')
  expect(garden(data, today, noExtras)).toHaveLength(40)
  expect(stages.map((s) => s.name)).toEqual(['Seed', 'Sprout', 'Growing', 'Thriving', 'Blooming'])
  expect(daysAway(data, '2026-10-10', noExtras)).toBe(13)
})

test('recognition speaks to what you did, compared with past-you', () => {
  const prev = defaults()
  prev.todos = [task({ id: 'late', due: back(5) }), task({ id: 'p1', priority: 'P1' })]
  const next: AppData = { ...prev, todos: prev.todos.map((t) => (t.id === 'late' ? { ...t, done: true, completedAt: new Date(`${today}T10:00`).getTime() } : t)) }
  const r = recognise(prev, next, today)!
  expect(r.headline).toMatch(/postponing/)
  expect(r.meaningful).toBe(true)
  const next2: AppData = { ...prev, todos: prev.todos.map((t) => (t.id === 'p1' ? { ...t, done: true, completedAt: new Date(`${today}T11:00`).getTime() } : t)) }
  expect(recognise(prev, next2, today)!.headline).toBe('The hardest thing on your list, done.')
  const h = defaults()
  const habit = h.habits[0]
  habit.dates = [back(9)]
  const h2: AppData = { ...h, habits: h.habits.map((x) => (x.id === habit.id ? { ...x, dates: [...x.dates, today] } : x)) }
  expect(recognise(h, h2, today)!.headline).toBe(`Welcome back to ${habit.title}.`)
  expect(recognise(h, h, today)).toBeNull()
})

test('discoveries: chance-based, with a pity timer and no repeats', () => {
  const data = defaults()
  data.todos = Array.from({ length: 8 }, (_, i) => task({ done: true, completedAt: new Date(`${back(i)}T10:30`).getTime() }))
  expect(roll('abc')).toBe(roll('abc'))
  let state = { misses: PITY_AFTER - 1, found: [] as { id: string; at: number }[] }
  const first = maybeDiscover(data, [], state, 'seed-that-misses-zzzz')
  expect(first.discovery).not.toBeNull()
  expect(first.state.misses).toBe(0)
  state = first.state
  const again = maybeDiscover(data, [], { ...state, misses: PITY_AFTER - 1 }, 'another')
  expect(again.discovery?.id).not.toBe(first.discovery!.id)
})

test('what now: one next action that follows the clock', () => {
  const data = defaults()
  data.todos = [task({ id: 'a', title: 'Easy', priority: 'P4' }), task({ id: 'b', title: 'Important', priority: 'P1' })]
  expect(nextTask(data, today)!.title).toBe('Important')
  const opts = { reflectedToday: false, weekSeen: true, journalPage: 'daybook' as const }
  expect(whatNow(data, today, 'morning', opts).primary.type).toBe('plan')
  const afternoon = whatNow(data, today, 'afternoon', opts)
  expect(afternoon.primary).toMatchObject({ type: 'focus', taskId: 'b' })
  expect(afternoon.secondary).toMatchObject({ type: 'complete' })
  expect(whatNow(data, today, 'evening', opts).primary).toMatchObject({ type: 'navigate', page: 'daybook' })
  expect(whatNow(data, today, 'sunday', { ...opts, weekSeen: false }).primary.type).toBe('week')
  expect(modeFor(new Date('2026-09-27T15:00:00'))).toBe('sunday')
  expect(modeFor(new Date('2026-09-26T08:00:00'))).toBe('morning')
  expect(seedFor('2026-09-26')).not.toBe(seedFor('2026-09-27'))
})

test('day complete and the weekly story', () => {
  const data = defaults()
  data.todos = [task({ done: true, completedAt: new Date(`${today}T09:00`).getTime() })]
  data.habits = data.habits.map((h) => ({ ...h, dates: [today] }))
  data.rpg.focusHistory = [{ id: 'f', completedAt: new Date(`${today}T09:30`).getTime(), minutes: 25, taskTitle: '' }]
  const d = dayComplete(data, today)
  expect(d.complete).toBe(true)
  expect(d.bestFocus).toBe('morning')
  const w = weekStory(data, today)
  expect(w.thisWeek.tasks).toBe(1)
  expect(w.change('tasks')).toBeNull()
})
