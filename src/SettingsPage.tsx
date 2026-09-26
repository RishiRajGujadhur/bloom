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
import { applyPreset, categories, featureCategory, matchPreset, presets } from './settings/featureCatalog'
import { Sprout as SproutCore } from 'lucide-react'
import { BicepsFlexed as BicepsFlexedF_workoutLog } from 'lucide-react'
import { Dumbbell as DumbbellF_exerciseGuides } from 'lucide-react'
import { Swords as SwordsRound11, Leaf as LeafRound11, ChefHat as ChefHatRound11, Waves as WavesRound11, Mountain as MountainRound11 } from 'lucide-react'
import { Apple as AppleIcon, Feather as FeatherIcon, Zap as ZapIcon, Mic as MicIcon, FlaskConical as FlaskConicalIcon, ScanSearch as ScanSearchIcon, SquareTerminal as SquareTerminalIcon } from 'lucide-react'
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
  dietTracker: AppleIcon,
  monkMode: FeatherIcon,
  energySankey: ZapIcon,
  voiceMemos: MicIcon,
  insightsLab: FlaskConicalIcon,
  smartSearch: ScanSearchIcon,
  omnibox: SquareTerminalIcon,
  pixelJuice: SwordsRound11,
  microNutrients: LeafRound11,
  recipeBuilder: ChefHatRound11,
  breathSilk: WavesRound11,
  wuXing: MountainRound11,
  bloomCore: SproutCore,
  workoutLog: BicepsFlexedF_workoutLog,
  exerciseGuides: DumbbellF_exerciseGuides,
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
  dietTracker: boolean
  monkMode: boolean
  energySankey: boolean
  voiceMemos: boolean
  insightsLab: boolean
  smartSearch: boolean
  omnibox: boolean
  pixelJuice: boolean
  microNutrients: boolean
  recipeBuilder: boolean
  breathSilk: boolean
  wuXing: boolean
  bloomCore: boolean
  workoutLog: boolean
  exerciseGuides: boolean
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
    dietTracker: true,
    monkMode: true,
    energySankey: true,
    voiceMemos: true,
    insightsLab: true,
    smartSearch: true,
    omnibox: true,
    pixelJuice: true,
    microNutrients: true,
    recipeBuilder: true,
    breathSilk: true,
    wuXing: true,
    bloomCore: true,
    workoutLog: true,
    exerciseGuides: true,
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

export const featureKeys = [
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
  'dietTracker',
  'monkMode',
  'energySankey',
  'voiceMemos',
  'insightsLab',
  'smartSearch',
  'omnibox',
  'pixelJuice',
  'microNutrients',
  'recipeBuilder',
  'breathSilk',
  'wuXing',
  'bloomCore',
  'workoutLog',
  'exerciseGuides',
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
  const [query, setQuery] = useState('')
  const current = matchPreset(settings.features, featureKeys, defaultSettings.features)
  const titleOf = (key: (typeof featureKeys)[number]) =>
    key === 'dailySpin'
      ? 'Daily 7-7-7 Spin'
      : key === 'collectibles'
        ? 'My Collectibles'
        : key === 'fullCalendar'
          ? 'Full calendar'
          : t(`settings.feature.${key}.title`)
  const setMany = (keys: readonly (typeof featureKeys)[number][], on: boolean) =>
    setSettings((c) => ({ ...c, features: { ...c.features, ...Object.fromEntries(keys.map((k) => [k, on])) } }))

  return (
    <div
      className={`${styles.page} mx-auto flex w-full max-w-5xl flex-col gap-5`}
    >

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
        <div className={styles.presetBar}>
          <label className={styles.presetPick}>
            <span>Configuration</span>
            <select
              value={current?.id ?? 'custom'}
              onChange={(event) => {
                const preset = presets.find((p) => p.id === event.target.value)
                if (preset) setSettings((c) => ({ ...c, features: { ...c.features, ...applyPreset(preset, featureKeys, defaultSettings.features) } }))
              }}
              aria-label="Feature configuration"
            >
              {!current && <option value="custom">Custom</option>}
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <small>{current ? current.description : 'Your own mix of features.'}</small>
          </label>
          <input
            className={styles.featureSearch}
            type="search"
            placeholder="Find a feature…"
            aria-label="Find a feature"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {categories.map((category) => {
          const keys = featureKeys.filter(
            (key) => featureCategory[key] === category.id && (!query.trim() || titleOf(key).toLowerCase().includes(query.trim().toLowerCase())),
          )
          if (!keys.length) return null
          const onCount = keys.filter((k) => settings.features[k]).length
          return (
            <section key={category.id} className={styles.category} aria-label={category.label}>
              <header className={styles.categoryHead}>
                <h3>
                  <span aria-hidden="true">{category.emoji}</span> {category.label}
                  <small>
                    {onCount}/{keys.length} on
                  </small>
                </h3>
                <span className={styles.categoryActions}>
                  <button type="button" onClick={() => setMany(keys, true)} disabled={onCount === keys.length}>
                    All on
                  </button>
                  <button type="button" onClick={() => setMany(keys, false)} disabled={onCount === 0}>
                    All off
                  </button>
                </span>
              </header>
              <div className={styles.featureRail}>
          {keys.map((key) => {
            const title = titleOf(key)
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
          )
        })}
      </section>

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
