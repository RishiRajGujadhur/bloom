import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import i18n, { resources } from '../src/i18n'
import { renderApp } from './helpers/renderApp'
import { SettingsPage, defaultSettings } from '../src/SettingsPage'
import { showAll } from './helpers/showAll'
import { getStoredTheme } from '../src/utils/themeEngine'

function SettingsHarness() {
  const [settings, setSettings] = useState(defaultSettings)
  const [theme, setTheme] = useState(getStoredTheme)
  return (
    <SettingsPage
      settings={settings}
      setSettings={setSettings}
      theme={theme}
      setTheme={setTheme}
    />
  )
}

const flatten = (value: unknown, prefix = ''): string[] => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, child]) => flatten(child, `${prefix}${key}.`),
    )
  }
  return [prefix.replace(/\.$/, '')]
}

const en = (resources.en as { translation: unknown }).translation
const fr = (resources.fr as { translation: unknown }).translation
const enKeys = new Set(flatten(en))
const frKeys = new Set(flatten(fr))

/** i18next plural keys are stored as `<key>_one` / `<key>_other`. */
const hasKey = (keys: Set<string>, key: string) =>
  keys.has(key) || keys.has(`${key}_one`) || keys.has(`${key}_other`)

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx)$/.test(entry.name) && entry.name !== 'i18n.ts'
      ? [full]
      : []
  })

const usedKeys = () => {
  const keys = new Set<string>()
  for (const file of sourceFiles(path.join(process.cwd(), 'src'))) {
    const body = fs.readFileSync(file, 'utf8')
    for (const match of body.matchAll(/\bt\(\s*'([^']+)'/g)) keys.add(match[1])
    for (const match of body.matchAll(/\bt\(\s*`([^`$]+)`/g)) keys.add(match[1])
  }
  return [...keys]
}

beforeEach(() => localStorage.clear())
afterEach(async () => {
  await i18n.changeLanguage('en')
})

test('English and French expose the same translation keys', async () => {
  expect(flatten(fr).sort()).toEqual([...enKeys].sort())
})

test('every literal translation key used in the source exists in English and French', async () => {
  const keys = usedKeys()
  expect(keys.length).toBeGreaterThan(150)
  expect(keys.filter((key) => !hasKey(enKeys, key))).toEqual([])
  expect(keys.filter((key) => !hasKey(frKeys, key))).toEqual([])
})

test('English remains the default language', async () => {
  await renderApp()
  expect(document.documentElement.lang).toBe('en')
  expect(screen.getByRole('heading', { name: 'A little intention. A lot of good ahead.' })).toBeInTheDocument()
  expect(screen.getAllByText(/Move with intention/).length).toBeGreaterThan(0)
})

test('switching to French localizes the dashboard, RPG, gamification and daybook', async () => {
  await i18n.changeLanguage('fr')
  await renderApp()

  expect(document.documentElement.lang).toBe('fr')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Growth' })) })
  expect(
    screen.getAllByRole('button', { name: /Comment jouer/ }).length,
  ).toBeGreaterThan(0)
  expect(screen.getAllByText('La Pousse').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Vitalité').length).toBeGreaterThan(0)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Advanced', exact: true })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Skill tree' })) })
  expect(screen.getAllByText(/CHEMIN DE PRATIQUE/).length).toBeGreaterThan(0)
  expect(
    screen.getAllByText('Votre arbre de compétences').length,
  ).toBeGreaterThan(0)
  await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: /Modes de carnet/ })[0]) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plan', exact: true })) })
  expect(
    screen.getAllByText('Intention du matin (la seule chose)').length,
  ).toBeGreaterThan(0)
})

test('French journal prompts and chips come from the French resources', async () => {
  await i18n.changeLanguage('fr')
  await renderApp()

  await act(async () => { fireEvent.click(
    screen.getAllByRole('button', { name: /Journal de réflexion/ })[0],
  ) })
  await act(async () => {
    await act(async () => { fireEvent.click(
      screen.getAllByRole('button', { name: /Commencer un bilan/ })[0],
    ) })
  })

  expect(screen.getAllByText(/Prenons un souffle/).length).toBeGreaterThan(0)
  expect(screen.getAllByText('Ancré').length).toBeGreaterThan(0)
})

test('pirate and slang English stay usable on the shared English sections', async () => {
  await i18n.changeLanguage('en-pirate')
  await renderApp()
  expect(
    screen.getAllByText(/Main deck|Yer Stats|A wee bit better/).length,
  ).toBeGreaterThan(0)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Growth' })) })
  expect(screen.getByRole('button', { name: /How to play/ })).toBeInTheDocument()
})
test('French settings page renders translated feature copy', async () => {
  await i18n.changeLanguage('fr')
  render(<SettingsHarness />)
  showAll()

  expect(screen.getByText('Apparence')).toBeInTheDocument()
  expect(screen.getByText('Fonctionnalités')).toBeInTheDocument()
  expect(screen.getByText('Suivi des habitudes')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Copier le JSON/ }),
  ).toBeInTheDocument()
  expect(screen.getByText('Importer du JSON')).toBeInTheDocument()
  expect(screen.getByText('Enregistré localement')).toBeInTheDocument()
})
