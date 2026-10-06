import { textOnColor } from '../src/utils/textContrast'

test('bright studio colors use dark text and dark colors use white', () => {
  expect(textOnColor('#f7df1e')).toBe('#000000')
  expect(textOnColor('#b58863')).toBe('#000000')
  expect(textOnColor('#000')).toBe('#ffffff')
  expect(textOnColor('#fff')).toBe('#000000')
})

test('non-hex colors defer to the theme text token', () => {
  expect(textOnColor('var(--accent-color)')).toBe('var(--text-on-accent)')
})
