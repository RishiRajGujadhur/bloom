import { act, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App'
import { STORAGE_KEY } from '../src/model'
import { THEME_STORAGE_KEY as THEME_SETTINGS_KEY } from '../src/utils/themeEngine'
import { resetThemeAttributes } from './setup'
beforeEach(() => {
  localStorage.clear()
  resetThemeAttributes()
  jest.useFakeTimers()
})
afterEach(() => jest.useRealTimers())
test('journal saves one completed reflection and restores it after remount', async () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Begin a check-in/ }))
  fireEvent.click(screen.getByRole('button', { name: 'mood 4 of 5' }))
  fireEvent.click(screen.getByRole('button', { name: 'energy 3 of 5' }))
  for (const answer of [
    'Feeling grounded',
    'I showed up',
    'I paused and tried again',
    'Take a 10-minute walk',
  ]) {
    fireEvent.click(screen.getByRole('button', { name: answer }))
    await act(async () => {
      jest.advanceTimersByTime(900)
    })
  }
  fireEvent.click(screen.getByRole('button', { name: /Save & review/ }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(data.sessions).toHaveLength(1)
  expect(data.sessions[0].metadata).toMatchObject({ mood: 4, energy: 3 })
  view.unmount()
  render(<App />)
  expect(
    screen.getByRole('button', { name: /View saved reflection/ }),
  ).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: /Start another check-in/ }),
  )
  expect(screen.getByRole('button', { name: 'mood 4 of 5' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
test('pending journal timer resumes once after unmount and reload', async () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Begin a check-in/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Feeling grounded' }))
  expect(
    screen.getByRole('button', { name: 'Feeling grounded' }),
  ).toBeDisabled()
  view.unmount()
  await act(async () => {
    jest.advanceTimersByTime(2000)
  })
  render(<App />)
  await act(async () => {
    jest.advanceTimersByTime(900)
  })
  expect(
    within(screen.getByRole('log')).getAllByText(/What’s one small win/),
  ).toHaveLength(1)
})
test('habit completion persists after reload', () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Move with intention/ }))
  view.unmount()
  render(<App />)
  expect(
    screen.getByRole('button', { name: /Move with intention/ }),
  ).toHaveAttribute('aria-pressed', 'true')
})
test('theme toggles between light and dark and persists after reload', () => {
  const view = render(<App />)
  // The documented default palette is dark.
  expect(document.documentElement).toHaveAttribute('data-theme', 'github-dark')
  expect(document.documentElement).toHaveAttribute('data-mode', 'dark')
  expect(document.documentElement).toHaveAttribute('data-font', 'system')

  fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))
  expect(document.documentElement).toHaveAttribute('data-mode', 'light')
  expect(JSON.parse(localStorage.getItem(THEME_SETTINGS_KEY)!).themeId).toBe(
    'github-light',
  )

  view.unmount()
  render(<App />)
  expect(document.documentElement).toHaveAttribute('data-theme', 'github-light')
  expect(
    screen.getByRole('button', { name: 'Switch to dark mode' }),
  ).toHaveAttribute('aria-pressed', 'false')
})
test('corrupt storage is not overwritten by rendering', () => {
  localStorage.setItem(STORAGE_KEY, 'broken')
  render(<App />)
  expect(screen.getByRole('alert')).toHaveTextContent('not been overwritten')
  expect(localStorage.getItem(STORAGE_KEY)).toBe('broken')
})
test('a failed save is reported without dropping in-memory changes', () => {
  const storage = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Move with intention/ }))
  expect(screen.getByRole('alert')).toHaveTextContent('in memory only')
  expect(
    screen.getByRole('button', { name: /Move with intention/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  storage.mockRestore()
})
