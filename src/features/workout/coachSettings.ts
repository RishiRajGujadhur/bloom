export const COACH_OPTIONS = {
  efficiency: 'Work and rest efficiency', consistency: 'Power consistency', degradation: 'Output decline alerts', stability: 'Upper-body stability proxy',
  autoFrame: 'Digital auto-framing',
  muscles: 'Muscle group guide',
  reference: 'Master reference view', angles: 'Joint-angle callouts', energy: 'Energy estimates',
  trails: 'Strike trajectory trails', snap: 'Strike deceleration', rhythm: 'Combo rhythm',
  flow: 'Tai Chi smoothness', guard: 'Boxing guard feedback', technique: 'Hand / block guidance',
  reaction: 'Reaction-time drills', rpg: 'RPG damage', fatigue: 'Limb workload gauges',
  breathing: 'Breathing ring', ghost: 'Personal-best ghost', xp: 'Perfect-form XP',
  routing: 'Recovery suggestions', contrast: 'High-contrast skeleton', replay: 'Rep replay',
  autoPause: 'Pause when out of frame', dimming: 'Dim room background', battery: 'Battery saver',
  haptics: 'Silent wearable alerts', history: 'Performance history', routine: 'Routine chaining',
} as const
export type CoachOptions = Record<keyof typeof COACH_OPTIONS, boolean>
export const defaultOptions: CoachOptions = Object.fromEntries(Object.keys(COACH_OPTIONS).map(key => [key, !['autoFrame', 'reaction', 'rpg', 'ghost', 'dimming', 'battery', 'haptics', 'routine'].includes(key)])) as CoachOptions
export function loadCoachOptions(): CoachOptions {
  try {
    const value = JSON.parse(localStorage.getItem('bloom-coach-settings-v1') ?? '{}')
    return Object.fromEntries(Object.entries(defaultOptions).map(([key, fallback]) => [key, typeof value?.[key] === 'boolean' ? value[key] : fallback])) as CoachOptions
  } catch { return { ...defaultOptions } }
}
