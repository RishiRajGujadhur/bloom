import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_FONT_ID,
  DEFAULT_THEME_ID,
  FONTS,
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  getThemeMode,
  toggleThemeMode,
} from '../src/utils/themeEngine'

const themesCss = fs.readFileSync(
  path.join(process.cwd(), 'src/styles/themes.css'),
  'utf8',
)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-font')
  document.documentElement.removeAttribute('data-mode')
  document.documentElement.style.removeProperty('--accent-color')
})

test("the app's own palette is the default, not a third-party scheme", () => {
  expect(DEFAULT_THEME_ID).toBe('bloom-light')
  expect(getStoredTheme()).toEqual({
    themeId: 'bloom-light',
    fontId: DEFAULT_FONT_ID,
  })
})

test('every palette in the catalog has a matching block in themes.css', () => {
  const missing = THEMES.filter(
    (theme) => !themesCss.includes(`[data-theme='${theme.id}']`),
  ).map((theme) => theme.id)
  expect(missing).toEqual([])
})

test('every font in the catalog has a matching block in themes.css', () => {
  const missing = FONTS.filter(
    (font) => !themesCss.includes(`[data-font='${font.id}']`),
  ).map((font) => font.id)
  expect(missing).toEqual([])
})

test('the light/dark toggle pairs the app palettes and is reversible', () => {
  const dark = toggleThemeMode({ themeId: 'bloom-light', fontId: 'system' })
  expect(dark.themeId).toBe('bloom-dark')
  expect(getThemeMode(dark.themeId)).toBe('dark')

  const back = toggleThemeMode(dark)
  expect(back.themeId).toBe('bloom-light')
})

test('applyTheme writes the palette, font and mode to the document', () => {
  applyTheme({ themeId: 'dracula', fontId: 'mono' })

  const root = document.documentElement
  expect(root.getAttribute('data-theme')).toBe('dracula')
  expect(root.getAttribute('data-font')).toBe('mono')
  expect(root.getAttribute('data-mode')).toBe('dark')
  expect(root.style.colorScheme).toBe('dark')
})

test('a custom accent is applied inline and removed when cleared', () => {
  applyTheme({ themeId: 'bloom-light', fontId: 'system', customAccent: '#ff0000' })
  expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe(
    '#ff0000',
  )

  applyTheme({ themeId: 'bloom-light', fontId: 'system' })
  expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('')
})

test('an invalid accent is refused rather than injected into the DOM', () => {
  applyTheme({
    themeId: 'bloom-light',
    fontId: 'system',
    customAccent: 'red; background: url(http://x)',
  })
  expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('')
})

test('unreadable or hostile stored settings fall back to usable defaults', () => {
  localStorage.setItem(THEME_STORAGE_KEY, '{ not json')
  expect(getStoredTheme()).toEqual({
    themeId: 'bloom-light',
    fontId: DEFAULT_FONT_ID,
  })

  localStorage.setItem(
    THEME_STORAGE_KEY,
    JSON.stringify({ themeId: 'not-a-theme', fontId: 'not-a-font' }),
  )
  expect(getStoredTheme()).toEqual({
    themeId: 'bloom-light',
    fontId: DEFAULT_FONT_ID,
  })
})

test('a pre-multi-theme light/dark choice is migrated to its Bloom palette', () => {
  localStorage.setItem('mindfulness-dashboard-theme', 'dark')
  expect(getStoredTheme().themeId).toBe('bloom-dark')

  localStorage.clear()
  localStorage.setItem('mindfulness-dashboard-theme', 'light')
  expect(getStoredTheme().themeId).toBe('bloom-light')
})

test('settings survive a reload', () => {
  applyTheme({ themeId: 'nord', fontId: 'serif' })
  expect(getStoredTheme()).toEqual({ themeId: 'nord', fontId: 'serif' })
})
