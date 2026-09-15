import {
  DEFAULT_FONT_ID,
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  getThemeMode,
  toggleThemeMode,
} from '../src/utils/themeEngine'
import { resetThemeAttributes } from './setup'

const root = () => document.documentElement
const stored = () =>
  JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? 'null')

beforeEach(() => {
  localStorage.clear()
  resetThemeAttributes()
})

test('getStoredTheme falls back to the documented defaults', () => {
  expect(getStoredTheme()).toEqual({
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
  })
})

test('applyTheme writes palette, font and mode to <html> and persists', () => {
  applyTheme({ themeId: 'nord', fontId: 'mono' })

  expect(root()).toHaveAttribute('data-theme', 'nord')
  expect(root()).toHaveAttribute('data-font', 'mono')
  expect(root()).toHaveAttribute('data-mode', 'dark')
  expect(root().style.colorScheme).toBe('dark')

  expect(stored()).toEqual({ themeId: 'nord', fontId: 'mono' })
  expect(getStoredTheme()).toEqual({ themeId: 'nord', fontId: 'mono' })
})

test('a light palette sets data-mode to light', () => {
  applyTheme({ themeId: 'github-light', fontId: 'system' })
  expect(getThemeMode('github-light')).toBe('light')
  expect(root()).toHaveAttribute('data-mode', 'light')
})

test('unknown ids never reach the DOM and fall back to defaults', () => {
  applyTheme({ themeId: 'not-a-theme', fontId: 'not-a-font' })

  expect(root()).toHaveAttribute('data-theme', DEFAULT_THEME_ID)
  expect(root()).toHaveAttribute('data-font', DEFAULT_FONT_ID)
  // and the hostile value is not persisted either
  expect(stored()).toEqual({
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
  })
})

test('a custom accent overrides the palette only while it is valid', () => {
  applyTheme({ themeId: 'dracula', fontId: 'system', customAccent: '#ff0000' })
  expect(root().style.getPropertyValue('--accent-color')).toBe('#ff0000')

  applyTheme({ themeId: 'dracula', fontId: 'system' })
  expect(root().style.getPropertyValue('--accent-color')).toBe('')
  expect(stored()).toEqual({ themeId: 'dracula', fontId: 'system' })
})

test('a malformed accent is rejected rather than injected', () => {
  applyTheme({
    themeId: 'dracula',
    fontId: 'system',
    customAccent: 'red; background: url(evil)',
  })

  expect(root().style.getPropertyValue('--accent-color')).toBe('')
  expect(stored()).toEqual({ themeId: 'dracula', fontId: 'system' })
})

test('getStoredTheme migrates a pre-multi-theme light/dark choice', () => {
  localStorage.setItem('mindfulness-dashboard-theme', 'dark')
  expect(getStoredTheme().themeId).toBe('bloom-dark')

  localStorage.setItem('mindfulness-dashboard-theme', 'light')
  expect(getStoredTheme().themeId).toBe('bloom-light')
})

test('a corrupt settings payload is ignored', () => {
  localStorage.setItem(THEME_STORAGE_KEY, '{not json')
  expect(getStoredTheme()).toEqual({
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
  })
})

test('toggleThemeMode flips to the other mode and can be reversed', () => {
  const dark = { themeId: 'dracula', fontId: 'mono' }
  const light = toggleThemeMode(dark)
  expect(light.themeId).toBe('github-light')
  expect(getThemeMode(light.themeId)).toBe('light')
  expect(light.fontId).toBe('mono')

  // switching back returns to the theme that was last used in dark mode
  expect(toggleThemeMode(light).themeId).toBe('dracula')
})

test('applyTheme still themes the page when storage is unavailable', () => {
  const setItem = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
  try {
    expect(() =>
      applyTheme({ themeId: 'synthwave-84', fontId: 'serif' }),
    ).not.toThrow()
    expect(root()).toHaveAttribute('data-theme', 'synthwave-84')
    expect(root()).toHaveAttribute('data-font', 'serif')
  } finally {
    setItem.mockRestore()
  }
})
