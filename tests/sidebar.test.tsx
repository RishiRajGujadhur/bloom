import { act, fireEvent, render, screen } from '@testing-library/react'
import '../src/i18n'
import { Sidebar } from '../src/components/layout/Sidebar'
import type { FeatureFlags } from '../src/SettingsPage'
import { resetMatchMedia, resetThemeAttributes, setNarrowScreen } from './setup'

const allOn: FeatureFlags = {
  dailySpin: true,
  collectibles: true,
  fullCalendar: true,
  visionBoard: true,
  bloomWorld: true,
  breathe: true,
  moodCheckin: true,
  gratitude: true,
  compactMode: false,
  sleepTracker: true,
  petalShop: true,
  reminders: true,
  adaptiveGoals: true,
  celebrations: true,
  burnRelease: true,
  garage: true,
  urgeClock: true,
  focusRoom: true,
  timeCapsule: true,
  thoughtDiff: true,
  queryBuilder: true,
  yearbook: true,
  memoryPalace: true,
  skillConstellation: true,
  streakJourney: true,
  moodOrb: true,
  placesMap: true,
  timeSince: true,
  drawnAchievements: true,
  flowTopography: true,
  postureGuard: true,
  impactTasks: true,
  epiphanies: true,
  dailyFlow: true,
  dietTracker: true,
  monkMode: true,
  energySankey: true,
  voiceMemos: true,
  insightsLab: true,
  smartSearch: true,
  omnibox: true,
  pixelJuice: true,
  microNutrients: true,
  recipeBuilder: true,
  breathSilk: true,
  wuXing: true,
  bloomCore: true,
  daylight: true,
  eyeCare: true,
  digitalWellbeing: true,
  routineScheduler: true,
  goalRoadmap: true,
  brainGames: true,
  flashcards: true,
  mindMaps: true,
  moodMirror: true,
  inkJournal: true,
  mala: true,
  breathwork: true,
  meditation: true,
  soundMixer: true,
  focusSounds: true,
  fasting: true,
  foodScanner: true,
  bodyProgress: true,
  runTracker: true,
  mobility: true,
  yogaFlow: true,
  intervalCoach: true,
  workoutLog: true,
  exerciseGuides: true,
  urgeTracker: true,
  habitTracker: true,
  chatJournal: true,
  rpgSkillTree: true,
  weeklyRaidBoss: true,
  daybookModes: true,
  languageSelector: true,
  walkthroughTour: true,
}

const noneOn: FeatureFlags = {
  dailySpin: false,
  collectibles: false,
  fullCalendar: false,
  visionBoard: false,
  bloomWorld: false,
  breathe: false,
  moodCheckin: false,
  gratitude: false,
  compactMode: false,
  sleepTracker: true,
  petalShop: true,
  reminders: true,
  adaptiveGoals: true,
  celebrations: true,
  burnRelease: true,
  garage: true,
  urgeClock: true,
  focusRoom: true,
  timeCapsule: true,
  thoughtDiff: true,
  queryBuilder: true,
  yearbook: true,
  memoryPalace: true,
  skillConstellation: true,
  streakJourney: true,
  moodOrb: true,
  placesMap: true,
  timeSince: true,
  drawnAchievements: true,
  flowTopography: true,
  postureGuard: true,
  impactTasks: true,
  epiphanies: true,
  dailyFlow: true,
  dietTracker: true,
  monkMode: true,
  energySankey: true,
  voiceMemos: true,
  insightsLab: true,
  smartSearch: true,
  omnibox: true,
  pixelJuice: true,
  microNutrients: true,
  recipeBuilder: true,
  breathSilk: true,
  wuXing: true,
  bloomCore: true,
  daylight: true,
  eyeCare: true,
  digitalWellbeing: true,
  routineScheduler: true,
  goalRoadmap: true,
  brainGames: true,
  flashcards: true,
  mindMaps: true,
  moodMirror: true,
  inkJournal: true,
  mala: true,
  breathwork: true,
  meditation: true,
  soundMixer: true,
  focusSounds: true,
  fasting: true,
  foodScanner: true,
  bodyProgress: true,
  runTracker: true,
  mobility: true,
  yogaFlow: true,
  intervalCoach: true,
  workoutLog: true,
  exerciseGuides: true,
  urgeTracker: false,
  habitTracker: false,
  chatJournal: false,
  rpgSkillTree: false,
  weeklyRaidBoss: false,
  daybookModes: false,
  languageSelector: false,
  walkthroughTour: false,
}

const renderSidebar = (flags: FeatureFlags = allOn) => {
  const onNavigate = jest.fn()
  const view = render(
    <Sidebar active="overview" onNavigate={onNavigate} flags={flags} />,
  )
  return { ...view, onNavigate }
}

beforeEach(() => {
  localStorage.clear()
  resetThemeAttributes()
  resetMatchMedia()
})

test('every destination is offered when its feature is on', () => {
  renderSidebar()

  for (const label of [
    'My dashboard',
    'Daily habits',
    'Reflection journal',
    'Daybook modes',
    'Urges',
    'My intentions',
    'My Collectibles',
    'Settings',
  ]) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  }
})

test('a disabled feature disappears from the navigation', () => {
  renderSidebar({ ...allOn, habitTracker: false, chatJournal: false })

  expect(
    screen.queryByRole('button', { name: 'Daily habits' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Reflection journal' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'My dashboard' }),
  ).toBeInTheDocument()
})

test('Settings stays reachable with every feature switched off', () => {
  renderSidebar(noneOn)

  expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'My Collectibles' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Daily habits' }),
  ).not.toBeInTheDocument()
})

test('the active destination is marked for assistive technology', () => {
  renderSidebar()
  expect(screen.getByRole('button', { name: 'My dashboard' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('collapsing publishes the state the layout rules key off', () => {
  renderSidebar()
  expect(document.documentElement.dataset.sidebar).toBe('open')

  fireEvent.click(screen.getByRole('button', { name: /^(Collapse|Expand) menu$/ }))
  expect(document.documentElement.dataset.sidebar).toBe('collapsed')

  fireEvent.click(screen.getByRole('button', { name: /^(Collapse|Expand) menu$/ }))
  expect(document.documentElement.dataset.sidebar).toBe('open')
})

test('navigating reports the destination', () => {
  const { onNavigate } = renderSidebar()

  fireEvent.click(screen.getByRole('button', { name: 'Daily habits' }))

  expect(onNavigate).toHaveBeenCalledWith('habits')
})

test('at drawer widths the sidebar is shut until the hamburger opens it', () => {
  const { container } = renderSidebar()

  act(() => setNarrowScreen(true))
  expect(document.documentElement.dataset.sidebar).toBe('collapsed')

  const backdrop = container.querySelector('div[data-visible]')
  expect(backdrop).toHaveAttribute('data-visible', 'false')

  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
  expect(document.documentElement.dataset.sidebar).toBe('open')
  expect(backdrop).toHaveAttribute('data-visible', 'true')
})

test('the backdrop closes the drawer', () => {
  const { container } = renderSidebar()
  act(() => setNarrowScreen(true))

  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
  const backdrop = container.querySelector('div[data-visible]')
  fireEvent.click(backdrop as Element)

  expect(document.documentElement.dataset.sidebar).toBe('collapsed')
})

test('navigating inside the drawer closes it', () => {
  const { onNavigate } = renderSidebar()
  act(() => setNarrowScreen(true))
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

  fireEvent.click(screen.getByRole('button', { name: 'My intentions' }))

  expect(onNavigate).toHaveBeenCalledWith('planning')
  expect(document.documentElement.dataset.sidebar).toBe('collapsed')
})

test('Escape closes the drawer', () => {
  renderSidebar()
  act(() => setNarrowScreen(true))
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

  fireEvent.keyDown(window, { key: 'Escape' })

  expect(document.documentElement.dataset.sidebar).toBe('collapsed')
})

test('returning to a wide screen restores the expanded column', () => {
  renderSidebar()
  act(() => setNarrowScreen(true))
  expect(document.documentElement.dataset.sidebar).toBe('collapsed')

  act(() => setNarrowScreen(false))
  expect(document.documentElement.dataset.sidebar).toBe('open')
})
