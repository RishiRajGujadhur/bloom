import { fireEvent, render, screen } from '@testing-library/react'
import App from '../src/App'
import { showAll } from './helpers/showAll'
import { THEME_STORAGE_KEY } from '../src/utils/themeEngine'

/**
 * Integration coverage for the ported wiring: the sidebar must swap the page,
 * and the picker inside Settings must reach the engine and repaint <html>.
 */
beforeEach(() => {
  localStorage.clear()
  for (const attribute of ['data-theme', 'data-font', 'data-mode', 'data-sidebar']) {
    document.documentElement.removeAttribute(attribute)
  }
})

const openSettings = () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
}

test('the Settings destination swaps the dashboard for the settings page', () => {
  render(<App />)
  expect(screen.queryByText('Appearance')).not.toBeInTheDocument()
  expect(screen.getByText('Daily Quests')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

  expect(screen.getByText('Appearance')).toBeInTheDocument()
  expect(screen.queryByText('Daily Quests')).not.toBeInTheDocument()
})

test("their feature flags survive the port and still control the UI", () => {
  openSettings()
  showAll()

  expect(screen.getByText('Features')).toBeInTheDocument()
  expect(screen.getByText('Habit tracker')).toBeInTheDocument()
  expect(screen.getByText('RPG skill tree')).toBeInTheDocument()
  expect(screen.getByText('Walkthrough tour')).toBeInTheDocument()
})

test('every palette in the catalog is offered in Settings', () => {
  openSettings()
  showAll()
  for (const label of [
    /Bloom Light/,
    /Bloom Dark/,
    /Dracula/,
    /Nord/,
    /Catppuccin Mocha/,
    /Tokyo Night/,
    /Rosé Pine/,
    /Synthwave 84/,
  ]) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  }
})

test('choosing a palette repaints the document and persists', () => {
  openSettings()
  showAll()
  expect(document.documentElement.getAttribute('data-theme')).toBe('bloom-light')

  fireEvent.click(screen.getByRole('button', { name: /Dracula/ }))

  expect(document.documentElement.getAttribute('data-theme')).toBe('dracula')
  expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toContain('dracula')
})

test('choosing a font personality repaints the document and persists', () => {
  openSettings()
  showAll()

  fireEvent.click(screen.getByRole('button', { name: /Serif/ }))

  expect(document.documentElement.getAttribute('data-font')).toBe('serif')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toContain('serif')
})

test('the topbar light/dark toggle keeps the palette family', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

  expect(document.documentElement.getAttribute('data-theme')).toBe('bloom-dark')
  expect(document.documentElement.getAttribute('data-mode')).toBe('dark')

  fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))
  expect(document.documentElement.getAttribute('data-theme')).toBe('bloom-light')
})

test('a stored palette is applied before the first paint', () => {
  localStorage.setItem(
    THEME_STORAGE_KEY,
    JSON.stringify({ themeId: 'nord', fontId: 'pixel' }),
  )
  render(<App />)

  expect(document.documentElement.getAttribute('data-theme')).toBe('nord')
  expect(document.documentElement.getAttribute('data-font')).toBe('pixel')
  expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
})
