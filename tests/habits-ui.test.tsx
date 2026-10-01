import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { HabitsPage } from '../src/features/HabitsPage'
import { defaults } from '../src/model'
import { defaultSettings, SETTINGS_STORAGE_KEY } from '../src/SettingsPage'

function Harness() {
  const [data, setData] = useState(() => ({ ...defaults(), routines: [{ id: 'r', title: 'Morning ritual', period: 'morning' as const, days: [1], dates: [] as string[], steps: [{ id: 's', title: 'Read a page', minutes: 1 }, { id: 't', title: 'Stretch', minutes: 1 }] }] }))
  return <HabitsPage data={data} setData={setData as Parameters<typeof HabitsPage>[0]['setData']} today="2026-09-21" />
}

test('routine pauses, resumes, advances and records only a fully completed session', () => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-09-21T12:00:00'))
  render(<Harness />)
  fireEvent.click(screen.getByRole('tab', { name: 'Routines' }))
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => jest.advanceTimersByTime(10000))
  expect(screen.getByRole('timer')).toHaveTextContent('00:50')
  fireEvent.click(screen.getByRole('button', { name: 'Pause routine' }))
  act(() => jest.advanceTimersByTime(10000))
  expect(screen.getByRole('timer')).toHaveTextContent('00:50')
  fireEvent.click(screen.getByRole('button', { name: 'Resume routine' }))
  fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))
  expect(screen.getByRole('heading', { name: 'Stretch' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))
  expect(screen.getByText('Completed today')).toBeInTheDocument()
  jest.useRealTimers()
})

test('skipped steps do not award a completed routine', () => {
  render(<Harness />)
  fireEvent.click(screen.getByRole('tab', { name: 'Routines' }))
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  fireEvent.click(screen.getByRole('button', { name: 'Skip step' }))
  fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))
  expect(screen.getByText('0 completions')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('1 skipped step')
})

test('habit calendar can be hidden with its Settings option', () => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...defaultSettings, sub: { 'habitTracker.calendar': false } }))
  const { unmount } = render(<Harness />)
  expect(screen.queryByRole('region', { name: 'Habit calendar' })).not.toBeInTheDocument()
  unmount()
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings))
  render(<Harness />)
  expect(screen.getByRole('region', { name: 'Habit calendar' })).toBeInTheDocument()
  localStorage.removeItem(SETTINGS_STORAGE_KEY)
})
