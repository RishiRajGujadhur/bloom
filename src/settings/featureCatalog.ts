import type { FeatureFlags } from '../SettingsPage'

/** Settings groups, in display order. */
export const categories = [
  { id: 'today', label: 'Today & planning', emoji: '☀️' },
  { id: 'productivity', label: 'Productivity', emoji: '🎯' },
  { id: 'mind', label: 'Mind & calm', emoji: '🧘' },
  { id: 'body', label: 'Body & movement', emoji: '💪' },
  { id: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { id: 'journal', label: 'Journal & reflection', emoji: '📓' },
  { id: 'play', label: 'Growth & play', emoji: '🌱' },
  { id: 'insights', label: 'Insights', emoji: '📊' },
  { id: 'system', label: 'Look & feel', emoji: '🎨' },
] as const
export type CategoryId = (typeof categories)[number]['id']

type Key = keyof FeatureFlags

export const featureCategory: Record<Key, CategoryId> = {
  bloomCore: 'today',
  mindMaps: 'journal',
  moodMirror: 'journal',
  inkJournal: 'journal',
  mala: 'mind',
  breathwork: 'mind',
  meditation: 'mind',
  soundMixer: 'mind',
  focusSounds: 'mind',
  fasting: 'nutrition',
  foodScanner: 'nutrition',
  bodyProgress: 'body',
  runTracker: 'body',
  mobility: 'body',
  yogaFlow: 'body',
  intervalCoach: 'body',
  workoutLog: 'body',
  exerciseGuides: 'body',
  dailyFlow: 'today',
  fullCalendar: 'today',
  reminders: 'today',
  omnibox: 'today',
  smartSearch: 'today',
  habitTracker: 'productivity',
  focusRoom: 'productivity',
  impactTasks: 'productivity',
  adaptiveGoals: 'productivity',
  urgeTracker: 'productivity',
  urgeClock: 'productivity',
  flowTopography: 'productivity',
  timeSince: 'productivity',
  breathe: 'mind',
  moodCheckin: 'mind',
  moodOrb: 'mind',
  gratitude: 'mind',
  sleepTracker: 'mind',
  burnRelease: 'mind',
  monkMode: 'mind',
  breathSilk: 'mind',
  wuXing: 'mind',
  epiphanies: 'mind',
  postureGuard: 'body',
  dietTracker: 'nutrition',
  microNutrients: 'nutrition',
  recipeBuilder: 'nutrition',
  chatJournal: 'journal',
  daybookModes: 'journal',
  thoughtDiff: 'journal',
  timeCapsule: 'journal',
  voiceMemos: 'journal',
  visionBoard: 'journal',
  memoryPalace: 'journal',
  yearbook: 'journal',
  placesMap: 'journal',
  rpgSkillTree: 'play',
  weeklyRaidBoss: 'play',
  dailySpin: 'play',
  collectibles: 'play',
  garage: 'play',
  petalShop: 'play',
  bloomWorld: 'play',
  skillConstellation: 'play',
  streakJourney: 'play',
  drawnAchievements: 'play',
  celebrations: 'play',
  pixelJuice: 'play',
  queryBuilder: 'insights',
  insightsLab: 'insights',
  energySankey: 'insights',
  compactMode: 'system',
  languageSelector: 'system',
  walkthroughTour: 'system',
}

/**
 * Configurations: pick one to switch many features at once. `on` lists the
 * features to enable (everything else is turned off); categories expand to
 * every feature they contain.
 */
export type Preset = { id: string; label: string; description: string; on: 'all' | 'defaults' | (Key | CategoryId)[] }

const essentials: (Key | CategoryId)[] = ['bloomCore', 'dailyFlow', 'habitTracker', 'languageSelector', 'walkthroughTour', 'omnibox', 'smartSearch']

export const presets: Preset[] = [
  { id: 'recommended', label: 'Recommended', description: 'Bloom’s default set of features.', on: 'defaults' },
  { id: 'everything', label: 'Everything', description: 'Every feature on.', on: 'all' },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'A calm core: plan, move, breathe, reflect.',
    on: [...essentials, 'fullCalendar', 'reminders', 'breathe', 'moodCheckin', 'gratitude', 'sleepTracker', 'daybookModes', 'chatJournal', 'dietTracker', 'rpgSkillTree', 'celebrations', 'insightsLab'],
  },
  { id: 'minimal', label: 'Minimal', description: 'Only the essentials.', on: essentials },
  { id: 'calm', label: 'Calm mind', description: 'Meditation, breath, sleep and journaling.', on: [...essentials, 'mind', 'journal'] },
  { id: 'body', label: 'Body & fitness', description: 'Training, movement and nutrition.', on: [...essentials, 'body', 'nutrition', 'sleepTracker', 'breathe'] },
  { id: 'deepwork', label: 'Deep work', description: 'Focus, planning and fewer distractions.', on: [...essentials, 'today', 'productivity', 'insights', 'breathe'] },
  { id: 'nourish', label: 'Nourish', description: 'Food, fasting and nutrients.', on: [...essentials, 'nutrition', 'moodCheckin'] },
  { id: 'journaling', label: 'Journaling', description: 'Writing, memories and reflection.', on: [...essentials, 'journal', 'moodCheckin', 'gratitude', 'epiphanies'] },
  { id: 'gamified', label: 'Gamified', description: 'Loot, worlds and quests.', on: [...essentials, 'play', 'today', 'productivity'] },
]

export function applyPreset(preset: Preset, keys: readonly Key[], defaults?: FeatureFlags): Record<Key, boolean> {
  const out = {} as Record<Key, boolean>
  const on = preset.on
  for (const k of keys)
    out[k] = on === 'all' ? true : on === 'defaults' ? (defaults?.[k] ?? true) : on.includes(k) || on.includes(featureCategory[k])
  return out
}

/** The preset that exactly matches the current switches, if any. */
export function matchPreset(features: FeatureFlags, keys: readonly Key[], defaults?: FeatureFlags) {
  return presets.find((p) => {
    const want = applyPreset(p, keys, defaults)
    return keys.every((k) => want[k] === features[k])
  })
}
