import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { SETTINGS_STORAGE_KEY } from '../settingsKey'
import { rememberFeatureChanges } from './disabledHistory'

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

export function parseSettings(value: unknown): AppSettings | null {
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
    ? {
        features: { ...migrated },
        sub: sub as Record<string, boolean>,
        reducedMotion: candidate.reducedMotion === true,
      }
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
  const persistSettings: Dispatch<SetStateAction<AppSettings>> = useCallback(
    (update) => {
      setSettings((current) => {
        const resolved = typeof update === 'function' ? update(current) : update
        if (resolved === current) return current
        rememberFeatureChanges(current.features, resolved.features)
        window.localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(resolved),
        )
        return resolved
      })
    },
    [],
  )
  return [settings, persistSettings]
}
