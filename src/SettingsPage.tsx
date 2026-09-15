import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import styles from './settings.module.css'

export interface FeatureFlags {
  habitTracker: boolean
  chatJournal: boolean
  rpgSkillTree: boolean
  weeklyRaidBoss: boolean
  daybookModes: boolean
  languageSelector: boolean
  walkthroughTour: boolean
}

export interface AppSettings {
  features: FeatureFlags
}

export const SETTINGS_STORAGE_KEY = 'mindfulness-dashboard-settings'

export const defaultSettings: AppSettings = {
  features: {
    habitTracker: true,
    chatJournal: true,
    rpgSkillTree: true,
    weeklyRaidBoss: false,
    daybookModes: true,
    languageSelector: true,
    walkthroughTour: false,
  },
}

const featureDetails: ReadonlyArray<{
  key: keyof FeatureFlags
  title: string
  description: string
}> = [
  {
    key: 'habitTracker',
    title: 'Habit tracker',
    description: 'Keep small promises to yourself and track your progress.',
  },
  {
    key: 'chatJournal',
    title: 'Chat journal',
    description: 'Reflect through a gentle, guided conversation.',
  },
  {
    key: 'rpgSkillTree',
    title: 'RPG skill tree',
    description: 'Turn your growth into visible skills and momentum.',
  },
  {
    key: 'weeklyRaidBoss',
    title: 'Weekly raid boss',
    description: 'Add a playful weekly challenge to your self-coaching.',
  },
  {
    key: 'daybookModes',
    title: 'Daybook modes',
    description: 'Choose a writing mode that fits the moment.',
  },
  {
    key: 'languageSelector',
    title: 'Language selector',
    description: 'Switch the app language from the dashboard.',
  },
  {
    key: 'walkthroughTour',
    title: 'Walkthrough tour',
    description: 'Show the guided introduction for new features.',
  },
]

function isFeatureFlags(value: unknown): value is FeatureFlags {
  if (typeof value !== 'object' || value === null) return false
  const flags = value as Record<string, unknown>
  return (
    Object.keys(defaultSettings.features) as Array<keyof FeatureFlags>
  ).every((key) => typeof flags[key] === 'boolean')
}

function parseSettings(value: unknown): AppSettings | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>
  return isFeatureFlags(candidate.features)
    ? { features: { ...candidate.features } }
    : null
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings

  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (!raw) return defaultSettings

  try {
    return parseSettings(JSON.parse(raw)) ?? defaultSettings
  } catch {
    return defaultSettings
  }
}

export function useAppSettings(): [
  AppSettings,
  Dispatch<SetStateAction<AppSettings>>,
] {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const persistSettings: Dispatch<SetStateAction<AppSettings>> = (update) => {
    setSettings((current) => {
      const resolved = typeof update === 'function' ? update(current) : update
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(resolved),
      )
      return resolved
    })
  }
  return [settings, persistSettings]
}

interface SettingsPageProps {
  settings: AppSettings
  setSettings: Dispatch<SetStateAction<AppSettings>>
}

export function SettingsPage({ settings, setSettings }: SettingsPageProps) {
  const [importValue, setImportValue] = useState('')
  const [importError, setImportError] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )

  const handleToggleFeature = (featureKey: keyof FeatureFlags) => {
    setSettings((current) => ({
      ...current,
      features: {
        ...current.features,
        [featureKey]: !current.features[featureKey],
      },
    }))
  }

  const handleImport = (value: string) => {
    setImportValue(value)
    if (!value.trim()) {
      setImportError('')
      return
    }

    try {
      const imported = parseSettings(JSON.parse(value))
      if (!imported) {
        setImportError(
          'Settings JSON must include a features object with boolean values for every feature.',
        )
        return
      }
      setSettings(imported)
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(imported),
      )
      setImportError('')
    } catch {
      setImportError('Enter valid JSON to import settings.')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const formattedSettings = JSON.stringify(settings, null, 2)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Personalize your space</p>
        <h1>Settings</h1>
        <p className={styles.intro}>
          Choose the tools that support your self-coaching practice. Changes are
          saved automatically.
        </p>
      </header>

      <section className={styles.card} aria-labelledby="features-heading">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="features-heading">Features</h2>
            <p>Turn parts of bloom on or off whenever you need.</p>
          </div>
          <span className={styles.savedStatus} role="status">
            Saved locally
          </span>
        </div>

        <div className={styles.featureList}>
          {featureDetails.map(({ key, title, description }) => (
            <label className={styles.feature} key={key}>
              <span className={styles.featureCopy}>
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <span className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.features[key]}
                  onChange={() => handleToggleFeature(key)}
                  aria-label={`Enable ${title}`}
                />
                <span className={styles.slider} aria-hidden="true" />
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="json-heading">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="json-heading">Configuration</h2>
            <p>Your current settings are shown as formatted JSON.</p>
          </div>
          <button
            className={styles.copyButton}
            type="button"
            onClick={handleCopy}
          >
            {copyState === 'copied' ? 'Copied' : 'Copy JSON to Clipboard'}
          </button>
        </div>
        {copyState === 'failed' && (
          <p className={styles.error} role="alert">
            Clipboard access is unavailable. Copy the JSON manually instead.
          </p>
        )}
        <pre className={styles.preview}>
          <code>{formattedSettings}</code>
        </pre>

        <label className={styles.importLabel} htmlFor="settings-import">
          Import JSON
          <span>Paste a complete settings object to apply it immediately.</span>
        </label>
        <textarea
          id="settings-import"
          className={styles.importInput}
          value={importValue}
          onChange={(event) => handleImport(event.target.value)}
          placeholder={formattedSettings}
          rows={8}
          aria-describedby={importError ? 'settings-import-error' : undefined}
        />
        {importError && (
          <p className={styles.error} id="settings-import-error" role="alert">
            {importError}
          </p>
        )}
      </section>
    </div>
  )
}

export default SettingsPage
