import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { renderApp } from './helpers/renderApp'
import { STORAGE_KEY } from '../src/model'
beforeEach(() => {
  localStorage.clear()
  jest.useFakeTimers()
})
afterEach(() => jest.useRealTimers())
test('journal saves one completed reflection and restores it after remount', async () => {
  const view = await renderApp()
  await act(async () => { fireEvent.click(
    screen.getAllByRole('button', { name: 'Reflection journal' })[0],
  ) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Begin a check-in/ })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'mood 4 of 5' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'energy 3 of 5' })) })
  for (const answer of [
    'Feeling grounded',
    'I showed up',
    'I paused and tried again',
    'Take a 10-minute walk',
  ]) {
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: answer })) })
    await act(async () => {
      jest.advanceTimersByTime(900)
    })
  }
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Save & review/ })) })
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(data.sessions).toHaveLength(1)
  expect(data.sessions[0].metadata).toMatchObject({ mood: 4, energy: 3 })
  view.unmount()
  await renderApp()
  expect(
    screen.getByRole('button', { name: /View saved reflection/ }),
  ).toBeInTheDocument()
  await act(async () => { fireEvent.click(
    screen.getByRole('button', { name: /Start another check-in/ }),
  ) })
  expect(screen.getByRole('button', { name: 'mood 4 of 5' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
test('pending journal timer resumes once after unmount and reload', async () => {
  const view = await renderApp()
  await act(async () => { fireEvent.click(
    screen.getAllByRole('button', { name: 'Reflection journal' })[0],
  ) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Begin a check-in/ })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Feeling grounded' })) })
  expect(
    screen.getByRole('button', { name: 'Feeling grounded' }),
  ).toBeDisabled()
  view.unmount()
  await act(async () => {
    jest.advanceTimersByTime(2000)
  })
  await renderApp()
  await act(async () => {
    jest.advanceTimersByTime(900)
  })
  expect(
    within(screen.getByRole('log')).getAllByText(/What’s one small win/),
  ).toHaveLength(1)
})
test('quick journal saves a tagged micro-entry without starting the guided flow', async () => {
  await renderApp()
  await act(async () => { fireEvent.click(
    screen.getAllByRole('button', { name: 'Reflection journal' })[0],
  ) })
  fireEvent.change(screen.getByLabelText('Quick journal entry'), {
    target: { value: 'The morning light felt peaceful.' },
  })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '#grateful' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Good' })) })
  await act(async () => {
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save entry' })) })
  })
  expect(screen.getByText(/Saved to your journal/)).toBeInTheDocument()
  expect(
    screen.getAllByText('The morning light felt peaceful.').length,
  ).toBeGreaterThan(0)
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(data.sessions[0].metadata).toMatchObject({
    entryType: 'micro',
    mood: 4,
    tags: ['grateful'],
  })
})
test('habit completion persists after reload', async () => {
  const view = await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Move with intention/ })) })
  view.unmount()
  await renderApp()
  // Habits completed on an earlier visit fold into "completed earlier".
  expect(
    screen.queryByRole('button', { name: /Move with intention/ }),
  ).not.toBeInTheDocument()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /1 completed earlier/ })) })
  expect(
    screen.getByRole('button', { name: /Move with intention/ }),
  ).toHaveAttribute('aria-pressed', 'true')
})
test('light/dark toggle switches palette mode and persists after reload', async () => {
  const view = await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' })) })
  // data-theme now names the palette; data-mode carries light/dark.
  expect(document.documentElement).toHaveAttribute('data-mode', 'dark')
  expect(document.documentElement).toHaveAttribute('data-theme', 'bloom-dark')
  view.unmount()
  await renderApp()
  expect(
    screen.getByRole('button', { name: 'Switch to light mode' }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(document.documentElement).toHaveAttribute('data-mode', 'dark')
})
test('corrupt storage is not overwritten by rendering', async () => {
  localStorage.setItem(STORAGE_KEY, 'broken')
  await renderApp()
  expect(screen.getByRole('alert')).toHaveTextContent('not been overwritten')
  expect(localStorage.getItem(STORAGE_KEY)).toBe('broken')
})
test('a failed save is reported without dropping in-memory changes', async () => {
  const storage = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
  await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Move with intention/ })) })
  expect(screen.getByRole('alert')).toHaveTextContent('in memory only')
  expect(
    screen.getByRole('button', { name: /Move with intention/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  storage.mockRestore()
})
