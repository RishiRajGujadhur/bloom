import { defaults } from '../src/model'
import { urgeClockStats, splitDuration } from '../src/features/urgeClock'
import { parkCar, sanitizeGarage, emptyGarage } from '../src/features/collectibles/garage'
import { pickCapsule } from '../src/features/timeCapsule'
import { thoughtDiff } from '../src/components/daybook/ThoughtDiff'
import { buildRecords, evaluateGroup } from '../src/features/explore/exploreModel'
import { tiptapBlocks, buildYearbook } from '../src/features/yearbook/yearbookModel'
import { angleForIndex, facingIndex, palaceDays } from '../src/features/palace/palaceModel'
import { constellation } from '../src/rpg/constellationModel'
import { journeySteps } from '../src/features/journey/journeyModel'
import { orbToMood } from '../src/features/wellbeing/moodOrbModel'
import { clusterPlaces } from '../src/features/places/placesStore'
import { isMilestoneStreak } from '../src/components/ui/celebrate'

const hour = 3600000
const urge = (id: string, kind: 'urge' | 'slip', timestamp: number) => ({
  id,
  habitId: 'h',
  kind,
  intensity: 3,
  tags: [],
  timestamp,
  timeBucket: 'morning' as const,
  context: {},
})

test('urge clock runs from the last slip and keeps the best gap as a high score', () => {
  const events = [urge('a', 'urge', 0), urge('b', 'slip', 10 * hour), urge('c', 'slip', 40 * hour), urge('d', 'urge', 45 * hour)]
  const stats = urgeClockStats(events as never, 'h', 50 * hour)!
  expect(stats.current).toBe(10 * hour)
  expect(stats.best).toBe(30 * hour)
  expect(stats.isRecord).toBe(false)
  expect(stats.resisted).toBe(1)
  expect(urgeClockStats(events as never, 'h', 80 * hour)!.isRecord).toBe(true)
  expect(urgeClockStats([], 'h', 0)).toBeNull()
  expect(splitDuration(90061000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
})

test('garage parks each car once and drops cars no longer owned', () => {
  let g = parkCar(emptyGarage, 0, 'mint-mile')
  g = parkCar(g, 3, 'mint-mile')
  expect(g.pads[0]).toBeNull()
  expect(g.pads[3]).toBe('mint-mile')
  expect(sanitizeGarage(g, []).pads.every((p) => p === null)).toBe(true)
})

test('time capsule prefers a year ago, then a month, a week, then gratitude', () => {
  const memories = [
    { date: '2025-09-26', title: 'Daybook', text: 'A year ago' },
    { date: '2026-08-26', title: 'Daybook', text: 'A month ago' },
  ]
  expect(pickCapsule(memories, [], '2026-09-26')).toMatchObject({ kind: 'year', text: 'A year ago' })
  expect(pickCapsule(memories.slice(1), [], '2026-09-26')).toMatchObject({ kind: 'month' })
  expect(pickCapsule([], [{ id: 'g', at: 1, text: 'Tea' }], '2026-09-26')).toMatchObject({ kind: 'gratitude', text: 'Tea' })
  expect(pickCapsule([], [], '2026-09-26')).toBeNull()
})

test('thought diff counts faded and new words', () => {
  const d = thoughtDiff('I fear failing at work', 'I fear nothing at home')
  expect(d.added).toBe(2)
  expect(d.removed).toBe(2)
  expect(d.parts.some((p) => p.added && p.value.includes('home'))).toBe(true)
})

test('explore evaluates nested AND/OR groups over joined records', () => {
  const data = defaults()
  data.habits[0].dates = ['2026-09-25']
  const records = buildRecords(data, [], [
    { id: 'm1', at: new Date(2026, 8, 25, 9).getTime(), mood: 5, note: 'great run', emotions: ['Proud'] },
    { id: 'm2', at: new Date(2026, 8, 24, 9).getTime(), mood: 2, note: 'tired' },
  ])
  const happyFriday = records.filter((r) =>
    evaluateGroup(r, {
      combinator: 'and',
      rules: [
        { field: 'weekday', operator: '=', value: 'Friday' },
        {
          combinator: 'or',
          rules: [
            { field: 'mood', operator: '>=', value: 4 },
            { field: 'text', operator: 'contains', value: 'tired' },
          ],
        },
        { field: 'habit', operator: 'contains', value: data.habits[0].title },
      ],
    }),
  )
  expect(happyFriday.map((r) => r.id)).toEqual(['mood:m1'])
  expect(evaluateGroup(records[0], { combinator: 'and', not: true, rules: [] })).toBe(false)
})

test('yearbook keeps headings and lists from TipTap and scopes to the year', () => {
  const blocks = tiptapBlocks({
    body: {
      type: 'doc',
      content: [
        { type: 'heading', content: [{ type: 'text', text: 'Title' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'One' }] }] }] },
      ],
    },
  })
  expect(blocks).toEqual([
    { kind: 'h', text: 'Title' },
    { kind: 'li', text: 'One' },
  ])
  const book = buildYearbook(
    defaults(),
    [
      { id: 'a', modeId: 'x', modeTitle: 'Page', createdAt: '2026-01-02T10:00:00Z', updatedAt: '2026-01-02T10:00:00Z', content: {} },
      { id: 'b', modeId: 'x', modeTitle: 'Old', createdAt: '2025-01-02T10:00:00Z', updatedAt: '2025-01-02T10:00:00Z', content: {} },
    ],
    [],
    [],
    2026,
    'T',
    'A',
  )
  expect(book.daybook.map((p) => p.title)).toEqual(['Page'])
  expect(book.moodByMonth).toHaveLength(12)
})

test('memory palace ring snaps to days and covers the whole year', () => {
  const days = palaceDays(defaults(), 2026, [{ date: '2026-03-01', title: 'Page' }])
  expect(days).toHaveLength(365)
  expect(days.find((d) => d.date === '2026-03-01')?.pages).toEqual(['Page'])
  const step = (Math.PI * 2) / 365
  expect(facingIndex(step * 10.4, 365)).toBe(10)
  expect(facingIndex(-step, 365)).toBe(364)
  expect(facingIndex(angleForIndex(5, 365, Math.PI * 4), 365)).toBe(5)
})

test('constellation lights stars from real progress', () => {
  const rpg = defaults().rpg
  const stars = constellation(rpg)
  expect(stars.find((s) => s.id === 'mindfulness')?.lit).toBe(true)
  expect(stars.filter((s) => s.group === 'spirit')).toHaveLength(5)
  expect(stars.filter((s) => s.lit)).toHaveLength(1)
})

test('streak journey uses the longest run with a monument every 7 days', () => {
  const dates = ['2026-09-01', '2026-09-02', ...Array.from({ length: 8 }, (_, i) => `2026-09-${String(10 + i).padStart(2, '0')}`)]
  const steps = journeySteps(dates, '2026-09-26')
  expect(steps).toHaveLength(8)
  expect(steps[0].date).toBe('2026-09-10')
  expect(steps.filter((s) => s.milestone).map((s) => s.index)).toEqual([6])
})

test('small helpers: orb mood, place clusters, milestone streaks', () => {
  expect(orbToMood(0)).toBe(1)
  expect(orbToMood(1)).toBe(5)
  expect(orbToMood(0.5)).toBe(3)
  const clusters = clusterPlaces([
    { id: '1', lat: 51.5, lng: -0.12, at: 1, kind: 'mood', mood: 4 },
    { id: '2', lat: 51.5001, lng: -0.1201, at: 2, kind: 'mood', mood: 2 },
    { id: '3', lat: 48.85, lng: 2.35, at: 3, kind: 'manual', mood: null },
  ])
  expect(clusters).toHaveLength(2)
  expect(clusters[0]).toMatchObject({ visits: 2, mood: 3 })
  expect([7, 30, 60, 100, 365].every(isMilestoneStreak)).toBe(true)
  expect(isMilestoneStreak(8)).toBe(false)
})
