import { Disclosure } from './components/BloomExperience'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { ThemePicker } from './components/settings/ThemePicker'
import type { ThemeSettings } from './utils/themeEngine'
import styles from './settings.module.css'
import { SETTINGS_STORAGE_KEY } from './settingsKey'
import { subFeatures } from './features/subFeatures'
import {
  CalendarDays,
  CarFront,
  Castle,
  PenTool,
  Hammer,
  Lightbulb,
  Workflow,
  Mountain,
  PersonStanding,
  Timer,
  Armchair,
  BookMarked,
  Boxes,
  CircleDot,
  Filter,
  Flame,
  GitCompare,
  Hourglass,
  MapPinned,
  PartyPopper,
  Route,
  Sparkles,
  Warehouse,
  BellRing,
  Moon,
  ShoppingBag,
  TrendingUp,
  Dices,
  Gauge,
  Heart,
  Languages,
  LayoutGrid,
  ListChecks,
  Map,
  MessageCircle,
  NotebookPen,
  Palette,
  Rows3,
  ShieldCheck,
  Smile,
  Sprout,
  Swords,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const featureIcons: Record<keyof FeatureFlags, LucideIcon> = {
  dailySpin: Dices,
  collectibles: CarFront,
  fullCalendar: CalendarDays,
  visionBoard: Map,
  bloomWorld: Castle,
  breathe: Wind,
  moodCheckin: Smile,
  gratitude: Heart,
  compactMode: Rows3,
  sleepTracker: Moon,
  petalShop: ShoppingBag,
  reminders: BellRing,
  adaptiveGoals: TrendingUp,
  celebrations: PartyPopper,
  burnRelease: Flame,
  garage: Warehouse,
  urgeClock: Hourglass,
  focusRoom: Armchair,
  timeCapsule: Hourglass,
  thoughtDiff: GitCompare,
  queryBuilder: Filter,
  yearbook: BookMarked,
  memoryPalace: Boxes,
  skillConstellation: Sparkles,
  streakJourney: Route,
  moodOrb: CircleDot,
  placesMap: MapPinned,
  timeSince: Timer,
  drawnAchievements: PenTool,
  flowTopography: Mountain,
  postureGuard: PersonStanding,
  impactTasks: Hammer,
  epiphanies: Lightbulb,
  dailyFlow: Workflow,
  urgeTracker: ShieldCheck,
  habitTracker: ListChecks,
  chatJournal: MessageCircle,
  rpgSkillTree: Sprout,
  weeklyRaidBoss: Swords,
  daybookModes: NotebookPen,
  languageSelector: Languages,
  walkthroughTour: Gauge,
}

export interface FeatureFlags {
  dailySpin: boolean
  collectibles: boolean
  fullCalendar: boolean
  visionBoard: boolean
  bloomWorld: boolean
  breathe: boolean
  moodCheckin: boolean
  gratitude: boolean
  compactMode: boolean
  sleepTracker: boolean
  petalShop: boolean
  reminders: boolean
  adaptiveGoals: boolean
  celebrations: boolean
  burnRelease: boolean
  garage: boolean
  urgeClock: boolean
  focusRoom: boolean
  timeCapsule: boolean
  thoughtDiff: boolean
  queryBuilder: boolean
  yearbook: boolean
  memoryPalace: boolean
  skillConstellation: boolean
  streakJourney: boolean
  moodOrb: boolean
  placesMap: boolean
  timeSince: boolean
  drawnAchievements: boolean
  flowTopography: boolean
  postureGuard: boolean
  impactTasks: boolean
  epiphanies: boolean
  dailyFlow: boolean
  urgeTracker: boolean
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
  /** Sub-feature switches, keyed "feature.option"; missing means on. */
  sub?: Record<string, boolean>
}

export { SETTINGS_STORAGE_KEY }

export const defaultSettings: AppSettings = {
  features: {
    dailySpin: false,
    collectibles: false,
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
    urgeTracker: true,
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
  'dailySpin',
  'collectibles',
  'fullCalendar',
  'visionBoard',
  'bloomWorld',
  'breathe',
  'moodCheckin',
  'gratitude',
  'compactMode',
  'sleepTracker',
  'petalShop',
  'reminders',
  'adaptiveGoals',
  'celebrations',
  'burnRelease',
  'garage',
  'urgeClock',
  'focusRoom',
  'timeCapsule',
  'thoughtDiff',
  'queryBuilder',
  'yearbook',
  'memoryPalace',
  'skillConstellation',
  'streakJourney',
  'moodOrb',
  'placesMap',
  'timeSince',
  'drawnAchievements',
  'flowTopography',
  'postureGuard',
  'impactTasks',
  'epiphanies',
  'dailyFlow',
  'urgeTracker',
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
  const features = candidate.features
  if (typeof features !== 'object' || features === null) return null
  // New flags use their defaults without changing choices stored by older saves.
  const migrated = { ...defaultSettings.features, ...features }
  const sub =
    candidate.sub && typeof candidate.sub === 'object'
      ? Object.fromEntries(
          Object.entries(candidate.sub as Record<string, unknown>).filter(
            ([, v]) => typeof v === 'boolean',
          ),
        )
      : {}
  return isFeatureFlags(migrated)
    ? { features: { ...migrated }, sub: sub as Record<string, boolean> }
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
  /** Palette + font live outside AppSettings so the engine can own the DOM. */
  theme: ThemeSettings
  setTheme: Dispatch<SetStateAction<ThemeSettings>>
}

export function SettingsPage({
  settings,
  setSettings,
  theme,
  setTheme,
}: SettingsPageProps) {
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
    <div
      className={`${styles.page} mx-auto flex w-full max-w-5xl flex-col gap-5`}
    >
      <section
        className={styles.card}
        aria-labelledby="appearance-heading"
      >
        <h2 id="appearance-heading" className={styles.sectionTitle}>
          <Palette size={18} aria-hidden="true" />
          {t('settings.appearanceHeading')}
        </h2>
        <ThemePicker settings={theme} onChange={setTheme} />
      </section>

      <section className={styles.card} aria-labelledby="features-heading">
        <div className={styles.cardHeader}>
          <h2 id="features-heading" className={styles.sectionTitle}>
            <LayoutGrid size={18} aria-hidden="true" />
            {t('settings.featuresHeading')}
          </h2>
          <span className={styles.savedStatus} role="status">
            {t('settings.savedLocally')}
          </span>
        </div>
        <div className={styles.featureGrid}>
          {featureKeys.map((key) => {
            const title =
              key === 'dailySpin'
                ? 'Daily 7-7-7 Spin'
                : key === 'collectibles'
                  ? 'My Collectibles'
                  : key === 'fullCalendar'
                    ? 'Full calendar'
                    : t(`settings.feature.${key}.title`)
            const Icon = featureIcons[key]
            const options = subFeatures[key]
            return (
              <div className={styles.featureCard} key={key} data-on={settings.features[key]}>
              <label
                className={styles.feature}
                data-on={settings.features[key]}
              >
                <span className={styles.featureIcon} aria-hidden="true">
                  <Icon size={19} />
                </span>
                <span className={styles.featureCopy}>
                  <strong>{title}</strong>
                  <span>
                    {key === 'dailySpin'
                      ? 'A free daily spin for pixel cars.'
                      : key === 'collectibles'
                        ? 'Your car collection.'
                        : key === 'fullCalendar'
                          ? 'Time blocking and capacity.'
                          : t(`settings.feature.${key}.description`)}
                  </span>
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
              {options.length > 0 && (
                <details className={styles.subOptions}>
                  <summary>
                    {options.length} options
                  </summary>
                  <ul>
                    {options.map((option) => {
                      const id = `${key}.${option.id}`
                      const on = settings.sub?.[id] !== false
                      return (
                        <li key={option.id}>
                          <label className={styles.subOption}>
                            <span>
                              <strong>{option.title}</strong>
                              <small>{option.description}</small>
                            </span>
                            <span className={styles.switch} data-size="small">
                              <input
                                type="checkbox"
                                checked={on && settings.features[key]}
                                disabled={!settings.features[key]}
                                onChange={() =>
                                  setSettings((current) => ({
                                    ...current,
                                    sub: { ...current.sub, [id]: !on },
                                  }))
                                }
                                aria-label={`${option.title} (${title})`}
                              />
                              <span className={styles.slider} aria-hidden="true" />
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </details>
              )}
              </div>
            )
          })}
        </div>
      </section>

      <Disclosure title={t('settings.configurationHeading')}>
        <section
          className={`${styles.card} rounded-ui-lg border border-ui-border bg-surface p-4 sm:p-6`}
          aria-labelledby="json-heading"
        >
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
              {copyState === 'copied'
                ? t('settings.copied')
                : t('settings.copyJson')}
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
      </Disclosure>
    </div>
  )
}

export default SettingsPage
