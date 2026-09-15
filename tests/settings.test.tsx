import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App'
import {
  FEATURE_FLAG_STORAGE_KEY,
  getFeatureFlags,
} from '../src/utils/featureFlags'
import { resetMediaMatches, resetThemeAttributes } from './setup'

const nav = () => screen.getByRole('navigation', { name: 'Main navigation' })
const openSettings = () =>
  fireEvent.click(within(nav()).getByRole('button', { name: 'Settings' }))
const goToDashboard = () =>
  fireEvent.click(within(nav()).getByRole('button', { name: 'My dashboard' }))

beforeEach(() => {
  localStorage.clear()
  resetThemeAttributes()
  resetMediaMatches()
})

test('settings opens as its own page instead of the dashboard', () => {
  render(<App />)
  // the dashboard is what we start on
  expect(document.getElementById('habits')).not.toBeNull()
  expect(document.getElementById('rpg')).not.toBeNull()

  openSettings()

  expect(
    screen.getByRole('heading', { level: 1, name: 'Settings' }),
  ).toBeInTheDocument()
  // the dashboard content is gone, not just covered up
  expect(document.getElementById('habits')).toBeNull()
  expect(document.getElementById('rpg')).toBeNull()
  expect(screen.queryByText('Move with intention')).toBeNull()
  expect(screen.queryByRole('button', { name: /Begin a check-in/ })).toBeNull()
})

test('every settings group is present on the page', () => {
  render(<App />)
  openSettings()

  for (const heading of ['Appearance', 'Features', 'Preferences']) {
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  }
  // appearance controls still work on the page
  expect(screen.getByRole('button', { name: /Dracula/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Mono/ })).toBeInTheDocument()
})

test('navigating back restores the dashboard', () => {
  render(<App />)
  openSettings()
  expect(document.getElementById('habits')).toBeNull()

  goToDashboard()

  expect(document.getElementById('habits')).not.toBeNull()
  expect(screen.getByText('Move with intention')).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { level: 1, name: 'Settings' }),
  ).toBeNull()
})

test('a disabled feature vanishes from the page, the nav and storage together', () => {
  render(<App />)
  openSettings()

  fireEvent.click(screen.getByRole('switch', { name: 'Habit tracker' }))

  expect(getFeatureFlags().habitTracker).toBe(false)
  expect(
    JSON.parse(localStorage.getItem(FEATURE_FLAG_STORAGE_KEY)!).habitTracker,
  ).toBe(false)
  // its destination goes with it
  expect(
    within(nav()).queryByRole('button', { name: 'Daily habits' }),
  ).toBeNull()

  goToDashboard()
  expect(document.getElementById('habits')).toBeNull()
  expect(screen.queryByText('Move with intention')).toBeNull()
  // the rest of the dashboard is untouched
  expect(document.getElementById('rpg')).not.toBeNull()
})

test('a feature can be switched back on again', () => {
  render(<App />)
  openSettings()

  fireEvent.click(screen.getByRole('switch', { name: 'Habit tracker' }))
  expect(getFeatureFlags().habitTracker).toBe(false)
  fireEvent.click(screen.getByRole('switch', { name: 'Habit tracker' }))
  expect(getFeatureFlags().habitTracker).toBe(true)

  goToDashboard()
  expect(document.getElementById('habits')).not.toBeNull()
  expect(
    within(nav()).getByRole('button', { name: 'Daily habits' }),
  ).toBeInTheDocument()
})

test('the journal, RPG and intentions features each gate their own section', () => {
  render(<App />)
  openSettings()

  for (const title of ['Reflection journal', 'RPG stats', 'Intentions']) {
    fireEvent.click(screen.getByRole('switch', { name: title }))
  }
  expect(getFeatureFlags()).toMatchObject({
    chatJournal: false,
    rpgDashboard: false,
    intentions: false,
  })

  goToDashboard()
  expect(document.getElementById('journal')).toBeNull()
  expect(document.getElementById('rpg')).toBeNull()
  expect(document.getElementById('planning')).toBeNull()
})

test('preference flags reach the DOM so the CSS can react', () => {
  render(<App />)
  openSettings()

  fireEvent.click(screen.getByRole('switch', { name: 'Reduce motion' }))
  expect(document.documentElement).toHaveAttribute('data-motion', 'reduced')

  fireEvent.click(screen.getByRole('switch', { name: 'Compact cards' }))
  expect(document.documentElement).toHaveAttribute('data-density', 'compact')

  fireEvent.click(screen.getByRole('switch', { name: 'Reduce motion' }))
  expect(document.documentElement).toHaveAttribute('data-motion', 'full')
})

test('turning off the language selector removes it from the sidebar', () => {
  render(<App />)
  openSettings()

  fireEvent.click(screen.getByRole('switch', { name: 'Language selector' }))

  expect(screen.queryByLabelText('Language')).toBeNull()
})

test('the settings page shows no untranslated keys', () => {
  render(<App />)
  openSettings()

  // A missing i18n key renders as its own dotted path, which is how the
  // "settings.savedLocally" badge slipped through once already.
  const text = document.body.textContent ?? ''
  expect(text).not.toMatch(/\bsettings\.[a-zA-Z][a-zA-Z0-9.]*/)
  expect(text).not.toMatch(/\bnav\.[a-zA-Z][a-zA-Z0-9.]*/)
})

test('theme choice made on the settings page still applies to the dashboard', () => {
  render(<App />)
  openSettings()
  fireEvent.click(screen.getByRole('button', { name: /Nord/ }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'nord')

  goToDashboard()
  expect(document.documentElement).toHaveAttribute('data-theme', 'nord')
})
