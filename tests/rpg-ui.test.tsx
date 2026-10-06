import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { renderApp } from './helpers/renderApp'
import { defaults, STORAGE_KEY } from '../src/model'
import { dayKey } from '../src/dates'

beforeEach(() => {
  localStorage.clear()
  jest.useFakeTimers()
})
afterEach(() => jest.useRealTimers())
const go = async (name: string) =>
  await act(async () => { fireEvent.click(screen.getByRole('button', { name, exact: true })) })
const growth = async (tab = 'Seedling') => {
  await go('Growth')
  await go(tab)
}
test('habit click updates EXP and undo reverses it across pages', async () => {
  await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Move with intention/ })) })
  await growth()
  expect(screen.getByText('10 EXP')).toBeInTheDocument()
  await go('Daily habits')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Check in: Move with intention' })) })
  await growth()
  expect(screen.getByText('0 EXP')).toBeInTheDocument()
})
test('committing a priority exposes boss HP; habits and priority trigger victory', async () => {
  const data = defaults()
  data.plans = [
    { id: 'goal', title: 'My critical task', date: dayKey(), done: false },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  await renderApp()
  await growth('Rewards')
  await act(async () => { fireEvent.click(screen.getByRole('checkbox', { name: 'My critical task' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Commit today’s boss/ })) })
  expect(
    screen.getByRole('progressbar', { name: 'Daily boss health' }),
  ).toHaveAttribute('value', '90')
  await go('Daily habits')
  for (const name of [
    'Move with intention',
    'Stay hydrated',
    'Take a mindful moment',
  ])
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: `Check in: ${name}` })) })
  await growth('Rewards')
  expect(
    screen.getByRole('progressbar', { name: 'Daily boss health' }),
  ).toHaveAttribute('value', '30')
  await go('My intentions')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /01 My critical task/ })) })
  await growth('Rewards')
  expect(screen.getByText('DEFEATED')).toBeInTheDocument()
  await go('Seedling')
  expect(screen.getByText('90 EXP')).toBeInTheDocument()
  await go('Daily habits')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Check in: Move with intention' })) })
  await growth('Rewards')
  expect(screen.queryByText('DEFEATED')).not.toBeInTheDocument()
  await go('Seedling')
  expect(screen.getByText('30 EXP')).toBeInTheDocument()
})
test('earned chest opens once and equipment persists after reload', async () => {
  const data = defaults()
  data.rpg.loot = [{ milestone: 7, earnedAt: Date.now(), opened: false }]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  const view = await renderApp()
  await growth('Rewards')
  await act(async () => { fireEvent.click(
    screen.getByRole('button', { name: /7-day chest.*Ready to open/ }),
  ) })
  await go('Open chest')
  expect(screen.getByText('New treasures unlocked!')).toBeInTheDocument()
  await go('Equip in inventory')
  const dialog = screen.getByRole('dialog')
  await act(async () => { fireEvent.click(
    within(dialog).getByRole('button', { name: 'forest', exact: true }),
  ) })
  await act(async () => { fireEvent.click(
    within(dialog).getByRole('button', { name: 'fox fox', exact: true }),
  ) })
  expect(document.querySelector('.app-shell')).toHaveAttribute(
    'data-palette',
    'forest',
  )
  view.unmount()
  await renderApp()
  expect(screen.getByRole('img', { name: 'fox companion' })).toBeInTheDocument()
  await go('Rewards')
  expect(
    screen.getByRole('button', { name: /7-day chest.*Collected/ }),
  ).toBeInTheDocument()
})
test('unearned equipment stays locked and rules are on demand', async () => {
  await renderApp()
  await growth()
  await go('Inventory')
  expect(
    screen.getByRole('button', { name: /forest 7-day chest/ }),
  ).toBeDisabled()
  expect(
    screen.getByRole('button', { name: /Unlock with the 30-day chest/ }),
  ).toBeDisabled()
  await go('Close dialog')
  await go('How to play')
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
  await renderApp()
  await growth()
  await act(async () => jest.advanceTimersByTime(61000))
  expect(screen.getByText('95 / 100 HP')).toBeInTheDocument()
})
