import { readingSeconds, script, segments, streak } from '../src/features/briefing/briefingModel'

const now = new Date('2026-09-30T07:30:00')
const base = { now, events: [], tasks: [], habits: [], bills: [], money: (n: number) => `£${n.toFixed(2)}` }

describe('Morning briefing', () => {
  it('builds a greeting, weather, readiness, calendar, tasks, streak, bills and a sign-off', () => {
    const segs = segments({
      ...base,
      name: 'Rishi',
      weather: { tempC: 11.6, highC: 17, lowC: 9, code: 61, rainChance: 70, place: 'Bristol' },
      readiness: { score: 82, label: 'Primed', hr: 55 },
      events: [{ title: 'Stand-up', start: new Date('2026-09-30T09:30:00') }, { title: 'Design review', start: new Date('2026-09-30T14:00:00') }],
      tasks: [{ title: 'Ship the release', priority: 'P1', overdue: false }, { title: 'Pay invoice', priority: 'P3', overdue: true }],
      habits: [{ title: 'Morning run', streak: 6, doneToday: false }],
      bills: [{ biller: 'Brightwatt Energy', amount: 84.37, days: 2, kind: 'bill' }],
    })
    expect(segs.map((s) => s.kind)).toEqual(['greeting', 'weather', 'readiness', 'calendar', 'tasks', 'habits', 'bills', 'closing'])
    const text = script(segs)
    expect(text).toMatch(/Good morning, Rishi/)
    expect(text).toMatch(/12 degrees with light rain/)
    expect(text).toMatch(/70% chance of rain/)
    expect(text).toMatch(/readiness this morning is 82/)
    expect(text).toMatch(/Stand-up at/)
    expect(text).toMatch(/Pay invoice/)
    expect(text).toMatch(/6-day streak with Morning run/)
    expect(text).toMatch(/Brightwatt Energy for £84\.37 is due in 2 days/)
    expect(readingSeconds(text)).toBeGreaterThan(30)
    expect(readingSeconds(text)).toBeLessThan(120)
  })

  it('says the calendar is clear when it is', () => {
    expect(script(segments(base))).toMatch(/calendar is clear/)
  })

  it('counts streaks ending today or yesterday', () => {
    expect(streak(['2026-09-28', '2026-09-29', '2026-09-30'], '2026-09-30')).toBe(3)
    expect(streak(['2026-09-28', '2026-09-29'], '2026-09-30')).toBe(2)
    expect(streak(['2026-09-26'], '2026-09-30')).toBe(0)
  })
})

it('splits sentences without breaking prices', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { splitSentences } = require('../src/features/briefing/briefingModel')
  expect(splitSentences('Pay £84.37 today. Then rest! Done?')).toEqual(['Pay £84.37 today.', 'Then rest!', 'Done?'])
})
