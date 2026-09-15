import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
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

const featureKeys = [
  'habitTracker',
  'chatJournal',
  'rpgSkillTree',
  'weeklyRaidBoss',
  'daybookModes',
  'languageSelector',
  'walkthroughTour',
] as const satisfies ReadonlyArray<keyof FeatureFlags>

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
  const { t } = useTranslation(undefined, { i18n })
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
        setImportError(t('settings.importShape'))
        return
      }
      setSettings(imported)
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(imported),
      )
      setImportError('')
    } catch {
      setImportError(t('settings.importInvalid'))
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
        <p className={styles.eyebrow}>{t('settings.eyebrow')}</p>
        <h1>{t('settings.title')}</h1>
        <p className={styles.intro}>{t('settings.intro')}</p>
      </header>

      <section className={styles.card} aria-labelledby="features-heading">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="features-heading">{t('settings.featuresHeading')}</h2>
            <p>{t('settings.featuresDescription')}</p>
          </div>
          <span className={styles.savedStatus} role="status">
            {t('settings.savedLocally')}
          </span>
        </div>

        <div className={styles.featureList}>
          {featureKeys.map((key) => {
            const title = t(`settings.feature.${key}.title`)
            return (
              <label className={styles.feature} key={key}>
                <span className={styles.featureCopy}>
                  <strong>{title}</strong>
                  <span>{t(`settings.feature.${key}.description`)}</span>
                </span>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={settings.features[key]}
                    onChange={() => handleToggleFeature(key)}
                    aria-label={t('settings.enableFeature', { title })}
                  />
                  <span className={styles.slider} aria-hidden="true" />
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="json-heading">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="json-heading">{t('settings.configurationHeading')}</h2>
            <p>{t('settings.configurationDescription')}</p>
          </div>
          <button
            className={styles.copyButton}
            type="button"
            onClick={handleCopy}
          >
            {copyState === 'copied' ? t('settings.copied') : t('settings.copyJson')}
          </button>
        </div>
        {copyState === 'failed' && (
          <p className={styles.error} role="alert">
            {t('settings.clipboardError')}
          </p>
        )}
        <pre className={styles.preview}>
          <code>{formattedSettings}</code>
        </pre>

        <label className={styles.importLabel} htmlFor="settings-import">
          {t('settings.importJson')}
          <span>{t('settings.importHint')}</span>
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