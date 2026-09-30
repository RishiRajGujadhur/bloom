import { VT_KEY } from '../platform/viewTransition'

/**
 * Comfort preferences, applied to <html> before first paint so pages never
 * jump: text size, reading line height, density, page width, whether page
 * scenes animate, view transitions, and whether guided sessions keep the
 * screen on or pause when you step away.
 */
export type Comfort = {
  textScale: number
  lineHeight: number
  density: 'comfortable' | 'compact'
  width: 'narrow' | 'standard' | 'wide'
  scenes: boolean
  transitions: boolean
  keepAwake: boolean
  pauseWhenAway: boolean
}
export const COMFORT_KEY = 'bloom-comfort'
export const defaultComfort: Comfort = { textScale: 100, lineHeight: 1.55, density: 'comfortable', width: 'standard', scenes: true, transitions: true, keepAwake: true, pauseWhenAway: true }

export function readComfort(): Comfort {
  try { return { ...defaultComfort, ...(JSON.parse(localStorage.getItem(COMFORT_KEY) ?? '{}') as Partial<Comfort>) } } catch { return defaultComfort }
}

export function applyComfort(c: Comfort = readComfort()) {
  const r = document.documentElement
  r.style.fontSize = c.textScale === 100 ? '' : `${c.textScale}%`
  r.style.setProperty('--reading-line-height', String(c.lineHeight))
  r.dataset.density = c.density
  r.dataset.pageWidth = c.width
  r.dataset.scenes = c.scenes ? 'on' : 'off'
  try {
    localStorage.setItem(VT_KEY, c.transitions ? 'on' : 'off')
    localStorage.setItem('bloom-focus-away', JSON.stringify(c.pauseWhenAway))
  } catch { /* optional */ }
}

export function saveComfort(c: Comfort) {
  try { localStorage.setItem(COMFORT_KEY, JSON.stringify(c)) } catch { /* optional */ }
  applyComfort(c)
}

export const keepAwakeAllowed = () => readComfort().keepAwake
