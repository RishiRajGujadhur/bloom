import { defaults } from '../src/model'
import type { AppData } from '../src/model'
import {
  activityStreak,
  buildWorld,
  growthSince,
  staged,
} from '../src/features/world/worldModel'

const today = '2026-09-25'
const at = (day: string) => new Date(`${day}T12:00:00`).getTime()
const fresh = (): AppData => defaults()

test('staged reports the stage and progress toward the next threshold', () => {
  expect(staged(0, [1, 5])).toEqual({ stage: 0, progress: 0, next: 1 })
  expect(staged(3, [1, 5])).toEqual({ stage: 1, progress: 0.5, next: 5 })
  expect(staged(9, [1, 5])).toEqual({ stage: 2, progress: 1, next: null })
})

test('streak survives until the end of today but breaks on a missed day', () => {
  const days = new Set(['2026-09-22', '2026-09-23', '2026-09-24'])
  expect(activityStreak(days, today)).toEqual({ current: 3, best: 3 })
  expect(activityStreak(days, '2026-09-26').current).toBe(0)
})

test('an empty account gets a bare island that is ready to grow', () => {
  const world = buildWorld(fresh(), today)
  expect(world.scene).toMatchObject({
    homeTier: 0,
    trees: 0,
    books: 0,
    buildings: 0,
    flame: false,
  })
  expect(world.decorations.every((d) => !d.unlocked)).toBe(true)
  expect(world.districts.map((d) => d.id)).toEqual([
    'home',
    'garden',
    'library',
    'town',
    'monument',
    'trophies',
  ])
})

test('tasks build the town and focus sessions plant the garden', () => {
  const data = fresh()
  data.todos = Array.from({ length: 26 }, (_, i) => ({
    ...(data.todos[0] ?? {}),
    id: `t${i}`,
    title: `Task ${i}`,
    done: true,
    due: today,
    completedAt: at(today),
    challengeId: null,
  })) as AppData['todos']
  data.rpg.focusHistory = Array.from({ length: 12 }, (_, i) => ({
    id: `f${i}`,
    completedAt: at('2026-09-24'),
    minutes: 25,
    taskTitle: '',
  }))
  const world = buildWorld(data, today)
  expect(world.scene.buildings).toBe(5)
  expect(world.scene.trees).toBe(12)
  expect(world.scene.flame).toBe(true)
  expect(world.streak).toBe(2)
  const unlocked = world.decorations.filter((d) => d.unlocked).map((d) => d.id)
  expect(unlocked).toEqual(['pond', 'windmill'])
  expect(world.districts.find((d) => d.id === 'town')?.nextHint).toBe(
    '4 tasks to grow',
  )
})

test('growthSince describes only what increased', () => {
  const before = buildWorld(fresh(), today).scene
  const after = { ...before, trees: 2, books: 1, homeTier: 1 }
  expect(growthSince(null, after)).toEqual([])
  expect(growthSince(before, after)).toEqual([
    '+2 trees',
    '+1 book',
    'Home upgraded',
  ])
})
