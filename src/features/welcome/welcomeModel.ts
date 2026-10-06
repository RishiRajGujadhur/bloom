import type { FeatureFlags } from '../../settings/appSettings'
import { applyPreset, featureCategory, presets } from '../../settings/featureCatalog'

/**
 * Welcome onboarding (after Brilliant's flow): Bloom asks a few questions and
 * the answers switch features on or off and pick the theme.
 */
type Key = keyof FeatureFlags
export type Option = { id: string; label: string; emoji: string; hint?: string }
export type Question = { id: string; ask: string; sub?: string; multi?: number; options: Option[]; kind?: 'cards' | 'list' | 'theme' }

export const questions: Question[] = [
  {
    id: 'goals',
    ask: 'What would you like Bloom to help with?',
    sub: 'Pick up to three.',
    multi: 3,
    options: [
      { id: 'focus', label: 'Deep work & focus', emoji: '🎯' },
      { id: 'calm', label: 'Calm & less stress', emoji: '🧘' },
      { id: 'habits', label: 'Build good habits', emoji: '🌱' },
      { id: 'body', label: 'Move & get fit', emoji: '💪' },
      { id: 'reflect', label: 'Reflect & journal', emoji: '📓' },
      { id: 'mind', label: 'Sharpen my mind', emoji: '🧠' },
      { id: 'nourish', label: 'Eat & sleep better', emoji: '🥗' },
      { id: 'plan', label: 'Plan my days', emoji: '🗓️' },
    ],
  },
  {
    id: 'style',
    ask: 'How do you like your space?',
    options: [
      { id: 'minimal', label: 'Minimal', emoji: '🤍', hint: 'Only what I need. Nothing extra.' },
      { id: 'balanced', label: 'Balanced', emoji: '⚖️', hint: 'A calm core, with room to grow.' },
      { id: 'explorer', label: 'Explorer', emoji: '🧭', hint: 'Show me everything Bloom can do.' },
      { id: 'playful', label: 'Playful', emoji: '🎮', hint: 'Games, loot and a little world.' },
    ],
    kind: 'list',
  },
  {
    id: 'rhythm',
    ask: 'When do you do your best work?',
    options: [
      { id: 'morning', label: 'Mornings', emoji: '🌅' },
      { id: 'afternoon', label: 'Afternoons', emoji: '☀️' },
      { id: 'evening', label: 'Evenings', emoji: '🌙' },
      { id: 'varies', label: 'It varies', emoji: '🌀' },
    ],
  },
  {
    id: 'time',
    ask: 'How much time can you give Bloom each day?',
    options: [
      { id: '2', label: '2 minutes', emoji: '⚡', hint: 'Quick check-ins only.' },
      { id: '10', label: '10 minutes', emoji: '☕', hint: 'A short daily ritual.' },
      { id: '30', label: '30 minutes', emoji: '🧩', hint: 'Room for practice and play.' },
      { id: 'more', label: 'As long as it helps', emoji: '♾️', hint: 'Bloom is my daily home.' },
    ],
    kind: 'list',
  },
  {
    id: 'distraction',
    ask: 'What gets in the way most?',
    options: [
      { id: 'phone', label: 'My phone & feeds', emoji: '📱' },
      { id: 'overwhelm', label: 'Too much to do', emoji: '🌊' },
      { id: 'energy', label: 'Low energy', emoji: '🔋' },
      { id: 'forget', label: 'I forget things', emoji: '🫧' },
    ],
  },
  {
    id: 'celebrate',
    ask: 'How should I celebrate your wins?',
    options: [
      { id: 'quiet', label: 'Quietly', emoji: '🤫', hint: 'A simple tick is enough.' },
      { id: 'sparkle', label: 'A little sparkle', emoji: '✨', hint: 'Gentle animations and sounds.' },
      { id: 'party', label: 'Big celebrations', emoji: '🎉', hint: 'Confetti, trails and fanfare!' },
    ],
    kind: 'list',
  },
  {
    id: 'theme',
    ask: 'Last one — pick your look.',
    kind: 'theme',
    options: [
      { id: 'bloom-light', label: 'Bloom light', emoji: '🌸' },
      { id: 'bloom-dark', label: 'Bloom dark', emoji: '🌙' },
      { id: 'galaxy', label: 'Galaxy', emoji: '✦' },
      { id: 'emerald-forest', label: 'Forest', emoji: '🌲' },
      { id: 'rose-pine', label: 'Rosé', emoji: '🍷' },
      { id: 'nord', label: 'Nordic', emoji: '❄️' },
      { id: 'tokyo-night', label: 'Tokyo night', emoji: '🌃' },
      { id: 'matrix', label: 'Matrix', emoji: '🤖' },
      { id: 'device', label: 'Match my device', emoji: '🖥️' },
    ],
  },
]

/** Theme preview colours: [background, surface, accent, text]. */
export const themeSwatches: Record<string, [string, string, string, string]> = {
  'bloom-light': ['#fbf6f1', '#ffffff', '#e0703f', '#2b2b2b'],
  'bloom-dark': ['#1c1a1f', '#26232a', '#f08a5d', '#f3ede7'],
  galaxy: ['#05070d', '#101722', '#a6f8cf', '#ffffff'],
  'emerald-forest': ['#0f1f17', '#16291f', '#3fbf7f', '#e3f2ea'],
  'rose-pine': ['#191724', '#1f1d2e', '#ebbcba', '#e0def4'],
  nord: ['#2e3440', '#3b4252', '#88c0d0', '#eceff4'],
  'tokyo-night': ['#1a1b26', '#24283b', '#7aa2f7', '#c0caf5'],
  matrix: ['#030a05', '#07140b', '#39ff6a', '#b6ffc8'],
  device: ['#fbf6f1', '#1c1a1f', '#e0703f', '#888888'],
}

export type Answers = Record<string, string[]>

const goalFeatures: Record<string, (Key | string)[]> = {
  focus: ['productivity', 'focusRoom', 'focusSounds', 'monkMode', 'impactTasks'],
  calm: ['mind', 'breathe', 'moodCheckin'],
  habits: ['habitTracker', 'routineScheduler', 'streakJourney', 'urgeTracker'],
  body: ['body'],
  reflect: ['journal', 'moodCheckin', 'gratitude', 'epiphanies'],
  mind: ['brainGames', 'flashcards', 'mindMaps', 'memoryPalace'],
  nourish: ['nutrition', 'sleepTracker', 'daylight'],
  plan: ['today', 'fullCalendar', 'goalRoadmap', 'routineScheduler'],
}
const stylePreset: Record<string, string> = { minimal: 'minimal', balanced: 'balanced', explorer: 'everything', playful: 'gamified' }

/** Turn answers into feature switches (on top of the chosen style). */
export function configure(answers: Answers, keys: readonly Key[], defaults: FeatureFlags): Record<Key, boolean> {
  const style = answers.style?.[0] ?? 'balanced'
  const base = applyPreset(presets.find((p) => p.id === stylePreset[style]) ?? presets[0], keys, defaults)
  const on = new Set<string>()
  for (const g of answers.goals ?? []) goalFeatures[g]?.forEach((x) => on.add(x))
  const d = answers.distraction?.[0]
  if (d === 'phone') ['monkMode', 'digitalWellbeing', 'focusRoom'].forEach((x) => on.add(x))
  if (d === 'overwhelm') ['impactTasks', 'dailyFlow', 'breathe'].forEach((x) => on.add(x))
  if (d === 'energy') ['sleepTracker', 'daylight', 'breathwork'].forEach((x) => on.add(x))
  if (d === 'forget') ['reminders', 'flashcards', 'epiphanies'].forEach((x) => on.add(x))
  const r = answers.rhythm?.[0]
  if (r === 'morning') ['daylight', 'dailyFlow'].forEach((x) => on.add(x))
  if (r === 'evening') ['sleepTracker', 'dailyFlow'].forEach((x) => on.add(x))
  const c = answers.celebrate?.[0]
  const out = { ...base }
  for (const k of keys) if (on.has(k) || on.has(featureCategory[k])) out[k] = true
  if (c) {
    out.celebrations = c !== 'quiet'
    out.pixelJuice = c === 'party'
    out.pointerFx = true
  }
  const t = answers.time?.[0]
  if (t === '2') out.compactMode = true
  if (style === 'minimal' || t === '2') for (const k of ['bloomWorld', 'garage', 'dailySpin', 'collectibles'] as Key[]) if (k in out) out[k] = false
  return out
}

/** Sub-option tweaks: quiet celebrations turn off trails and page-matched effects. */
export function configureSubs(answers: Answers): Record<string, boolean> {
  const c = answers.celebrate?.[0]
  if (c === 'quiet') return { 'pointerFx.effects': false, 'pointerFx.pageMatch': false }
  if (c === 'party') return { 'pointerFx.effects': true, 'pointerFx.pageMatch': true }
  return { 'pointerFx.effects': true, 'pointerFx.pageMatch': false }
}

export function themeFor(answers: Answers) {
  const t = answers.theme?.[0] ?? 'bloom-light'
  if (t !== 'device') return t
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'bloom-dark' : 'bloom-light'
}

export const WELCOME_KEY = 'bloom-welcome-v1'
/** Show the welcome only on a true first run: never welcomed and no saved Bloom data yet. */
export const welcomeDone = () => {
  try {
    return localStorage.getItem(WELCOME_KEY) !== null || localStorage.getItem('mindfulness-dashboard-v1') !== null
  } catch {
    return true
  }
}
