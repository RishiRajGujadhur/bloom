import { Disclosure } from './components/BloomExperience'
import { ComfortCard, SettingsSearch } from './components/settings/ComfortCard'
import { useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { ThemePicker } from './components/settings/ThemePicker'
import type { ThemeSettings } from './utils/themeEngine'
import styles from './settings.module.css'
import { SETTINGS_STORAGE_KEY } from './settingsKey'
import { pageOptions, subFeatures, type SubFeature } from './features/subFeatures'
import { applyPreset, categories, featureCategory, matchPreset, presets } from './settings/featureCatalog'
import { Sprout as SproutCore } from 'lucide-react'
import { Gamepad2 as Gamepad2F_arcade } from 'lucide-react'
import { Building2 as Building2F_codeCity } from 'lucide-react'
import { Radio as RadioF_morningBriefing } from 'lucide-react'
import { Activity as ActivityF_readinessScan } from 'lucide-react'
import { Users as UsersF_peopleGarden } from 'lucide-react'
import { Scale as ScaleF_decisionLab } from 'lucide-react'
import { ScanText as ScanTextF_speedReader } from 'lucide-react'
import { HeartPulse as HeartPulseF_cprCoach } from 'lucide-react'
import { Globe as GlobeF_globeQuiz } from 'lucide-react'
import { Hand as HandF_signAlphabet } from 'lucide-react'
import { AudioLines as AudioLinesF_tuner } from 'lucide-react'
import { Piano as PianoF_pianoTrainer } from 'lucide-react'
import { Keyboard as KeyboardF_typingDojo } from 'lucide-react'
import { Telescope as TelescopeF_nightSky } from 'lucide-react'
import { Grid3x3 as Grid3x3F_lifeInWeeks } from 'lucide-react'
import { Crown as CrownF_chessAcademy } from 'lucide-react'
import { Code2 as Code2F_codeLearning } from 'lucide-react'
import { Gift as GiftF_littleJoys } from 'lucide-react'
import { Languages as LanguagesF_englishLearning } from 'lucide-react'
import { Wallet as WalletF_moneyTracker } from 'lucide-react'
import { Store as StoreF_bloomStreet } from 'lucide-react'
import { MousePointer2 as MousePointer2F_pointerFx } from 'lucide-react'
import { Swords as SwordsF_dojo } from 'lucide-react'
import { Sparkles as SparklesF_affirmations } from 'lucide-react'
import { Sunrise as SunriseF_daylight } from 'lucide-react'
import { Eye as EyeF_eyeCare } from 'lucide-react'
import { MonitorSmartphone as MonitorSmartphoneF_digitalWellbeing } from 'lucide-react'
import { Repeat as RepeatF_routineScheduler } from 'lucide-react'
import { CalendarRange as CalendarRangeF_goalRoadmap } from 'lucide-react'
import { Gamepad2 as Gamepad2F_brainGames } from 'lucide-react'
import { Layers as LayersF_flashcards } from 'lucide-react'
import { Network as NetworkF_mindMaps } from 'lucide-react'
import { ScanFace as ScanFaceF_moodMirror } from 'lucide-react'
import { PenLine as PenLineF_inkJournal } from 'lucide-react'
import { CircleDot as CircleDotF_mala } from 'lucide-react'
import { Wind as WindF_breathwork } from 'lucide-react'
import { Sparkles as SparklesF_meditation } from 'lucide-react'
import { CloudRain as CloudRainF_soundMixer } from 'lucide-react'
import { AudioLines as AudioLinesF_focusSounds } from 'lucide-react'
import { Hourglass as HourglassF_fasting } from 'lucide-react'
import { ScanBarcode as ScanBarcodeF_foodScanner } from 'lucide-react'
import { Ruler as RulerF_bodyProgress } from 'lucide-react'
import { Footprints as FootprintsF_runTracker } from 'lucide-react'
import { PersonStanding as PersonStandingF_mobility } from 'lucide-react'
import { Flower2 as Flower2F_yogaFlow } from 'lucide-react'
import { TimerReset as TimerResetF_intervalCoach } from 'lucide-react'
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
import { Menu } from 'lucide-react'
import { pixelIconsOn, setPixelIcons } from './icons/pixelated'
import { hamburgerNav, setHamburgerNav } from './components/layout/Sidebar'
import { DISPLAY_TOGGLES, ShowMore, applyCustomCss, applyDisplayToggles, compactTitles, followSystemTheme, pageBanner, setCompactTitles, setFollowSystemTheme, setPageBanner } from './components/ui/Flow'
import { AvatarPicker } from './components/ui/AvatarPicker'
import { DataReset } from './settings/DataReset'
import { StorageMeter } from './settings/StorageMeter'
import { InstallApp } from './settings/InstallApp'
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
  arcade: Gamepad2F_arcade,
  codeCity: Building2F_codeCity,
  morningBriefing: RadioF_morningBriefing,
  readinessScan: ActivityF_readinessScan,
  peopleGarden: UsersF_peopleGarden,
  decisionLab: ScaleF_decisionLab,
  speedReader: ScanTextF_speedReader,
  cprCoach: HeartPulseF_cprCoach,
  globeQuiz: GlobeF_globeQuiz,
  signAlphabet: HandF_signAlphabet,
  tuner: AudioLinesF_tuner,
  pianoTrainer: PianoF_pianoTrainer,
  typingDojo: KeyboardF_typingDojo,
  nightSky: TelescopeF_nightSky,
  lifeInWeeks: Grid3x3F_lifeInWeeks,
  chessAcademy: CrownF_chessAcademy,
  codeLearning: Code2F_codeLearning,
  littleJoys: GiftF_littleJoys,
  englishLearning: LanguagesF_englishLearning,
  moneyTracker: WalletF_moneyTracker,
  bloomStreet: StoreF_bloomStreet,
  pointerFx: MousePointer2F_pointerFx,
  dojo: SwordsF_dojo,
  affirmations: SparklesF_affirmations,
  daylight: SunriseF_daylight,
  eyeCare: EyeF_eyeCare,
  digitalWellbeing: MonitorSmartphoneF_digitalWellbeing,
  routineScheduler: RepeatF_routineScheduler,
  goalRoadmap: CalendarRangeF_goalRoadmap,
  brainGames: Gamepad2F_brainGames,
  flashcards: LayersF_flashcards,
  mindMaps: NetworkF_mindMaps,
  moodMirror: ScanFaceF_moodMirror,
  inkJournal: PenLineF_inkJournal,
  mala: CircleDotF_mala,
  breathwork: WindF_breathwork,
  meditation: SparklesF_meditation,
  soundMixer: CloudRainF_soundMixer,
  focusSounds: AudioLinesF_focusSounds,
  fasting: HourglassF_fasting,
  foodScanner: ScanBarcodeF_foodScanner,
  bodyProgress: RulerF_bodyProgress,
  runTracker: FootprintsF_runTracker,
  mobility: PersonStandingF_mobility,
  yogaFlow: Flower2F_yogaFlow,
  intervalCoach: TimerResetF_intervalCoach,
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
  arcade: boolean
  codeCity: boolean
  morningBriefing: boolean
  readinessScan: boolean
  peopleGarden: boolean
  decisionLab: boolean
  speedReader: boolean
  cprCoach: boolean
  globeQuiz: boolean
  signAlphabet: boolean
  tuner: boolean
  pianoTrainer: boolean
  typingDojo: boolean
  nightSky: boolean
  lifeInWeeks: boolean
  chessAcademy: boolean
  codeLearning: boolean
  littleJoys: boolean
  englishLearning: boolean
  moneyTracker: boolean
  bloomStreet: boolean
  pointerFx: boolean
  dojo: boolean
  affirmations: boolean
  daylight: boolean
  eyeCare: boolean
  digitalWellbeing: boolean
  routineScheduler: boolean
  goalRoadmap: boolean
  brainGames: boolean
  flashcards: boolean
  mindMaps: boolean
  moodMirror: boolean
  inkJournal: boolean
  mala: boolean
  breathwork: boolean
  meditation: boolean
  soundMixer: boolean
  focusSounds: boolean
  fasting: boolean
  foodScanner: boolean
  bodyProgress: boolean
  runTracker: boolean
  mobility: boolean
  yogaFlow: boolean
  intervalCoach: boolean
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
  reducedMotion?: boolean
  /** Sub-feature switches, keyed "feature.option"; missing means on. */
  sub?: Record<string, boolean>
}

export { SETTINGS_STORAGE_KEY }

export const defaultSettings: AppSettings = {
  reducedMotion: false,
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
    arcade: true,
    codeCity: true,
    morningBriefing: true,
    readinessScan: true,
    peopleGarden: true,
    decisionLab: true,
    speedReader: true,
    cprCoach: true,
    globeQuiz: true,
    signAlphabet: true,
    tuner: true,
    pianoTrainer: true,
    typingDojo: true,
    nightSky: true,
    lifeInWeeks: true,
    chessAcademy: true,
    codeLearning: true,
    littleJoys: true,
    englishLearning: true,
    moneyTracker: true,
    bloomStreet: true,
    pointerFx: true,
    dojo: true,
    affirmations: true,
    daylight: true,
    eyeCare: true,
    digitalWellbeing: true,
    routineScheduler: true,
    goalRoadmap: true,
    brainGames: true,
    flashcards: true,
    mindMaps: true,
    moodMirror: true,
    inkJournal: true,
    mala: true,
    breathwork: true,
    meditation: true,
    soundMixer: true,
    focusSounds: true,
    fasting: true,
    foodScanner: true,
    bodyProgress: true,
    runTracker: true,
    mobility: true,
    yogaFlow: true,
    intervalCoach: true,
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
  'arcade',
  'codeCity',
  'morningBriefing',
  'readinessScan',
  'peopleGarden',
  'decisionLab',
  'speedReader',
  'cprCoach',
  'globeQuiz',
  'signAlphabet',
  'tuner',
  'pianoTrainer',
  'typingDojo',
  'nightSky',
  'lifeInWeeks',
  'chessAcademy',
  'codeLearning',
  'littleJoys',
  'englishLearning',
  'moneyTracker',
  'bloomStreet',
  'pointerFx',
  'dojo',
  'affirmations',
  'daylight',
  'eyeCare',
  'digitalWellbeing',
  'routineScheduler',
  'goalRoadmap',
  'brainGames',
  'flashcards',
  'mindMaps',
  'moodMirror',
  'inkJournal',
  'mala',
  'breathwork',
  'meditation',
  'soundMixer',
  'focusSounds',
  'fasting',
  'foodScanner',
  'bodyProgress',
  'runTracker',
  'mobility',
  'yogaFlow',
  'intervalCoach',
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
    ? { features: { ...migrated }, sub: sub as Record<string, boolean>, reducedMotion: candidate.reducedMotion === true }
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
  /** Recently deleted items with restore (rendered by the app, which owns the data). */
  trash?: React.ReactNode
}

const matches = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase())

/**
 * One consistent options list for every feature and page: the same switch,
 * the same bulk actions, and options that keep working when the feature is off
 * are labelled instead of greyed out.
 */
/** Preference keys included in a settings file (never user data). */
const PREF_KEYS = [
  SETTINGS_STORAGE_KEY,
  'mindfulness-dashboard-theme-settings',
  'bloom-compact-titles',
  'bloom-page-banner',
  'bloom-follow-system-theme',
  'bloom-nav-dense',
  'bloom-high-contrast',
  'bloom-nav-hamburger',
  'bloom-name',
  'bloom-sidebar-width',
  'bloom-companion-width',
  'bloom-theme-schedule',
]

/** Navigation style and a way back into onboarding. */
function NavigationCard({ reducedMotion, setReducedMotion }: { reducedMotion: boolean; setReducedMotion: (enabled: boolean) => void }) {
  const [hamburger, setHamburger] = useState(hamburgerNav)
  const [compact, setCompact] = useState(compactTitles)
  const [banner, setBanner] = useState(pageBanner)
  const [followSys, setFollowSys] = useState(followSystemTheme)
  const [dense, setDense] = useState(() => localStorage.getItem('bloom-nav-dense') === '1')
  const [contrast, setContrast] = useState(() => localStorage.getItem('bloom-high-contrast') === '1')
  const [pixel, setPixel] = useState(pixelIconsOn)
  return (
    <section className={styles.card} aria-labelledby="navigation-heading">
      <h2 id="navigation-heading" className={styles.sectionTitle}>
        <Menu size={18} aria-hidden="true" />
        Navigation & setup
      </h2>
      <label className={styles.subOption}>
        <span>
          <strong>Reduce motion</strong>
          <small>Use fewer animations throughout Bloom. This also helps slower phones and computers.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} aria-label="Reduce motion" />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Hamburger menu</strong>
          <small>Keep the sidebar tucked behind a menu button on every screen size, like on phones. Off shows the side column.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            checked={hamburger}
            onChange={(e) => {
              setHamburger(e.target.checked)
              setHamburgerNav(e.target.checked)
            }}
            aria-label="Hamburger menu"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Icon page headings</strong>
          <small>Use each page’s illustrated icon as its heading. Hover or focus it to see the page name.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            checked={compact}
            onChange={(e) => {
              setCompact(e.target.checked)
              setCompactTitles(e.target.checked)
            }}
            aria-label="Icon page headings"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      {DISPLAY_TOGGLES.map((t) => (
        <label key={t.key} className={styles.subOption}>
          <span>
            <strong>{t.label}</strong>
            <small>{t.hint}</small>
          </span>
          <span className={styles.switch} data-size="small">
            <input
              type="checkbox"
              defaultChecked={document.documentElement.hasAttribute(t.attr)}
              onChange={(e) => {
                try {
                  localStorage.setItem(t.key, e.target.checked ? '1' : '0')
                } catch {
                  /* optional */
                }
                applyDisplayToggles()
              }}
              aria-label={t.label}
            />
            <span className={styles.slider} aria-hidden="true" />
          </span>
        </label>
      ))}
      <details className={styles.subOption}>
        <summary>
          <strong>Custom CSS (advanced)</strong>
        </summary>
        <textarea
          className="settings-css"
          rows={5}
          spellCheck={false}
          placeholder={'/* e.g. */\n.bloom-heading { border-radius: 4px; }'}
          aria-label="Custom CSS"
          defaultValue={(() => {
            try {
              return localStorage.getItem('bloom-custom-css') ?? ''
            } catch {
              return ''
            }
          })()}
          onBlur={(e) => {
            try {
              localStorage.setItem('bloom-custom-css', e.currentTarget.value)
            } catch {
              /* optional */
            }
            applyCustomCss()
          }}
        />
      </details>
      <div className={styles.subOption}>
        <span>
          <strong>Settings file</strong>
          <small>Save your settings (features, theme, layout) to a file, or load them on another device. Your data isn’t included.</small>
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="quiet-button"
            onClick={() => {
              const out: Record<string, string> = {}
              for (const k of PREF_KEYS) {
                const v = localStorage.getItem(k)
                if (v !== null) out[k] = v
              }
              const a = document.createElement('a')
              a.href = URL.createObjectURL(new Blob([JSON.stringify({ bloomSettings: 1, prefs: out }, null, 2)], { type: 'application/json' }))
              a.download = 'bloom-settings.json'
              a.click()
              setTimeout(() => URL.revokeObjectURL(a.href), 1000)
            }}
          >
            Export
          </button>
          <label className="quiet-button">
            Import
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                try {
                  const parsed = JSON.parse(await file.text()) as { bloomSettings?: number; prefs?: Record<string, unknown> }
                  if (parsed.bloomSettings !== 1 || !parsed.prefs) throw new Error('not a settings file')
                  for (const [k, v] of Object.entries(parsed.prefs)) if (PREF_KEYS.includes(k) && typeof v === 'string') localStorage.setItem(k, v)
                  location.reload()
                } catch {
                  window.alert('That file isn’t a Bloom settings file.')
                }
              }}
            />
          </label>
        </span>
      </div>
      <div className={styles.subOption}>
        <span>
          <strong>Reset layout</strong>
          <small>Sidebar width, Bloom panel width, collapsed sections and recent pages go back to the defaults.</small>
        </span>
        <button
          type="button"
          className="quiet-button"
          onClick={() => {
            for (const k of ['bloom-sidebar-width', 'bloom-companion-width', 'bloom-nav-groups', 'bloom-nav-recent', 'bloom-guide-docked', 'bloom-companion-hidden-pages'])
              try {
                localStorage.removeItem(k)
              } catch {
                /* optional */
              }
            for (const v of ['--sidebar-width', '--sidebar-width-compact', '--bc-width']) document.documentElement.style.removeProperty(v)
            window.dispatchEvent(new CustomEvent('bloom:toast', { detail: 'Layout reset' }))
          }}
        >
          Reset
        </button>
      </div>
      <div className={styles.subOption}>
        <span>
          <strong>Show tips again</strong>
          <small>Bring back hints, tours and tips you’ve dismissed.</small>
        </span>
        <button
          type="button"
          className="quiet-button"
          onClick={() => {
            let n = 0
            try {
              for (const k of Object.keys(localStorage)) {
                if (k.startsWith('bloom-') && /(hint|seen|tip|tour|intro|onboard|dismiss)/i.test(k)) {
                  localStorage.removeItem(k)
                  n++
                }
              }
            } catch {
              /* optional */
            }
            window.dispatchEvent(new CustomEvent('bloom:toast', { detail: n ? `${n} tip${n === 1 ? '' : 's'} will show again` : 'No dismissed tips' }))
          }}
        >
          Reset tips
        </button>
      </div>
      <label className={styles.subOption}>
        <span>
          <strong>Your name</strong>
          <small>Bloom uses it to greet you on the home page.</small>
        </span>
        <input
          type="text"
          className="settings-name"
          maxLength={30}
          placeholder="e.g. Sam"
          aria-label="Your name"
          defaultValue={(() => {
            try {
              return localStorage.getItem('bloom-name') ?? ''
            } catch {
              return ''
            }
          })()}
          onBlur={(e) => {
            try {
              localStorage.setItem('bloom-name', e.currentTarget.value.trim())
            } catch {
              /* optional */
            }
          }}
        />
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Corner roundness</strong>
          <small>How rounded buttons, fields and cards look.</small>
        </span>
        <select
          className="settings-name"
          aria-label="Corner roundness"
          defaultValue={document.documentElement.dataset.round ?? ''}
          onChange={(e) => {
            try {
              localStorage.setItem('bloom-round', e.target.value)
            } catch {
              /* optional */
            }
            if (e.target.value) document.documentElement.dataset.round = e.target.value
            else delete document.documentElement.dataset.round
          }}
        >
          <option value="">Soft</option>
          <option value="square">Square-ish</option>
          <option value="round">Extra round</option>
        </select>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>High contrast</strong>
          <small>Stronger text and borders on every theme.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            checked={contrast}
            onChange={(e) => {
              setContrast(e.target.checked)
              try {
                localStorage.setItem('bloom-high-contrast', e.target.checked ? '1' : '0')
              } catch {
                /* optional */
              }
              document.documentElement.toggleAttribute('data-high-contrast', e.target.checked)
            }}
            aria-label="High contrast"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Compact sidebar</strong>
          <small>Tighter rows so more pages fit without scrolling.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            checked={dense}
            onChange={(e) => {
              setDense(e.target.checked)
              try {
                localStorage.setItem('bloom-nav-dense', e.target.checked ? '1' : '0')
              } catch {
                /* optional */
              }
              document.documentElement.toggleAttribute('data-nav-dense', e.target.checked)
            }}
            aria-label="Compact sidebar"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Bloom chat on the right</strong>
          <small>Open the floating Bloom chat on the right side of the screen instead of the left.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            defaultChecked={document.documentElement.hasAttribute('data-bloom-right')}
            onChange={(e) => {
              try {
                localStorage.setItem('bloom-chat-right', e.target.checked ? '1' : '0')
              } catch {
                /* optional */
              }
              document.documentElement.toggleAttribute('data-bloom-right', e.target.checked)
            }}
            aria-label="Bloom chat on the right"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Private notifications</strong>
          <small>System notifications say “Open Bloom to see it” instead of the habit or routine name.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            defaultChecked={(() => {
              try {
                return localStorage.getItem('bloom-private-notifications') === '1'
              } catch {
                return false
              }
            })()}
            onChange={(e) => {
              try {
                localStorage.setItem('bloom-private-notifications', e.target.checked ? '1' : '0')
              } catch {
                /* optional */
              }
            }}
            aria-label="Private notifications"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Quiet hours</strong>
          <small>No habit or routine reminders during these hours.</small>
        </span>
        <select
          className="settings-name"
          aria-label="Quiet hours"
          defaultValue={(() => {
            try {
              return localStorage.getItem('bloom-quiet-hours') ?? ''
            } catch {
              return ''
            }
          })()}
          onChange={(e) => {
            try {
              if (e.target.value) localStorage.setItem('bloom-quiet-hours', e.target.value)
              else localStorage.removeItem('bloom-quiet-hours')
            } catch {
              /* optional */
            }
          }}
        >
          <option value="">Off</option>
          <option value="22-7">22:00–07:00</option>
          <option value="21-8">21:00–08:00</option>
          <option value="23-9">23:00–09:00</option>
          <option value="12-14">12:00–14:00 (lunch)</option>
        </select>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Week starts on</strong>
          <small>Used by the calendar.</small>
        </span>
        <select
          className="settings-name"
          aria-label="Week starts on"
          defaultValue={(() => {
            try {
              return localStorage.getItem('bloom-week-start') ?? '1'
            } catch {
              return '1'
            }
          })()}
          onChange={(e) => {
            try {
              localStorage.setItem('bloom-week-start', e.target.value)
            } catch {
              /* optional */
            }
          }}
        >
          <option value="1">Monday</option>
          <option value="0">Sunday</option>
        </select>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Open Bloom on</strong>
          <small>The page you land on when you open Bloom without a link.</small>
        </span>
        <select
          className="settings-name"
          aria-label="Open Bloom on"
          defaultValue={(() => {
            try {
              return localStorage.getItem('bloom-start-page') ?? ''
            } catch {
              return ''
            }
          })()}
          onChange={(e) => {
            try {
              if (e.target.value) localStorage.setItem('bloom-start-page', e.target.value)
              else localStorage.removeItem('bloom-start-page')
            } catch {
              /* optional */
            }
          }}
        >
          <option value="">Home</option>
          <option value="last">The last page I used</option>
          <option value="daybook">Daybook</option>
          <option value="habits">Habits</option>
          <option value="todos">To-dos</option>
          <option value="focus">Focus</option>
          <option value="calendar">Calendar</option>
        </select>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Theme schedule</strong>
          <small>Switch to dark in the evening and back to light in the morning.</small>
        </span>
        <select
          className="settings-name"
          aria-label="Theme schedule"
          defaultValue={(() => {
            try {
              return localStorage.getItem('bloom-theme-schedule') ?? ''
            } catch {
              return ''
            }
          })()}
          onChange={(e) => {
            try {
              if (e.target.value) localStorage.setItem('bloom-theme-schedule', e.target.value)
              else localStorage.removeItem('bloom-theme-schedule')
            } catch {
              /* optional */
            }
            window.dispatchEvent(new Event('bloom:theme-schedule'))
          }}
        >
          <option value="">Off</option>
          <option value="19-7">Dark 19:00–07:00</option>
          <option value="20-7">Dark 20:00–07:00</option>
          <option value="21-6">Dark 21:00–06:00</option>
          <option value="18-8">Dark 18:00–08:00</option>
        </select>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Follow system light/dark</strong>
          <small>Switch between light and dark whenever your device does.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            checked={followSys}
            onChange={(e) => {
              setFollowSys(e.target.checked)
              setFollowSystemTheme(e.target.checked)
            }}
            aria-label="Follow system light/dark"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Page banner</strong>
          <small>The title bar with the page’s icon and related links at the top of each page. Turn off for more room.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            checked={banner}
            onChange={(e) => {
              setBanner(e.target.checked)
              setPageBanner(e.target.checked)
            }}
            aria-label="Page banner"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <label className={styles.subOption}>
        <span>
          <strong>Pixel icon mode</strong>
          <small>Swap Bloom’s line icons for pixel-art icons. Animated icons keep their motion.</small>
        </span>
        <span className={styles.switch} data-size="small">
          <input
            type="checkbox"
            checked={pixel}
            onChange={(e) => {
              setPixel(e.target.checked)
              setPixelIcons(e.target.checked)
            }}
            aria-label="Pixel icon mode"
          />
          <span className={styles.slider} aria-hidden="true" />
        </span>
      </label>
      <div className={styles.optionActions}>
        <button type="button" onClick={() => window.dispatchEvent(new Event('bloom:welcome'))}>
          🌸 Set up Bloom again
        </button>
      </div>
      <small className={styles.optionNote}>Answer Bloom’s welcome questions again to re-pick your features and theme.</small>
    </section>
  )
}

function OptionList({
  prefix,
  options,
  parentOn,
  parentTitle,
  query,
  sub,
  setSub,
}: {
  prefix: string
  options: SubFeature[]
  parentOn: boolean
  parentTitle: string
  query: string
  sub: Record<string, boolean>
  setSub: (sub: Record<string, boolean>) => void
}) {
  const hit = query.trim() ? options.filter((o) => matches(o.title, query)) : []
  const onCount = options.filter((o) => sub[`${prefix}.${o.id}`] !== false).length
  const setAll = (value: boolean | null) =>
    setSub({
      ...Object.fromEntries(Object.entries(sub).filter(([k]) => !k.startsWith(`${prefix}.`))),
      ...(value === null ? {} : Object.fromEntries(options.map((o) => [`${prefix}.${o.id}`, value]))),
    })
  return (
    <details className={styles.subOptions} open={hit.length > 0 || undefined}>
      <summary>
        {options.length} options · {onCount} on
      </summary>
      <div className={styles.optionActions}>
        <button type="button" onClick={() => setAll(true)} disabled={onCount === options.length}>All on</button>
        <button type="button" onClick={() => setAll(false)} disabled={onCount === 0}>All off</button>
        <button type="button" onClick={() => setAll(null)}>Reset</button>
      </div>
      {!parentOn && <p className={styles.optionNote}>{parentTitle} is off — its options wait until you turn it back on.</p>}
      <ul>
        {options.map((option) => {
          const id = `${prefix}.${option.id}`
          const on = sub[id] !== false
          const live = parentOn || !!option.independent
          return (
            <li key={option.id} data-hit={hit.includes(option) || undefined}>
              <label className={styles.subOption}>
                <span>
                  <strong>{option.title}</strong>
                  <small>
                    {option.description}
                    {option.independent && !parentOn ? ' Works even with the feature off.' : ''}
                  </small>
                </span>
                <span className={styles.switch} data-size="small">
                  <input
                    type="checkbox"
                    checked={on && live}
                    disabled={!live}
                    onChange={() => setSub({ ...sub, [id]: !on })}
                    aria-label={`${option.title} (${parentTitle})`}
                  />
                  <span className={styles.slider} aria-hidden="true" />
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

export function SettingsPage({
  settings,
  setSettings,
  theme,
  setTheme,
  trash,
}: SettingsPageProps) {
  const settingsRoot = useRef<HTMLDivElement>(null)
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
      ref={(el) => {
        settingsRoot.current = el
        // Deep links: #settings/appearance scrolls to that section once.
        const section = location.hash.match(/^#settings\/([\w-]+)/)?.[1]
        if (el && section && el.dataset.linked !== section) {
          el.dataset.linked = section
          requestAnimationFrame(() => document.getElementById(`${section}-heading`)?.scrollIntoView({ behavior: 'instant', block: 'start' }))
        }
      }}
      className={`${styles.page} mx-auto flex w-full max-w-5xl flex-col gap-5`}
    >
      <SettingsSearch root={settingsRoot} />
      <nav className="settings-jump" aria-label="Settings sections">
        {[
          ['features-heading', 'Features'],
          ['navigation-heading', 'Navigation'],
          ['appearance-heading', 'Appearance'],
          ['trash-heading', 'Trash'],
          ['json-heading', 'Data'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-label={`Jump to ${label}`}
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              // Shareable deep link, e.g. #settings/appearance.
              history.replaceState(null, '', `#settings/${id.replace(/-heading$/, '')}`)
            }}
          >
            ↓ {label}
          </button>
        ))}
      </nav>

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
          <label className={styles.presetPick}>
            <span>Search</span>
            <input
              className={styles.featureSearch}
              type="search"
              placeholder="Find a feature…"
              aria-label="Find a feature"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <small>Features and their options.</small>
          </label>
        </div>
        {categories.map((category) => {
          const keys = featureKeys.filter(
            (key) =>
              featureCategory[key] === category.id &&
              (!query.trim() || matches(titleOf(key), query) || subFeatures[key].some((o) => matches(o.title, query))),
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
              <ShowMore className={styles.featureRail} initial={query.trim() ? 999 : 6} label="more features">
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
                <OptionList
                  prefix={key}
                  options={options}
                  parentOn={settings.features[key]}
                  parentTitle={title}
                  query={query}
                  sub={settings.sub ?? {}}
                  setSub={(sub) => setSettings((c) => ({ ...c, sub }))}
                />
              )}
              </div>
            )
          })}
              </ShowMore>
            </section>
          )
        })}
        {Object.entries(pageOptions).some(([, p]) => !query.trim() || matches(p.title, query) || p.options.some((o) => matches(o.title, query))) && (
          <section className={styles.category} aria-label="Everyday pages">
            <header className={styles.categoryHead}>
              <h3>
                <span aria-hidden="true">📌</span> Everyday pages <small>always on</small>
              </h3>
            </header>
            <div className={styles.featureRail}>
              {Object.entries(pageOptions)
                .filter(([, p]) => !query.trim() || matches(p.title, query) || p.options.some((o) => matches(o.title, query)))
                .map(([page, p]) => (
                  <div className={styles.featureCard} key={page} data-on>
                    <div className={styles.feature} data-on>
                      <span className={styles.featureIcon} aria-hidden="true">{p.emoji}</span>
                      <span className={styles.featureCopy}>
                        <strong>{p.title}</strong>
                        <span>Always available; choose its extras.</span>
                      </span>
                    </div>
                    <OptionList
                      prefix={`page.${page}`}
                      options={p.options}
                      parentOn
                      parentTitle={p.title}
                      query={query}
                      sub={settings.sub ?? {}}
                      setSub={(sub) => setSettings((c) => ({ ...c, sub }))}
                    />
                  </div>
                ))}
            </div>
          </section>
        )}
      </section>

      <NavigationCard reducedMotion={settings.reducedMotion === true} setReducedMotion={(enabled) => setSettings((current) => ({ ...current, reducedMotion: enabled }))} />

      <section
        className={styles.card}
        aria-labelledby="appearance-heading"
      >
        <h2 id="appearance-heading" className={styles.sectionTitle}>
          <Palette size={18} aria-hidden="true" />
          {t('settings.appearanceHeading')}
        </h2>
        <ThemePicker settings={theme} onChange={setTheme} />
        <ComfortCard />
        <AvatarPicker />
      </section>

      <section className={styles.card}>
        <InstallApp />
      </section>
      {trash && (
        <section className={styles.card} aria-labelledby="trash-heading">
          <h2 id="trash-heading" className={styles.sectionTitle}>🗑 Trash</h2>
          {trash}
        </section>
      )}
      <section className={styles.card}>
        <DataReset />
        <StorageMeter />
        <button
          type="button"
          className="quiet-button settings-diag"
          title="Copies build, browser and screen details (no personal data) for a bug report"
          onClick={(e) => {
            const info = [
              `Bloom build ${__COMMIT__} (${__BUILD_TIME__})`,
              `Browser: ${navigator.userAgent}`,
              `Screen: ${screen.width}×${screen.height} @${devicePixelRatio}x · window ${innerWidth}×${innerHeight}`,
              `Theme: ${document.documentElement.dataset.theme ?? '?'} · font ${document.documentElement.dataset.font ?? '?'}`,
              `Online: ${navigator.onLine} · language ${navigator.language}`,
              `Page: ${location.hash || '#overview'}`,
            ].join('\n')
            void navigator.clipboard?.writeText(info)
            e.currentTarget.textContent = '✓ Diagnostics copied'
          }}
        >
          Copy diagnostics
        </button>
        <p className="settings-build">
          {(() => {
            const last = Number(localStorage.getItem('bloom-last-backup'))
            if (!last) return 'No backup exported yet · '
            const days = Math.floor((Date.now() - last) / 864e5)
            return `Last backup ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`} · `
          })()}
          Bloom build {__COMMIT__} ·{new Date(__BUILD_TIME__).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
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
