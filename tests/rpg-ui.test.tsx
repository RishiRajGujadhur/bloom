import { act, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App'
import { defaults, STORAGE_KEY } from '../src/model'
import { dayKey } from '../src/dates'

beforeEach(() => {
  localStorage.clear()
  jest.useFakeTimers()
})
afterEach(() => jest.useRealTimers())
const go = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name, exact: true }))
const growth = (tab = 'Seedling') => {
  go('Growth')
  go(tab)
}
test('habit click updates EXP and undo reverses it across pages', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Move with intention/ }))
  growth()
  expect(screen.getByText('10 EXP')).toBeInTheDocument()
  go('Daily habits')
  fireEvent.click(screen.getByRole('button', { name: 'Check in: Move with intention' }))
  growth()
  expect(screen.getByText('0 EXP')).toBeInTheDocument()
})
test('committing a priority exposes boss HP; habits and priority trigger victory', () => {
  const data = defaults()
  data.plans = [
    { id: 'goal', title: 'My critical task', date: dayKey(), done: false },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  render(<App />)
  growth('Rewards')
  fireEvent.click(screen.getByRole('checkbox', { name: 'My critical task' }))
  fireEvent.click(screen.getByRole('button', { name: /Commit today’s boss/ }))
  expect(
    screen.getByRole('progressbar', { name: 'Daily boss health' }),
  ).toHaveAttribute('value', '90')
  go('Daily habits')
  for (const name of [
    'Move with intention',
    'Stay hydrated',
    'Take a mindful moment',
  ])
    fireEvent.click(screen.getByRole('button', { name: `Check in: ${name}` }))
  growth('Rewards')
  expect(
    screen.getByRole('progressbar', { name: 'Daily boss health' }),
  ).toHaveAttribute('value', '30')
  go('My intentions')
  fireEvent.click(screen.getByRole('button', { name: /01 My critical task/ }))
  growth('Rewards')
  expect(screen.getByText('DEFEATED')).toBeInTheDocument()
  go('Seedling')
  expect(screen.getByText('90 EXP')).toBeInTheDocument()
  go('Daily habits')
  fireEvent.click(screen.getByRole('button', { name: 'Check in: Move with intention' }))
  growth('Rewards')
  expect(screen.queryByText('DEFEATED')).not.toBeInTheDocument()
  go('Seedling')
  expect(screen.getByText('30 EXP')).toBeInTheDocument()
})
test('earned chest opens once and equipment persists after reload', () => {
  const data = defaults()
  data.rpg.loot = [{ milestone: 7, earnedAt: Date.now(), opened: false }]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  const view = render(<App />)
  growth('Rewards')
  fireEvent.click(
    screen.getByRole('button', { name: /7-day chest.*Ready to open/ }),
  )
  go('Open chest')
  expect(screen.getByText('New treasures unlocked!')).toBeInTheDocument()
  go('Equip in inventory')
  const dialog = screen.getByRole('dialog')
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'forest', exact: true }),
  )
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'fox fox', exact: true }),
  )
  expect(document.querySelector('.app-shell')).toHaveAttribute(
    'data-palette',
    'forest',
  )
  view.unmount()
  render(<App />)
  expect(screen.getByRole('img', { name: 'fox companion' })).toBeInTheDocument()
  go('Rewards')
  expect(
    screen.getByRole('button', { name: /7-day chest.*Collected/ }),
  ).toBeInTheDocument()
})
test('unearned equipment stays locked and rules are on demand', () => {
  render(<App />)
  growth()
  go('Inventory')
  expect(
    screen.getByRole('button', { name: /forest 7-day chest/ }),
  ).toBeDisabled()
  expect(
    screen.getByRole('button', { name: /Unlock with the 30-day chest/ }),
  ).toBeDisabled()
  go('Close dialog')
  go('How to play')
  expect(screen.getByRole('dialog')).toHaveTextContent('72 hours gives 1.5×')
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'Health never drops below 1',
  )
})
test('missed boss settles after its day ends', async () => {
  const midnight = new Date(2026, 8, 14, 0, 0).getTime()
  jest.setSystemTime(midnight - 1000)
  const data = defaults(),
    yesterday = dayKey(new Date(midnight - 1000))
  data.plans = [{ id: 'missed', title: 'Missed', date: yesterday, done: false }]
  data.rpg.bosses[yesterday] = {
    day: yesterday,
    habitIds: [],
    priorityIds: ['missed'],
    startedAt: midnight - 10000,
    defeated: false,
    settled: false,
    penalty: 0,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  render(<App />)
  growth()
  await act(async () => jest.advanceTimersByTime(61000))
  expect(screen.getByText('95 / 100 HP')).toBeInTheDocument()
})
