import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App'
import {
  resetMediaMatches,
  resetThemeAttributes,
  setNarrowScreen,
} from './setup'

const nav = () => screen.getByRole('navigation', { name: 'Main navigation' })

beforeEach(() => {
  localStorage.clear()
  resetThemeAttributes()
  resetMediaMatches()
})
afterEach(() => resetMediaMatches())

test('lists every destination in the sidebar navigation', () => {
  render(<App />)

  for (const label of [
    'My dashboard',
    'Daily habits',
    'Reflection journal',
    'RPG stats',
    'My intentions',
    'Settings',
  ]) {
    expect(
      within(nav()).getByRole('button', { name: label }),
    ).toBeInTheDocument()
  }
})

test('collapsing publishes the state the layout CSS keys off', () => {
  render(<App />)
  expect(document.documentElement).toHaveAttribute('data-sidebar', 'open')

  fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
  expect(document.documentElement).toHaveAttribute('data-sidebar', 'collapsed')
  // the sidebar itself records the mode it is in
  expect(document.getElementById('app-sidebar')).toHaveAttribute(
    'data-state',
    'collapsed',
  )

  fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))
  expect(document.documentElement).toHaveAttribute('data-sidebar', 'open')
})

test('an icon-only rail keeps every destination reachable by name', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

  // with the visible label hidden, the button still has an accessible name
  expect(
    within(nav()).getByRole('button', { name: 'Settings' }),
  ).toBeInTheDocument()
})

test('navigating marks the destination current and scrolls to it', () => {
  render(<App />)

  const rpg = within(nav()).getByRole('button', { name: 'RPG stats' })
  fireEvent.click(rpg)

  expect(rpg).toHaveAttribute('aria-current', 'page')
  expect(document.getElementById('rpg')).not.toBeNull()
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
})

test('the settings destination swaps the page instead of scrolling to a section', () => {
  render(<App />)

  fireEvent.click(within(nav()).getByRole('button', { name: 'Settings' }))

  expect(document.getElementById('settings')).not.toBeNull()
  expect(
    screen.getByRole('heading', { level: 1, name: 'Settings' }),
  ).toBeInTheDocument()
  // the dashboard gave way rather than sitting behind it
  expect(document.getElementById('habits')).toBeNull()
})

test('on narrow screens the sidebar becomes a drawer behind a backdrop', () => {
  setNarrowScreen(true)
  const { container } = render(<App />)
  const backdrop = container.querySelector('.backdrop') as HTMLElement
  expect(backdrop).toHaveAttribute('data-visible', 'false')

  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))
  expect(backdrop).toHaveAttribute('data-visible', 'true')
  expect(document.getElementById('app-sidebar')).toHaveAttribute(
    'data-state',
    'open',
  )

  // picking a destination closes the drawer so the content is visible again
  fireEvent.click(within(nav()).getByRole('button', { name: 'Daily habits' }))
  expect(backdrop).toHaveAttribute('data-visible', 'false')
})

test('escape and a backdrop click both dismiss the drawer', () => {
  setNarrowScreen(true)
  const { container } = render(<App />)
  const backdrop = container.querySelector('.backdrop') as HTMLElement
  const hamburger = screen.getByRole('button', { name: 'Open navigation menu' })

  fireEvent.click(hamburger)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(backdrop).toHaveAttribute('data-visible', 'false')

  fireEvent.click(hamburger)
  fireEvent.click(backdrop)
  expect(backdrop).toHaveAttribute('data-visible', 'false')
})

test('the drawer does not lock the page while it is closed', () => {
  setNarrowScreen(true)
  render(<App />)

  expect(document.body.style.overflow).not.toBe('hidden')

  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))
  expect(document.body.style.overflow).toBe('hidden')

  fireEvent.keyDown(window, { key: 'Escape' })
  expect(document.body.style.overflow).not.toBe('hidden')
})
