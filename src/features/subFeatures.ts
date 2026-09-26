import type { FeatureFlags } from '../SettingsPage'
import { SETTINGS_STORAGE_KEY } from '../settingsKey'

/**
 * Sub-features: every feature exposes 2+ finer options in Settings. They are
 * stored as `sub["feature.option"]`; a missing entry means "on", so new
 * options appear enabled without migrating anyone's saved settings.
 */
export type SubFeature = { id: string; title: string; description: string }

export const subFeatures: Record<keyof FeatureFlags, SubFeature[]> = {
  dailySpin: [
    { id: 'dashboard', title: 'Show on dashboard', description: 'The spin card appears on Today.' },
    { id: 'jackpotFountain', title: 'Jackpot fountain', description: 'Gold burst when a car is won.' },
  ],
  collectibles: [
    { id: 'focusCompanion', title: 'Focus companion', description: 'Your chosen car rides along in focus sessions.' },
    { id: 'carEffects', title: 'Car effects', description: 'Bounces, dashes and sparkles on car cards.' },
  ],
  fullCalendar: [
    { id: 'fullscreen', title: 'Full-screen mode', description: 'A button to fill the whole screen.' },
    { id: 'capacity', title: 'Daily capacity bar', description: 'Hours available vs. blocked.' },
    { id: 'taskTray', title: 'Task tray', description: 'Drag unscheduled tasks onto the calendar.' },
  ],
  visionBoard: [
    { id: 'badgeNodes', title: 'Badge nodes', description: 'Earned boss badges can be pinned to the board.' },
    { id: 'minimap', title: 'Minimap', description: 'Overview map in the corner.' },
  ],
  bloomWorld: [
    { id: 'avatar', title: 'Avatar and shop decor', description: 'Your avatar and items bought with petals.' },
    { id: 'dayNight', title: 'Day and night sky', description: 'Lighting follows your local time.' },
    { id: 'futurePeek', title: 'Peek at the future', description: 'Preview a fully grown island.' },
  ],
  breathe: [
    { id: 'customPattern', title: 'Custom pattern builder', description: 'Design your own rhythm.' },
    { id: 'soundCue', title: 'Sound cue', description: 'Soft tone on each phase.' },
    { id: 'vibrate', title: 'Vibration cue', description: 'Short buzz on each phase (phones).' },
  ],
  moodCheckin: [
    { id: 'detailed', title: 'Detailed mode', description: 'Emotion wheel and energy level.' },
    { id: 'wordCloud', title: 'Emotion word cloud', description: 'Words you use most.' },
    { id: 'recent', title: 'Recent check-ins slider', description: 'Your latest entries.' },
  ],
  gratitude: [
    { id: 'customJars', title: 'Custom jars', description: 'Create your own jars.' },
    { id: 'shake', title: 'Shake for a memory', description: 'Resurface a random note.' },
    { id: 'compare', title: 'Compare jars', description: 'See which jar is fullest.' },
  ],
  compactMode: [
    { id: 'sidebar', title: 'Compact sidebar', description: 'Tighter navigation rows.' },
    { id: 'cards', title: 'Compact cards', description: 'Less padding inside cards.' },
  ],
  sleepTracker: [
    { id: 'windDown', title: 'Wind-down routine', description: 'Bedtime countdown and checklist.' },
    { id: 'insights', title: 'Sleep insights', description: 'Charts and factor impact.' },
    { id: 'factors', title: 'Factor tags', description: 'Tag caffeine, screens, exercise…' },
  ],
  petalShop: [
    { id: 'wearables', title: 'Avatar items', description: 'Hats, outfits and pets.' },
    { id: 'decor', title: 'World decor', description: 'Decorations for Bloom World.' },
  ],
  reminders: [
    { id: 'system', title: 'System notifications', description: 'Notify when Bloom is in the background.' },
    { id: 'bellAnimation', title: 'Ringing bell', description: 'Active bells ring now and then.' },
  ],
  adaptiveGoals: [
    { id: 'stretch', title: 'Gentle stretch', description: 'Aim 10% above your pace (off = match it).' },
    { id: 'badge', title: '“Adapted” badge', description: 'Label goals that changed.' },
  ],
  celebrations: [
    { id: 'checkins', title: 'Check-in bursts', description: 'Coins when you complete a habit.' },
    { id: 'milestones', title: 'Milestone fountains', description: 'Big bursts for streak milestones.' },
  ],
  burnRelease: [
    { id: 'daybookShortcut', title: 'Daybook shortcut', description: 'From Fear Setting and Shadow Work pages.' },
    { id: 'flick', title: 'Flick to release', description: 'Throw the card with momentum.' },
  ],
  garage: [
    { id: 'upgrades', title: 'Garage upgrades', description: 'Neon, turntable, chargers and more.' },
    { id: 'turntable', title: 'Turntable spin', description: 'Pad 1 rotates your car.' },
  ],
  urgeClock: [
    { id: 'seconds', title: 'Seconds', description: 'Tick every second.' },
    { id: 'highScore', title: 'High score', description: 'Best streak and “New best”.' },
  ],
  focusRoom: [
    { id: 'soundtrack', title: 'Soundtrack', description: 'Classical and cinematic music.' },
    { id: 'avatar', title: 'Avatar at the desk', description: 'Your avatar works with you.' },
  ],
  timeCapsule: [
    { id: 'onThisDay', title: 'On this day', description: 'Entries from a week, month or year ago.' },
    { id: 'gratitude', title: 'Gratitude fallback', description: 'A jar note when nothing else matches.' },
    { id: 'shuffle', title: 'Shuffle', description: 'Pick another memory.' },
  ],
  thoughtDiff: [
    { id: 'counts', title: 'Change counts', description: 'How many words are new or faded.' },
    { id: 'autoOpen', title: 'Open automatically', description: 'Show the comparison when a page opens.' },
  ],
  queryBuilder: [
    { id: 'presets', title: 'Example questions', description: 'One-tap starting points.' },
    { id: 'moodAverage', title: 'Mood average', description: 'Average mood of the matches.' },
  ],
  yearbook: [
    { id: 'coverPreview', title: 'Cover preview', description: '3D book cover preview.' },
    { id: 'stats', title: 'Stats preview', description: 'The year in numbers before printing.' },
  ],
  memoryPalace: [
    { id: 'inertia', title: 'Drag and scroll', description: 'Spin the ring with momentum.' },
    { id: 'monthMarkers', title: 'Month markers', description: 'Glowing dots at each month.' },
  ],
  skillConstellation: [
    { id: 'starfield', title: 'Starfield', description: 'Background stars.' },
    { id: 'statBranches', title: 'Stat branches', description: 'Strength, intelligence and spirit stars.' },
  ],
  streakJourney: [
    { id: 'monuments', title: 'Monuments', description: 'A monument every 7 days.' },
    { id: 'quotes', title: 'Journal quotes', description: 'What you wrote along the way.' },
  ],
  moodOrb: [
    { id: 'liquid', title: 'Liquid motion', description: 'The surface moves continuously.' },
    { id: 'colorShift', title: 'Colour shift', description: 'Colour follows your mood.' },
  ],
  placesMap: [
    { id: 'heat', title: 'Heat halos', description: 'Soft halos sized by visits.' },
    { id: 'offlineTiles', title: 'Offline map tiles', description: 'Cache tiles for offline use.' },
  ],
  urgeTracker: [
    { id: 'patterns', title: 'Patterns view', description: 'When and where urges happen.' },
    { id: 'context', title: 'Context capture', description: 'Time of day and session info.' },
  ],
  habitTracker: [
    { id: 'library', title: 'Habit & routine library', description: 'Adopt ready-made cards.' },
    { id: 'routines', title: 'Routines', description: 'Timed step-by-step routines.' },
    { id: 'grid', title: 'Contribution grid', description: 'History heatmap on each habit.' },
  ],
  chatJournal: [
    { id: 'quickEntry', title: 'Quick entry', description: 'Short journal entries with tags.' },
    { id: 'promptChips', title: 'Prompt chips', description: 'Suggested answers to get started.' },
  ],
  rpgSkillTree: [
    { id: 'weeklyGoals', title: 'Weekly goals', description: 'Goal cards on the Growth panel.' },
    { id: 'notices', title: 'Reward notices', description: 'Pop-ups for XP and level-ups.' },
  ],
  weeklyRaidBoss: [
    { id: 'hp', title: 'Boss health bar', description: 'Show the raid boss HP.' },
    { id: 'damage', title: 'Damage labels', description: 'Show how much each action hits.' },
  ],
  daybookModes: [
    { id: 'autosave', title: 'Autosave', description: 'Save pages as you type.' },
    { id: 'focusWriting', title: 'Focus writing', description: 'Hide everything but the page.' },
    { id: 'pages', title: 'Your pages slider', description: 'Recent pages on the Daybook home.' },
  ],
  languageSelector: [
    { id: 'dialects', title: 'Fun dialects', description: 'Pirate and slang English.' },
    { id: 'french', title: 'French', description: 'Français.' },
  ],
  walkthroughTour: [
    { id: 'wizard', title: 'Pixel wizard narrator', description: 'The wizard in guide pop-ups.' },
    { id: 'reveal', title: 'Animated text', description: 'Words reveal one by one.' },
  ],
  timeSince: [
    { id: 'splitFlap', title: 'Split-flap digits', description: 'Train-station flip animation.' },
    { id: 'countdowns', title: 'Countdowns', description: 'Count down to future events.' },
    { id: 'urgeLink', title: 'Urge clocks on dashboard', description: 'Time since your last slip.' },
  ],
  drawnAchievements: [
    { id: 'skills', title: 'Skill unlocks', description: 'Drawn illustration when a skill unlocks.' },
    { id: 'levels', title: 'Level-ups', description: 'Drawn illustration on each new level.' },
    { id: 'streaks', title: 'Streak milestones', description: 'Drawn tree at 7/30/100-day streaks.' },
  ],
}

let cache: { raw: string | null; sub: Record<string, boolean>; features: Record<string, boolean> } | null = null
function read() {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
  if (!cache || cache.raw !== raw) {
    let parsed: { sub?: Record<string, boolean>; features?: Record<string, boolean> }
    try {
      parsed = raw ? JSON.parse(raw) : {}
    } catch {
      parsed = {}
    }
    cache = { raw, sub: parsed.sub ?? {}, features: parsed.features ?? {} }
  }
  return cache
}

/** True unless the user switched this option (or its parent feature) off. */
export function subOn(feature: keyof FeatureFlags, id: string, options?: { ignoreParent?: boolean }) {
  const { sub, features } = read()
  if (!options?.ignoreParent && features[feature] === false) return false
  return sub[`${feature}.${id}`] !== false
}
