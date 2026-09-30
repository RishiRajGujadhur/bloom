import workletUrl from './sceneWorklet.ts?worker&url'

/**
 * Registers the Houdini paint worklet and the animatable `--scene-t`
 * property once, and maps every page to its own generative scene: a style
 * that fits the page, plus a seed from the page's name so no two pages share
 * the same composition.
 */
export function initHoudini() {
  const css = CSS as unknown as { paintWorklet?: { addModule: (u: string) => Promise<void> }; registerProperty?: (o: object) => void }
  if (!css.paintWorklet) return
  try { css.registerProperty?.({ name: '--scene-t', syntax: '<number>', inherits: false, initialValue: '0' }) } catch { /* already registered (hot reload) */ }
  void css.paintWorklet.addModule(workletUrl).then(() => { document.documentElement.dataset.houdini = 'on' }).catch(() => {})
}

export type SceneKind = 'rays' | 'waves' | 'stars' | 'topo' | 'pulse' | 'grid' | 'bubbles' | 'petals' | 'leaves' | 'notes' | 'hex' | 'rain'

const BY_PAGE: Record<string, SceneKind> = {
  overview: 'rays', planning: 'rays', todos: 'grid', calendar: 'grid', focus: 'rays', 'focus-room': 'rain', routines: 'rays', briefing: 'waves',
  habits: 'leaves', challenges: 'hex', growth: 'leaves', journey: 'topo', urges: 'waves', world: 'stars', shop: 'bubbles', collectibles: 'hex', diet: 'leaves', scan: 'grid', fasting: 'rays', roadmap: 'topo', money: 'bubbles', joys: 'petals', people: 'petals',
  english: 'rain', code: 'grid', cards: 'hex', games: 'hex', palace: 'stars', mindmaps: 'stars', chess: 'grid', typing: 'grid', piano: 'notes', tuner: 'notes', sign: 'petals', globe: 'topo', cpr: 'pulse', reader: 'rain',
  journal: 'rain', daybook: 'rain', breathe: 'waves', mood: 'petals', gratitude: 'petals', sleep: 'stars', release: 'bubbles', posture: 'pulse', epiphanies: 'stars', monk: 'waves', voice: 'waves', taichi: 'waves', sounds: 'notes', mixer: 'notes', meditate: 'waves', breathwork: 'waves', mala: 'bubbles', ink: 'rain', mirror: 'petals', screen: 'grid', affirm: 'rays',
  exercises: 'pulse', workouts: 'pulse', intervals: 'pulse', yoga: 'waves', stretch: 'pulse', run: 'topo', body: 'pulse', eyes: 'bubbles', daylight: 'rays', dojo: 'pulse', readiness: 'pulse',
  'vision-board': 'stars', explore: 'topo', places: 'topo', yearbook: 'petals', energy: 'pulse', lab: 'hex', pointer: 'grid', street: 'rays', weeks: 'hex', sky: 'stars', decide: 'hex', 'code-city': 'grid',
  settings: 'hex',
}
const FALLBACK: SceneKind[] = ['waves', 'stars', 'topo', 'petals', 'rays', 'hex']

export function sceneFor(page: string): { kind: SceneKind; seed: number } {
  let h = 2166136261
  for (let i = 0; i < page.length; i++) h = Math.imul(h ^ page.charCodeAt(i), 16777619)
  const seed = (h >>> 0) % 9973 + 1
  return { kind: BY_PAGE[page] ?? FALLBACK[seed % FALLBACK.length], seed }
}
