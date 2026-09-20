import { defaults, parseData } from '../src/model'
import {
  acceptChallenge,
  addSubtask,
  challenges,
  nextRecurringDate,
  toggleSubtask,
  toggleTodo,
} from '../src/features/productivity'
import {
  completeFocusQuest,
  failFocusQuest,
  startFocusQuest,
  totals,
  unlockSkill,
} from '../src/rpg/engine'

const now = new Date(2026, 8, 20, 12).getTime()
test('accepting a challenge atomically creates its goal and dated tasks once', () => {
  const data = acceptChallenge(defaults(), 'small-start', now)
  expect(data.challenges).toHaveLength(1)
  expect(data.todos).toHaveLength(3)
  expect(data.todos.map((task) => task.due)).toEqual([
    '2026-09-20',
    '2026-09-21',
    '2026-09-22',
  ])
  expect(acceptChallenge(data, 'small-start', now)).toBe(data)
  expect(parseData(JSON.parse(JSON.stringify(data)))).toEqual(data)
})
test('task and challenge rewards cannot be farmed by undo and redo', () => {
  let data = acceptChallenge(defaults(), 'small-start', now)
  for (const task of data.todos) data = toggleTodo(data, task.id, now)
  expect(data.challenges[0].rewarded).toBe(true)
  expect(totals(data.rpg).exp).toBe(30 + challenges[0].reward)
  const gold = data.rpg.gold
  data = toggleTodo(data, data.todos[0].id, now)
  expect(data.todos[0].done).toBe(false)
  data = toggleTodo(data, data.todos[0].id, now)
  expect(totals(data.rpg).exp).toBe(60)
  expect(data.rpg.gold).toBe(gold)
})
test('older saves receive empty task collections without losing intentions', () => {
  const old = JSON.parse(JSON.stringify(defaults()))
  delete old.todos
  delete old.challenges
  delete old.rpg.focusHistory
  delete old.rpg.focusQuest.durationMinutes
  old.plans = [
    { id: 'existing', title: 'Keep this', done: false, date: '2026-09-20' },
  ]
  const migrated = parseData(old)
  expect(migrated.todos).toEqual([])
  expect(migrated.urgeHabits).toHaveLength(3)
  expect(migrated.urgeEvents).toEqual([])
  expect(migrated.plans[0].title).toBe('Keep this')
  expect(migrated.rpg.focusQuest.durationMinutes).toBe(25)
})
test('older tasks receive calm planning defaults without losing their content', () => {
  const saved = JSON.parse(JSON.stringify(defaults()))
  saved.todos = [
    {
      id: 'old-task',
      title: 'Still here',
      done: false,
      due: '2026-09-20',
      challengeId: null,
      rewarded: false,
    },
  ]
  const migrated = parseData(saved)
  expect(migrated.todos[0]).toMatchObject({
    title: 'Still here',
    priority: 'P3',
    tags: [],
    recurrence: 'none',
    subtasks: [],
  })
})
test('subtasks can be added and checked without completing the parent task', () => {
  let data = defaults()
  data.todos.push({
    id: 'project',
    title: 'Plan launch',
    done: false,
    due: '2026-09-20',
    challengeId: null,
    rewarded: false,
    priority: 'P1',
    tags: ['deep-work'],
    recurrence: 'none',
    seriesId: null,
    subtasks: [],
  })
  data = addSubtask(data, 'project', 'Draft the outline')
  data = toggleSubtask(data, 'project', data.todos[0].subtasks[0].id)
  expect(data.todos[0].subtasks[0]).toMatchObject({
    title: 'Draft the outline',
    done: true,
  })
  expect(data.todos[0].done).toBe(false)
})
test('completing a recurring task schedules the next occurrence exactly once', () => {
  let data = defaults()
  data.todos.push({
    id: 'review-1',
    title: 'Weekly review',
    done: false,
    due: '2026-09-20',
    challengeId: null,
    rewarded: false,
    priority: 'P2',
    tags: ['review'],
    recurrence: 'weekly',
    seriesId: 'review-series',
    subtasks: [{ id: 'step-1', title: 'Clear inbox', done: true }],
  })
  data = toggleTodo(data, 'review-1', now)
  expect(data.todos).toHaveLength(2)
  expect(data.todos[1]).toMatchObject({
    due: '2026-09-27',
    done: false,
    seriesId: 'review-series',
  })
  expect(data.todos[1].subtasks[0].done).toBe(false)
  data = toggleTodo(data, 'review-1', now)
  data = toggleTodo(data, 'review-1', now)
  expect(data.todos).toHaveLength(2)
  expect(nextRecurringDate('2025-01-31', 'monthly')).toBe('2025-02-28')
})
test('focus completion honors duration, persists history, and awards only once', () => {
  let data = defaults()
  data.rpg.focusQuest.durationMinutes = 5
  data = startFocusQuest(data, 'rain', now)
  expect(completeFocusQuest(data, now + 299999)).toBe(data)
  const done = completeFocusQuest(data, now + 300000)
  expect(done.rpg.focusHistory).toHaveLength(1)
  expect(totals(done.rpg).exp).toBe(5)
  expect(done.rpg.gold).toBe(5)
  expect(completeFocusQuest(done, now + 600000)).toBe(done)
  expect(parseData(done).rpg.focusHistory[0].minutes).toBe(5)
})
test('failed focus sessions never grow trees or receive rewards', () => {
  const started = startFocusQuest(defaults(), 'rain', now)
  expect(startFocusQuest(started, 'rain', now + 1000)).toBe(started)
  const failed = failFocusQuest(started, now + 1000)
  expect(completeFocusQuest(failed, now + 3600000)).toBe(failed)
  expect(failed.rpg.focusHistory).toEqual([])
})
test('the starting skill meets prerequisites, while unmet attribute thresholds remain locked', () => {
  const definitions = {
    breathwork: {
      prerequisites: ['mindfulness'],
      attribute: 'spirit' as const,
      threshold: 10,
      expCost: 40,
    },
  }
  const data = defaults()
  expect(
    unlockSkill(
      data,
      'breathwork',
      40,
      { spirit: 9, strength: 0, intelligence: 0 },
      definitions,
    ),
  ).toBe(data)
  const unlocked = unlockSkill(
    data,
    'breathwork',
    40,
    { spirit: 10, strength: 0, intelligence: 0 },
    definitions,
  )
  expect(unlocked.rpg.skills.breathwork.state).toBe('unlocked')
  expect(
    unlockSkill(
      unlocked,
      'breathwork',
      40,
      { spirit: 10, strength: 0, intelligence: 0 },
      definitions,
    ),
  ).toBe(unlocked)
})
