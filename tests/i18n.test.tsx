import { fireEvent, render, screen } from '@testing-library/react'
import i18n from '../src/i18n/i18n'
import App from '../src/App'
import en from '../src/i18n/locales/en.json'
import fr from '../src/i18n/locales/fr.json'

const flatten = (value: unknown, prefix = ''): string[] => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      flatten(v, `${prefix}${k}.`),
    )
  }
  return [prefix.replace(/\.$/, '')]
}

beforeEach(() => localStorage.clear())
afterEach(async () => {
  await i18n.changeLanguage('en')
})

test('every English key has a French counterpart and vice versa', () => {
  const enKeys = flatten(en).sort()
  const frKeys = flatten(fr).sort()
  expect(frKeys).toEqual(enKeys)
})

test('switching to French localizes the interface and the document language', async () => {
  await i18n.changeLanguage('fr')
  render(<App />)

  expect(document.documentElement.lang).toBe('fr')
  expect(
    screen.getByRole('button', { name: /Commencer un bilan/ }),
  ).toBeInTheDocument()
  expect(screen.getByText('Mon tableau de bord')).toBeInTheDocument()
  expect(screen.getByText('Petites habitudes, grand amour')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Comment jouer/ }),
  ).toBeInTheDocument()
})

test('default habits, prompts and chips follow the active language', async () => {
  await i18n.changeLanguage('fr')
  render(<App />)

  // The seeded default habits are generated in the active locale on first load.
  expect(
    screen.getByRole('button', { name: /Bouger avec intention/ }),
  ).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /Commencer un bilan/ }))

  expect(screen.getByText(/Prenons un souffle/)).toBeInTheDocument()
  expect(screen.getByText('Ancré')).toBeInTheDocument()
})