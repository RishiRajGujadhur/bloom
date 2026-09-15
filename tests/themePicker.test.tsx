import { fireEvent, render, screen } from '@testing-library/react'
import '../src/i18n'
import { ThemePicker } from '../src/components/settings/ThemePicker'
import { FONTS, THEMES } from '../src/utils/themeEngine'
import type { ThemeSettings } from '../src/utils/themeEngine'

const settings: ThemeSettings = { themeId: 'bloom-light', fontId: 'system' }

test('every palette in the catalog is offered as a swatch', () => {
  render(<ThemePicker settings={settings} onChange={jest.fn()} />)
  for (const theme of THEMES) {
    expect(screen.getByRole('button', { name: new RegExp(theme.name) })).toBeInTheDocument()
  }
})

test('every font personality is offered with its own sample', () => {
  render(<ThemePicker settings={settings} onChange={jest.fn()} />)
  for (const font of FONTS) {
    expect(screen.getByText(font.sample)).toBeInTheDocument()
  }
})

test('the active palette is marked as pressed', () => {
  render(
    <ThemePicker settings={{ themeId: 'nord', fontId: 'system' }} onChange={jest.fn()} />,
  )
  expect(screen.getByRole('button', { name: /Nord/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /Dracula/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('choosing a palette reports the new theme id and keeps the font', () => {
  const onChange = jest.fn()
  render(<ThemePicker settings={settings} onChange={onChange} />)

  fireEvent.click(screen.getByRole('button', { name: /Dracula/ }))

  expect(onChange).toHaveBeenCalledWith({
    themeId: 'dracula',
    fontId: 'system',
  })
})

test('choosing a font reports the new font id and keeps the palette', () => {
  const onChange = jest.fn()
  render(<ThemePicker settings={settings} onChange={onChange} />)

  fireEvent.click(screen.getByRole('button', { name: /Serif/ }))

  expect(onChange).toHaveBeenCalledWith({
    themeId: 'bloom-light',
    fontId: 'serif',
  })
})

test('a custom accent can be set and reset back to the palette', () => {
  const onChange = jest.fn()
  render(
    <ThemePicker
      settings={{ ...settings, customAccent: '#abcdef' }}
      onChange={onChange}
    />,
  )

  fireEvent.change(screen.getByLabelText(/Accent colour/i), {
    target: { value: '#123456' },
  })
  expect(onChange).toHaveBeenCalledWith({
    themeId: 'bloom-light',
    fontId: 'system',
    customAccent: '#123456',
  })

  fireEvent.click(screen.getByRole('button', { name: /Reset to palette/i }))
  expect(onChange).toHaveBeenLastCalledWith({
    themeId: 'bloom-light',
    fontId: 'system',
  })
})

test('the swatches carry their own data-theme so previews read real tokens', () => {
  const { container } = render(
    <ThemePicker settings={settings} onChange={jest.fn()} />,
  )
  for (const theme of THEMES) {
    expect(container.querySelector(`[data-theme='${theme.id}']`)).not.toBeNull()
  }
})
