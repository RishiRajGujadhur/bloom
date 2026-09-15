import { useEffect, useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '../src/i18n/i18n'
import { ThemePicker } from '../src/components/settings/ThemePicker'
import {
  FONTS,
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
} from '../src/utils/themeEngine'
import type { ThemeSettings } from '../src/utils/themeEngine'
import { resetThemeAttributes } from './setup'

/** Mirrors how App wires the picker to the engine. */
function Harness() {
  const [settings, setSettings] = useState<ThemeSettings>(getStoredTheme)
  useEffect(() => {
    applyTheme(settings)
  }, [settings])
  return <ThemePicker settings={settings} onChange={setSettings} />
}

const stored = () =>
  JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? 'null')

beforeEach(() => {
  localStorage.clear()
  resetThemeAttributes()
})

test('renders a swatch for every palette and marks the active one', () => {
  render(<Harness />)

  for (const theme of THEMES) {
    const card = screen.getByRole('button', { name: new RegExp(theme.name) })
    expect(card).toHaveAttribute(
      'aria-pressed',
      String(theme.id === 'github-dark'),
    )
  }
})

test('each swatch carries its own data-theme so previews follow themes.css', () => {
  const { container } = render(<Harness />)

  for (const theme of THEMES) {
    expect(container.querySelector(`[data-theme='${theme.id}']`)).not.toBeNull()
  }
})

test('choosing a palette applies it immediately and persists it', () => {
  render(<Harness />)

  fireEvent.click(screen.getByRole('button', { name: /Catppuccin Mocha/ }))

  expect(document.documentElement).toHaveAttribute(
    'data-theme',
    'catppuccin-mocha',
  )
  expect(document.documentElement).toHaveAttribute('data-mode', 'dark')
  expect(stored()).toEqual({ themeId: 'catppuccin-mocha', fontId: 'system' })
  expect(
    screen.getByRole('button', { name: /Catppuccin Mocha/ }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('a light palette switches the mode attribute', () => {
  render(<Harness />)

  fireEvent.click(screen.getByRole('button', { name: /GitHub Light/ }))
  expect(document.documentElement).toHaveAttribute('data-mode', 'light')
})

test('every font offers a sample rendered in its own face', () => {
  const { container } = render(<Harness />)

  for (const font of FONTS) {
    expect(container.querySelector(`[data-font='${font.id}']`)).not.toBeNull()
    expect(screen.getByText(font.sample)).toBeInTheDocument()
  }
})

test('choosing a font applies it immediately and persists it', () => {
  render(<Harness />)

  fireEvent.click(screen.getByRole('button', { name: /Mono/ }))

  expect(document.documentElement).toHaveAttribute('data-font', 'mono')
  expect(stored()).toEqual({ themeId: 'github-dark', fontId: 'mono' })
})

test('a custom accent can be set and reset back to the palette accent', () => {
  render(<Harness />)

  fireEvent.change(screen.getByLabelText(/Custom accent/), {
    target: { value: '#12ab34' },
  })
  expect(
    document.documentElement.style.getPropertyValue('--accent-color'),
  ).toBe('#12ab34')
  expect(stored().customAccent).toBe('#12ab34')

  fireEvent.click(screen.getByRole('button', { name: /Use palette accent/ }))

  expect(
    document.documentElement.style.getPropertyValue('--accent-color'),
  ).toBe('')
  expect(stored()).toEqual({ themeId: 'github-dark', fontId: 'system' })
})

test('theme and font choices are independent of each other', () => {
  render(<Harness />)

  fireEvent.click(screen.getByRole('button', { name: /Nord/ }))
  fireEvent.click(screen.getByRole('button', { name: /Handwritten/ }))

  expect(stored()).toEqual({ themeId: 'nord', fontId: 'handwritten' })
})
