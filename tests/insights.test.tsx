import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  collectActivity,
  completedDaybook,
  dateRange,
  streaks,
  type Activity,
} from '../src/analytics/activity'
import {
  DAYBOOK_STORAGE_KEY,
  useJournalEntries,
} from '../src/components/daybook/useJournalEntries'
import {
  defaultSettings,
  loadSettings,
  SETTINGS_STORAGE_KEY,
} from '../src/SettingsPage'
import type { JournalEntry } from '../src/components/daybook/types'
import { newSession } from '../src/model'
import App from '../src/App'

const entry: JournalEntry = {
  id: 'page',
  modeId: 'bullet-journal',
  modeTitle: 'BuJo',
  createdAt: '2026-03-06T12:00:00',
  updatedAt: '2026-03-07T12:00:00',
  content: { body: 'A small step' },
}
const events = (...days: string[]): Activity[] =>
  days.map((day, index) => ({
    day,
    at: 0,
    id: String(index),
    source: 'daybook',
  }))
beforeEach(() => localStorage.clear())

test('streaks preserve yesterday, reset after a missed day, and ignore duplicates and future days', () => {
  const activity = events(
    '2026-03-07',
    '2026-03-08',
    '2026-03-08',
    '2026-03-09',
    '2026-04-01',
  )
  expect(streaks(activity, '2026-03-10')).toEqual({
    current: 3,
    longest: 3,
    month: 3,
  })
  expect(streaks(activity, '2026-03-11').current).toBe(0)
  expect(dateRange('2026-03-10', 4)).toEqual([
    '2026-03-07',
    '2026-03-08',
    '2026-03-09',
    '2026-03-10',
  ])
  expect(
    streaks(events('2024-02-28', '2024-02-29', '2024-03-01'), '2024-03-01')
      .current,
  ).toBe(3)
  expect(
    streaks(events('2025-12-31', '2026-01-01'), '2026-01-01').current,
  ).toBe(2)
})

test('Daybook history survives edits, deduplicates a day, and excludes empty rich documents', () => {
  const first = completedDaybook(entry, entry, new Date('2026-03-08T23:59:00'))
  const repeat = completedDaybook(entry, first, new Date('2026-03-08T23:59:30'))
  const next = completedDaybook(entry, repeat, new Date('2026-03-09T00:01:00'))
  expect(next.activity?.map((item) => item.day)).toEqual([
    '2026-03-07',
    '2026-03-08',
    '2026-03-09',
  ])
  const empty = {
    ...entry,
    content: { body: { type: 'doc', content: [{ type: 'paragraph' }] } },
  }
  expect(completedDaybook(empty, undefined).activity).toEqual([])
  expect(collectActivity([entry, entry], [], '2026-03-10')).toHaveLength(1)
})

test('chat backfill uses the final response date, not the start date; drafts do not count', () => {
  const session = newSession()
  session.metadata.date = '2026-03-07T23:59:00'
  session.messages.push({
    id: 'answer',
    sender: 'user',
    text: 'Done',
    category: 'action_step',
    timestamp: new Date('2026-03-08T00:01:00').getTime(),
  })
  expect(collectActivity([], [session], '2026-03-09')).toEqual([])
  session.flow.complete = true
  expect(collectActivity([], [session], '2026-03-09')[0].day).toBe('2026-03-08')
})

test('old settings gain Insights without resetting disabled features', () => {
  const { insights: _insights, ...old } = defaultSettings.features
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ features: { ...old, habitTracker: false } }),
  )
  expect(loadSettings().features).toEqual({
    ...old,
    habitTracker: false,
    insights: true,
  })
})

test('failed Daybook storage earns no activity and preserves the editor data for retry', () => {
  const hook = renderHook(useJournalEntries)
  const write = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('Full')
    })
  act(() => {
    expect(hook.result.current.save(entry)).toBe(false)
  })
  expect(hook.result.current.entries).toEqual([])
  expect(hook.result.current.error).toMatch(/could not be saved/)
  write.mockRestore()
  act(() => {
    expect(hook.result.current.save(entry)).toBe(true)
  })
  expect(
    JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY)!)[0].activity,
  ).toHaveLength(1)
})

test('corrupt Daybook data is not overwritten', () => {
  localStorage.setItem(DAYBOOK_STORAGE_KEY, '{broken')
  const hook = renderHook(useJournalEntries)
  act(() => {
    expect(hook.result.current.save(entry)).toBe(false)
  })
  expect(localStorage.getItem(DAYBOOK_STORAGE_KEY)).toBe('{broken')
})

test('Insights is a separate page and its switch hides navigation without deleting history', async () => {
  localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify([entry]))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Insights' }))
  expect(
    await screen.findByRole('heading', { name: 'Your journaling rhythm' }, { timeout: 5000 }),
  ).toBeInTheDocument()
  expect(screen.queryByText('Daily Quests')).not.toBeInTheDocument()
  expect(
    screen.getByRole('group', { name: 'Journaling activity calendar' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Enable Insights & Analytics' }),
  )
  expect(
    screen.queryByRole('button', { name: 'Insights' }),
  ).not.toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY)!)).toHaveLength(1)
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Enable Insights & Analytics' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Insights' }))
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Your journaling rhythm' }),
    ).toBeInTheDocument(),
  )
})
