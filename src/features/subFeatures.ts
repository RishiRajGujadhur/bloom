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
    { id: 'odds', title: 'Odds note', description: 'Shows the jackpot odds and reset time.' },
    { id: 'collectionLink', title: 'Collection link', description: 'Jump to your cars after a spin.' },
    { id: 'machineGlow', title: 'Machine glow', description: 'Animated lights on the spin machine.' },
  ],
  collectibles: [
    { id: 'focusCompanion', title: 'Focus companion', description: 'Your chosen car rides along in focus sessions.' },
    { id: 'carEffects', title: 'Car effects', description: 'Bounces, dashes and sparkles on car cards.' },
    { id: 'numbering', title: 'Card numbers', description: '“01 / 06” labels on cards.' },
    { id: 'lockedCars', title: 'Show locked cars', description: 'Silhouettes of cars still to find.' },
    { id: 'filterTabs', title: 'Filter tabs', description: 'All / Unlocked / Garage tabs.' },
  ],
  fullCalendar: [
    { id: 'fullscreen', title: 'Full-screen mode', description: 'A button to fill the whole screen.' },
    { id: 'capacity', title: 'Daily capacity bar', description: 'Hours available vs. blocked.' },
    { id: 'taskTray', title: 'Task tray', description: 'Drag unscheduled tasks onto the calendar.' },
    { id: 'weekends', title: 'Weekends', description: 'Show Saturday and Sunday.' },
    { id: 'nowLine', title: 'Now line', description: 'A line at the current time.' },
    { id: 'agenda', title: 'Agenda view', description: 'A list view of the week.' },
  ],
  visionBoard: [
    { id: 'badgeNodes', title: 'Badge nodes', description: 'Earned boss badges can be pinned to the board.' },
    { id: 'minimap', title: 'Minimap', description: 'Overview map in the corner.' },
    { id: 'grid', title: 'Dot grid', description: 'Background dots.' },
    { id: 'controls', title: 'Zoom controls', description: 'On-canvas zoom buttons.' },
    { id: 'snap', title: 'Snap to grid', description: 'Items align to a 20 px grid.' },
  ],
  bloomWorld: [
    { id: 'avatar', title: 'Avatar and shop decor', description: 'Your avatar and items bought with petals.' },
    { id: 'dayNight', title: 'Day and night sky', description: 'Lighting follows your local time.' },
    { id: 'futurePeek', title: 'Peek at the future', description: 'Preview a fully grown island.' },
    { id: 'clouds', title: 'Drifting clouds', description: 'Clouds float over the island.' },
    { id: 'decorations', title: 'Milestone decorations', description: 'Lanterns, pond, windmill and more.' },
    { id: 'districtCards', title: 'District cards', description: 'Progress cards under the island.' },
    { id: 'growthNote', title: '“While you were away”', description: 'What grew since your last visit.' },
  ],
  breathe: [
    { id: 'customPattern', title: 'Custom pattern builder', description: 'Design your own rhythm.' },
    { id: 'soundCue', title: 'Sound cue', description: 'Soft tone on each phase.' },
    { id: 'vibrate', title: 'Vibration cue', description: 'Short buzz on each phase (phones).' },
    { id: 'rounds', title: 'Round goals', description: 'Choose 4, 8 or 12 rounds.' },
    { id: 'orbPulse', title: 'Orb animation', description: 'The orb grows and shrinks.' },
    { id: 'cycleCount', title: 'Round counter', description: 'Rounds completed.' },
  ],
  moodCheckin: [
    { id: 'detailed', title: 'Detailed mode', description: 'Emotion wheel and energy level.' },
    { id: 'wordCloud', title: 'Emotion word cloud', description: 'Words you use most.' },
    { id: 'recent', title: 'Recent check-ins slider', description: 'Your latest entries.' },
    { id: 'notes', title: 'Notes', description: 'A word about why.' },
    { id: 'weekChart', title: 'Week chart', description: 'Your last seven days.' },
  ],
  gratitude: [
    { id: 'customJars', title: 'Custom jars', description: 'Create your own jars.' },
    { id: 'shake', title: 'Shake for a memory', description: 'Resurface a random note.' },
    { id: 'compare', title: 'Compare jars', description: 'See which jar is fullest.' },
    { id: 'notes', title: 'Notes slider', description: 'Browse notes in the jar.' },
    { id: 'counts', title: 'Jar counts', description: 'Numbers under each jar.' },
  ],
  compactMode: [
    { id: 'sidebar', title: 'Compact sidebar', description: 'Tighter navigation rows.' },
    { id: 'cards', title: 'Compact cards', description: 'Less padding inside cards.' },
    { id: 'hero', title: 'Compact headers', description: 'Smaller page and hero headers.' },
    { id: 'type', title: 'Smaller headings', description: 'Tighter type scale.' },
    { id: 'descriptions', title: 'Hide descriptions', description: 'Only titles on cards.' },
  ],
  sleepTracker: [
    { id: 'windDown', title: 'Wind-down routine', description: 'Bedtime countdown and checklist.' },
    { id: 'insights', title: 'Sleep insights', description: 'Charts and factor impact.' },
    { id: 'factors', title: 'Factor tags', description: 'Tag caffeine, screens, exercise…' },
    { id: 'debt', title: 'Sleep debt', description: 'Hours short of your goal.' },
    { id: 'consistency', title: 'Consistency score', description: 'How regular your bedtime is.' },
    { id: 'history', title: 'Recent nights list', description: 'Edit or delete recent nights.' },
  ],
  petalShop: [
    { id: 'wearables', title: 'Avatar items', description: 'Hats, outfits and pets.' },
    { id: 'decor', title: 'World decor', description: 'Decorations for Bloom World.' },
    { id: 'garageItems', title: 'Garage upgrades', description: 'Upgrades for your car garage.' },
    { id: 'avatarPreview', title: 'Avatar preview', description: 'See your avatar in the shop.' },
    { id: 'toast', title: 'Purchase toast', description: '“It’s yours!” message.' },
  ],
  reminders: [
    { id: 'system', title: 'System notifications', description: 'Notify when Bloom is in the background.' },
    { id: 'bellAnimation', title: 'Ringing bell', description: 'Active bells ring now and then.' },
    { id: 'habits', title: 'Habit reminders', description: 'Bells on habit cards.' },
    { id: 'routines', title: 'Routine reminders', description: 'Bells on routine cards.' },
    { id: 'quickDone', title: 'One-tap done', description: 'Mark a habit done from the reminder.' },
  ],
  adaptiveGoals: [
    { id: 'stretch', title: 'Gentle stretch', description: 'Aim 10% above your pace (off = match it).' },
    { id: 'badge', title: '“Adapted” badge', description: 'Label goals that changed.' },
    { id: 'longHistory', title: 'Six-week memory', description: 'Use 6 weeks of history instead of 3.' },
    { id: 'extraGoals', title: 'Extra goals', description: 'Tasks, intentions, routines, sessions, active days.' },
    { id: 'floor', title: 'Keep a floor', description: 'Never go below half the default target.' },
  ],
  celebrations: [
    { id: 'checkins', title: 'Check-in bursts', description: 'Coins when you complete a habit.' },
    { id: 'milestones', title: 'Milestone fountains', description: 'Big bursts for streak milestones.' },
    { id: 'routines', title: 'Routine finishes', description: 'Stars when a routine is complete.' },
    { id: 'shop', title: 'Shop purchases', description: 'Stars when you buy something.' },
    { id: 'release', title: 'Burn & release', description: 'Sparks from the campfire.' },
    { id: 'yearbook', title: 'Year book', description: 'Stars when your book is ready.' },
  ],
  burnRelease: [
    { id: 'daybookShortcut', title: 'Daybook shortcut', description: 'From Fear Setting and Shadow Work pages.' },
    { id: 'flick', title: 'Flick to release', description: 'Throw the card with momentum.' },
    { id: 'smoke', title: 'Smoke', description: 'The card turns to smoke.' },
    { id: 'count', title: 'Release counter', description: 'How many thoughts you let go.' },
    { id: 'handwriting', title: 'Handwritten card', description: 'A handwriting font on the card.' },
  ],
  garage: [
    { id: 'upgrades', title: 'Garage upgrades', description: 'Neon, turntable, chargers and more.' },
    { id: 'turntable', title: 'Turntable spin', description: 'Pad 1 rotates your car.' },
    { id: 'neon', title: 'Neon sign', description: 'Show the neon sign if owned.' },
    { id: 'spotlights', title: 'Spotlights', description: 'Show spotlights if owned.' },
    { id: 'plants', title: 'Plants', description: 'Show plants if owned.' },
    { id: 'chargers', title: 'Chargers', description: 'Show charging stations if owned.' },
  ],
  urgeClock: [
    { id: 'seconds', title: 'Seconds', description: 'Tick every second.' },
    { id: 'highScore', title: 'High score', description: 'Best streak and “New best”.' },
    { id: 'progress', title: 'Progress to best', description: 'Bar toward your best streak.' },
    { id: 'resisted', title: 'Urges resisted', description: 'Urges logged this run.' },
    { id: 'glow', title: 'Record glow', description: 'Gold border when you beat your best.' },
  ],
  focusRoom: [
    { id: 'soundtrack', title: 'Soundtrack', description: 'Classical and cinematic music.' },
    { id: 'avatar', title: 'Avatar at the desk', description: 'Your avatar works with you.' },
    { id: 'nightSky', title: 'Day and night', description: 'The window follows the time of day.' },
    { id: 'notes', title: 'Music notes', description: 'Floating notes while working.' },
    { id: 'progress', title: 'Progress bar', description: 'Session progress along the floor.' },
  ],
  timeCapsule: [
    { id: 'onThisDay', title: 'On this day', description: 'Entries from a week, month or year ago.' },
    { id: 'gratitude', title: 'Gratitude fallback', description: 'A jar note when nothing else matches.' },
    { id: 'shuffle', title: 'Shuffle', description: 'Pick another memory.' },
    { id: 'greeting', title: 'Morning greeting', description: '“Good morning, from the past.”' },
    { id: 'fullText', title: 'Full text', description: 'Show the whole memory, not a preview.' },
  ],
  thoughtDiff: [
    { id: 'counts', title: 'Change counts', description: 'How many words are new or faded.' },
    { id: 'autoOpen', title: 'Open automatically', description: 'Show the comparison when a page opens.' },
    { id: 'removed', title: 'Show faded words', description: 'Struck-through words you no longer use.' },
    { id: 'added', title: 'Highlight new words', description: 'Green highlight for new thoughts.' },
    { id: 'date', title: 'Comparison date', description: 'Which page you are comparing with.' },
  ],
  queryBuilder: [
    { id: 'presets', title: 'Example questions', description: 'One-tap starting points.' },
    { id: 'moodAverage', title: 'Mood average', description: 'Average mood of the matches.' },
    { id: 'groups', title: 'Nested groups', description: 'Groups inside groups.' },
    { id: 'habitField', title: 'Habit field', description: 'Filter by habits done that day.' },
    { id: 'tagsField', title: 'Tag field', description: 'Filter by tags and emotions.' },
    { id: 'dateField', title: 'Date field', description: 'Filter by date.' },
  ],
  yearbook: [
    { id: 'coverPreview', title: 'Cover preview', description: '3D book cover preview.' },
    { id: 'stats', title: 'Stats preview', description: 'The year in numbers before printing.' },
    { id: 'daybookChapter', title: 'Daybook chapter', description: 'Offer the Daybook chapter.' },
    { id: 'journalChapter', title: 'Reflections chapter', description: 'Offer the journal chapter.' },
    { id: 'gratitudeChapter', title: 'Good things chapter', description: 'Offer the gratitude chapter.' },
  ],
  memoryPalace: [
    { id: 'inertia', title: 'Drag and scroll', description: 'Spin the ring with momentum.' },
    { id: 'monthMarkers', title: 'Month markers', description: 'Glowing dots at each month.' },
    { id: 'moodColors', title: 'Mood colours', description: 'Colour days by mood.' },
    { id: 'fog', title: 'Fog', description: 'Depth fog around the ring.' },
    { id: 'keyboard', title: 'Keyboard navigation', description: 'Arrow keys move between days.' },
    { id: 'zoom', title: 'Zoom on click', description: 'Clicking a day zooms in.' },
  ],
  skillConstellation: [
    { id: 'starfield', title: 'Starfield', description: 'Background stars.' },
    { id: 'statBranches', title: 'Stat branches', description: 'Strength, intelligence and spirit stars.' },
    { id: 'pulse', title: 'Star pulse', description: 'Lit stars gently pulse.' },
    { id: 'links', title: 'Constellation lines', description: 'Lines between stars.' },
    { id: 'flyTo', title: 'Camera flight', description: 'Fly to the star you click.' },
  ],
  streakJourney: [
    { id: 'monuments', title: 'Monuments', description: 'A monument every 7 days.' },
    { id: 'quotes', title: 'Journal quotes', description: 'What you wrote along the way.' },
    { id: 'trees', title: 'Trees', description: 'Trees along the path.' },
    { id: 'fog', title: 'Fog', description: 'Distance fog.' },
    { id: 'highlight', title: 'Active day highlight', description: 'Highlight the day in view.' },
  ],
  moodOrb: [
    { id: 'liquid', title: 'Liquid motion', description: 'The surface moves continuously.' },
    { id: 'colorShift', title: 'Colour shift', description: 'Colour follows your mood.' },
    { id: 'gloss', title: 'Glass shine', description: 'Specular highlights.' },
    { id: 'label', title: 'Mood label', description: 'Anxious … Calm label.' },
    { id: 'autoMood', title: 'Set mood from orb', description: 'The orb picks your 1–5 mood.' },
  ],
  placesMap: [
    { id: 'heat', title: 'Heat halos', description: 'Soft halos sized by visits.' },
    { id: 'offlineTiles', title: 'Offline map tiles', description: 'Cache tiles for offline use.' },
    { id: 'moodCapture', title: 'Save with mood check-ins', description: 'Location on each mood check-in.' },
    { id: 'daybookCapture', title: 'Save with Daybook pages', description: 'Location when a page is completed.' },
    { id: 'naming', title: 'Name places', description: 'Give places names.' },
    { id: 'insight', title: '“You feel best at…”', description: 'Your happiest place.' },
  ],
  urgeTracker: [
    { id: 'patterns', title: 'Patterns view', description: 'When and where urges happen.' },
    { id: 'context', title: 'Context capture', description: 'Time of day and session info.' },
    { id: 'intensity', title: 'Intensity step', description: 'Rate how strong the urge was.' },
    { id: 'manage', title: 'Manage habits', description: 'Add or archive urge habits.' },
    { id: 'contextCard', title: 'Context card', description: 'Explains what is captured.' },
  ],
  habitTracker: [
    { id: 'library', title: 'Habit & routine library', description: 'Adopt ready-made cards.' },
    { id: 'routines', title: 'Routines', description: 'Timed step-by-step routines.' },
    { id: 'grid', title: 'Contribution grid', description: 'History heatmap on each habit.' },
    { id: 'streak', title: 'Streak footer', description: 'Current and best streak.' },
    { id: 'edit', title: 'Edit and delete', description: 'Actions on each card.' },
  ],
  chatJournal: [
    { id: 'quickEntry', title: 'Quick entry', description: 'Short journal entries with tags.' },
    { id: 'promptChips', title: 'Prompt chips', description: 'Suggested answers to get started.' },
    { id: 'ratings', title: 'Mood & energy ratings', description: 'Rate mood and energy.' },
    { id: 'modeSwitch', title: 'Mode switch', description: 'Choose quick or guided.' },
    { id: 'stepCounter', title: 'Step counter', description: 'Where you are in the guided flow.' },
  ],
  rpgSkillTree: [
    { id: 'weeklyGoals', title: 'Weekly goals', description: 'Goal cards on the Growth panel.' },
    { id: 'notices', title: 'Reward notices', description: 'Pop-ups for XP and level-ups.' },
    { id: 'levelBar', title: 'Level bar', description: 'XP progress to the next level.' },
    { id: 'sound', title: 'Sound toggle', description: 'Turn reward sounds on or off.' },
    { id: 'skillsLink', title: 'Explore skills link', description: 'Shortcut to the skill tree.' },
  ],
  weeklyRaidBoss: [
    { id: 'hp', title: 'Boss health bar', description: 'Show the raid boss HP.' },
    { id: 'damage', title: 'Damage labels', description: 'Show how much each action hits.' },
    { id: 'bossMark', title: 'Boss emblem', description: 'The crown emblem.' },
    { id: 'levelTag', title: 'Boss level', description: 'The boss level tag.' },
    { id: 'attackNote', title: 'Attack feedback', description: 'Message after an attack.' },
  ],
  daybookModes: [
    { id: 'autosave', title: 'Autosave', description: 'Save pages as you type.' },
    { id: 'focusWriting', title: 'Focus writing', description: 'Hide everything but the page.' },
    { id: 'pages', title: 'Your pages slider', description: 'Recent pages on the Daybook home.' },
    { id: 'wordCount', title: 'Word count', description: 'Live word count.' },
    { id: 'extraTools', title: 'Extra formatting', description: 'Highlight, code, quote and divider.' },
    { id: 'search', title: 'Page search', description: 'Search pages by meaning.' },
    { id: 'ambient', title: 'Breathing glow', description: 'Calm animation on reflection pages.' },
  ],
  languageSelector: [
    { id: 'dialects', title: 'Fun dialects', description: 'Pirate and slang English.' },
    { id: 'french', title: 'French', description: 'Français.' },
    { id: 'icon', title: 'Language icon', description: 'Icon on the picker.' },
    { id: 'nativeNames', title: 'Native names', description: '“Français” instead of “French”.' },
  ],
  walkthroughTour: [
    { id: 'wizard', title: 'Pixel wizard narrator', description: 'The wizard in guide pop-ups.' },
    { id: 'reveal', title: 'Animated text', description: 'Words reveal one by one.' },
    { id: 'progress', title: 'Step progress', description: '“2 / 5” in guides.' },
    { id: 'back', title: 'Back button', description: 'Go to the previous step.' },
    { id: 'dim', title: 'Dim the page', description: 'Darken everything but the highlight.' },
  ],
  timeSince: [
    { id: 'splitFlap', title: 'Split-flap digits', description: 'Train-station flip animation.' },
    { id: 'countdowns', title: 'Countdowns', description: 'Count down to future events.' },
    { id: 'urgeLink', title: 'Urge clocks on dashboard', description: 'Time since your last slip.' },
    { id: 'withBloom', title: '“With Bloom” counter', description: 'Time since you started.' },
    { id: 'units', title: 'Unit labels', description: 'DAYS / HRS / MIN / SEC.' },
    { id: 'custom', title: 'Your own counters', description: 'Add counters of your own.' },
  ],
  drawnAchievements: [
    { id: 'skills', title: 'Skill unlocks', description: 'Drawn illustration when a skill unlocks.' },
    { id: 'levels', title: 'Level-ups', description: 'Drawn illustration on each new level.' },
    { id: 'streaks', title: 'Streak milestones', description: 'Drawn tree at 7/30/100-day streaks.' },
    { id: 'fill', title: 'Colour fill', description: 'Colour floods in after the drawing.' },
    { id: 'autoClose', title: 'Close by itself', description: 'Disappears after a few seconds.' },
  ],
  flowTopography: [
    { id: 'live', title: 'Live mountain', description: 'Your flow range grows as you type.' },
    { id: 'save', title: 'Save fingerprint', description: 'Keep the range with the page.' },
    { id: 'fingerprint', title: 'Show on open', description: 'The saved range at the top of the page.' },
    { id: 'thumbnails', title: 'Page thumbnails', description: 'Tiny ranges on “Your pages” cards.' },
    { id: 'ravines', title: 'Ravines', description: 'Backspacing carves jagged ravines.' },
    { id: 'stats', title: 'WPM and flow %', description: 'Typing speed and time in flow.' },
  ],
  postureGuard: [
    { id: 'warnings', title: 'Slouch warnings', description: 'A warning after 5 minutes of slouching.' },
    { id: 'poison', title: 'Poison damage', description: 'Ignored warnings cost HP.' },
    { id: 'stamina', title: 'Stamina buff', description: 'Good posture restores HP.' },
    { id: 'preview', title: 'Camera preview', description: 'See yourself on the posture page.' },
    { id: 'skeleton', title: 'Pose skeleton', description: 'Lines over shoulders and neck.' },
    { id: 'tuning', title: 'Tuning controls', description: 'Timing, sensitivity and damage.' },
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
