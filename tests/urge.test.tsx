import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App'
import type { UrgeEvent } from '../src/model'
import {
  buildUrgeInsight,
  calculateCorrelations,
  createUrgeEvent,
  dayNameAt,
  dayTypeAt,
  timeBucketAt,
  urgeInterruptionRate,
} from '../src/features/urgeEngine'

beforeEach(() => localStorage.clear())

const event = (
  kind: 'urge' | 'slip',
  tag: string,
  day: number,
  timeBucket: UrgeEvent['timeBucket'] = 'post-lunch',
): UrgeEvent => ({
  id: `${kind}-${tag}-${day}`,
  habitId: 'phone',
  kind,
  intensity: 4,
  tags: [tag],
  timestamp: new Date(2026, 8, day, 14).getTime(),
  timeBucket,
  dayType: 'weekday',
  dayOfWeek: 'Monday',
  sessionSeconds: 20,
  visibilityChanges: 1,
})

test('passive context groups time and day without asking the user', () => {
  const weekday = new Date(2026, 8, 21, 14).getTime()
  const weekend = new Date(2026, 8, 20, 23).getTime()
  expect(timeBucketAt(weekday)).toBe('post-lunch')
  expect(timeBucketAt(weekend)).toBe('late-night')
  expect(dayTypeAt(weekday)).toBe('weekday')
  expect(dayTypeAt(weekend)).toBe('weekend')
  expect(dayNameAt(weekday)).toBe('Monday')
  expect(
    createUrgeEvent(
      { habitId: 'phone', kind: 'urge', intensity: 3, tags: ['Bored'] },
      { sessionSeconds: 12.7, visibilityChanges: 2 },
      weekday,
    ),
  ).toMatchObject({
    timeBucket: 'post-lunch',
    dayType: 'weekday',
    dayOfWeek: 'Monday',
    sessionSeconds: 13,
    visibilityChanges: 2,
  })
})

test('correlations calculate conditional slip probability and interruption rate', () => {
  const events = [
    event('slip', 'Bored', 1),
    event('slip', 'Bored', 2),
    event('urge', 'Bored', 3),
    event('urge', 'Tired', 4),
  ]
  expect(calculateCorrelations(events)[0]).toMatchObject({
    tag: 'Bored',
    observations: 3,
    slips: 2,
    probability: 67,
  })
  expect(urgeInterruptionRate(events)).toBe(50)
})

test('actionable insights wait for seven days and use the strongest trigger', () => {
  const early = [
    event('slip', 'Bored', 1),
    event('slip', 'Bored', 2),
    event('urge', 'Bored', 3),
    event('urge', 'Tired', 4),
    event('slip', 'Bored', 5),
  ]
  expect(buildUrgeInsight(early)).toBeNull()
  const insight = buildUrgeInsight([...early, event('slip', 'Bored', 8)])
  expect(insight).toMatchObject({ habitId: 'phone', daysObserved: 8 })
  expect(insight?.message).toContain('Bored')
  expect(insight?.suggestion).toContain('stretch')
})

test('the three-click logger saves an urge and immediately updates patterns', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Urges', exact: true }))
  const habit = screen.getByText('Mindless phone scrolling').closest('article')!
  fireEvent.click(within(habit).getByRole('button', { name: 'Urge' }))
  fireEvent.click(screen.getByRole('button', { name: 'Intensity 4 of 5' }))
  fireEvent.click(screen.getByRole('button', { name: 'Bored' }))
  expect(
    screen.getByRole('heading', { name: 'Pattern captured' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Patterns/ }))
  const total = screen.getByText('Logged moments').closest('article')!
  expect(within(total).getByText('1')).toBeInTheDocument()
  expect(screen.getByText('100%')).toBeInTheDocument()
  expect(screen.getAllByText('Bored').length).toBeGreaterThan(0)
})

test('Settings can disable the feature without removing saved data', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Settings', exact: true }))
  const toggle = screen.getByRole('checkbox', {
    name: 'Enable Urge & trigger tracker',
  })
  expect(toggle).toBeChecked()
  fireEvent.click(toggle)
  expect(
    screen.queryByRole('button', { name: 'Urges' }),
  ).not.toBeInTheDocument()
})
