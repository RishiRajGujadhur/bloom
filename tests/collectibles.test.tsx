import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { cars } from '../src/features/collectibles/catalog'
import {
  canSpin,
  COLLECTIBLES_KEY,
  emptyCollection,
  parseCollection,
  rollCollection,
  selectCar,
  spinDaily,
} from '../src/features/collectibles/store'
import {
  CollectiblesPage,
  DailySpin,
  FocusCompanion,
} from '../src/features/collectibles/Collectibles'
import { dayKey } from '../src/dates'
import {
  defaultSettings,
  loadSettings,
  SETTINGS_STORAGE_KEY,
} from '../src/SettingsPage'
import { renderApp } from './helpers/renderApp'

beforeEach(() => {
  localStorage.clear()
  // A queued lock models the browser's serialization across callers.
  let queue = Promise.resolve<unknown>(undefined)
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_name: string, callback: () => unknown) => {
        const next = queue.then(callback)
        queue = next.catch(() => undefined)
        return next
      },
    },
  })
})
afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

test('wins persist an unowned car, and same-day attempts leave the result unchanged', async () => {
  const date = new Date(2026, 8, 25, 12)
  const state = rollCollection(emptyCollection, date, () => 0)
  expect(state.owned).toEqual([cars[0].id])
  expect(state.lastSpin?.reels).toEqual([7, 7, 7])
  expect(state.lastSpin?.timestamp).toBe(date.getTime())
  expect(rollCollection(state, date)).toBe(state)
  expect(parseCollection(JSON.stringify(state))).toEqual(state)
})

test('a losing roll consumes the day and never shows a matching combination', async () => {
  const state = rollCollection(emptyCollection, new Date(), () => 0.99)
  expect(state.owned).toEqual([])
  expect(state.lastSpin?.reels).toEqual([7, 7, 1])
  expect(canSpin(state)).toBe(false)
})

test('eligibility resets at local midnight, not after 24 hours, and rejects clock rollback', async () => {
  const state = rollCollection(
    emptyCollection,
    new Date(2026, 8, 25, 23, 59),
    () => 0.9,
  )
  expect(canSpin(state, new Date(2026, 8, 25, 23, 59, 59))).toBe(false)
  expect(canSpin(state, new Date(2026, 8, 26, 0, 0))).toBe(true)
  expect(canSpin(state, new Date(2026, 8, 24))).toBe(false)
})

test('jackpots never duplicate a car and a complete collection stops consuming spins', async () => {
  let state = emptyCollection
  for (let day = 1; day <= cars.length; day++)
    state = rollCollection(state, new Date(2026, 8, day), () => 0)
  expect(new Set(state.owned).size).toBe(cars.length)
  expect(rollCollection(state, new Date(2026, 9, 1))).toBe(state)
})

test('concurrent spin requests grant only one reward and preserve the saved outcome', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(0)
  const [first, second] = await Promise.all([spinDaily(), spinDaily()])
  expect(first).toEqual(second)
  expect(
    parseCollection(localStorage.getItem(COLLECTIBLES_KEY)).owned,
  ).toHaveLength(1)
})

test('selection persists only for an owned car and can be cleared', async () => {
  await expect(selectCar(cars[0].id)).rejects.toThrow('still locked')
  localStorage.setItem(
    COLLECTIBLES_KEY,
    JSON.stringify(rollCollection(emptyCollection, new Date(), () => 0)),
  )
  await selectCar(cars[0].id)
  expect(parseCollection(localStorage.getItem(COLLECTIBLES_KEY)).selected).toBe(
    cars[0].id,
  )
  await selectCar(null)
  expect(
    parseCollection(localStorage.getItem(COLLECTIBLES_KEY)).selected,
  ).toBeNull()
})

test('the result is saved before animation ends and cannot reroll after remount', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(0)
  const view = render(<DailySpin />)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Daily 7-7-7 Spin' })) })
  await waitFor(() =>
    expect(localStorage.getItem(COLLECTIBLES_KEY)).toContain(cars[0].id),
  )
  view.unmount()
  render(<DailySpin />)
  expect(
    screen.getByRole('button', { name: 'Come back tomorrow' }),
  ).toBeDisabled()
  expect(screen.getByText(/Jackpot! Mint Mile is yours/)).toBeInTheDocument()
})

test('storage failure does not grant a reward or claim a successful spin', async () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  render(<DailySpin />)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Daily 7-7-7 Spin' })) })
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save')
  expect(localStorage.getItem(COLLECTIBLES_KEY)).toBeNull()
  expect(screen.getByRole('button', { name: 'Daily 7-7-7 Spin' })).toBeEnabled()
})

test('corrupt saved data is preserved and blocks play', async () => {
  localStorage.setItem(COLLECTIBLES_KEY, 'broken')
  render(<DailySpin />)
  expect(screen.getByRole('alert')).toHaveTextContent('could not be read')
  expect(screen.getByRole('button')).toBeDisabled()
  expect(localStorage.getItem(COLLECTIBLES_KEY)).toBe('broken')
})

test('a midnight refresh re-enables the visible spin button', async () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 8, 25, 23, 59, 59))
  localStorage.setItem(
    COLLECTIBLES_KEY,
    JSON.stringify(rollCollection(emptyCollection, new Date(), () => 0.9)),
  )
  render(<DailySpin />)
  expect(
    screen.getByRole('button', { name: 'Come back tomorrow' }),
  ).toBeDisabled()
  await act(async () => {
    jest.advanceTimersByTime(1000)
  })
  expect(screen.getByRole('button', { name: 'Daily 7-7-7 Spin' })).toBeEnabled()
})

test('gallery selection updates the focus companion and survives remount', async () => {
  localStorage.setItem(
    COLLECTIBLES_KEY,
    JSON.stringify(rollCollection(emptyCollection, new Date(), () => 0)),
  )
  const gallery = render(<CollectiblesPage />)
  expect(
    screen.getAllByRole('button', { name: 'Awaiting discovery' }),
  ).toHaveLength(5)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Take to focus' })) })
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Focus companion' }),
    ).toHaveAttribute('aria-pressed', 'true'),
  )
  gallery.unmount()
  render(<FocusCompanion active />)
  expect(screen.getByLabelText('Focus companion')).toHaveValue(cars[0].id)
  expect(screen.getByRole('img', { name: 'Mint Mile' })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Focus companion'), {
    target: { value: '' },
  })
  await waitFor(() =>
    expect(
      screen.queryByRole('img', { name: 'Mint Mile' }),
    ).not.toBeInTheDocument(),
  )
})

test('a storage event synchronizes another tab without granting another attempt', async () => {
  render(<DailySpin />)
  act(() => {
    localStorage.setItem(
      COLLECTIBLES_KEY,
      JSON.stringify(rollCollection(emptyCollection, new Date(), () => 0.9)),
    )
    window.dispatchEvent(new StorageEvent('storage', { key: COLLECTIBLES_KEY }))
  })
  expect(
    screen.getByRole('button', { name: 'Come back tomorrow' }),
  ).toBeDisabled()
})

test('old settings migrate to opt-in defaults and enabling features reveals their entry points', async () => {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ features: { habitTracker: false } }),
  )
  expect(loadSettings().features).toEqual({
    ...defaultSettings.features,
    habitTracker: false,
  })
  await renderApp()
  expect(
    screen.queryByRole('button', { name: 'My Collectibles' }),
  ).not.toBeInTheDocument()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Settings' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Advanced', exact: true })) })
  await act(async () => { fireEvent.click(
    screen.getByRole('checkbox', { name: 'Enable Daily 7-7-7 Spin' }),
  ) })
  await act(async () => { fireEvent.click(
    screen.getByRole('checkbox', { name: 'Enable My Collectibles' }),
  ) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'My Collectibles' })) })
  expect(screen.getByText('0 of 6 cars collected')).toBeInTheDocument()
  expect(dayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})
