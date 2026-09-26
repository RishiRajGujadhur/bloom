export const BEADS = 108
export const mantras = [
  { id: 'om', text: 'Om', meaning: 'The sound of everything' },
  { id: 'shanti', text: 'Om Shanti', meaning: 'Peace' },
  { id: 'mani', text: 'Om Mani Padme Hum', meaning: 'The jewel in the lotus: compassion' },
  { id: 'soham', text: 'So Hum', meaning: 'I am that' },
  { id: 'kind', text: 'May I be kind to myself', meaning: 'Self-compassion' },
  { id: 'here', text: 'I am here, now', meaning: 'Presence' },
  { id: 'enough', text: 'I am enough', meaning: 'Worth' },
]
export const themes = {
  sandalwood: { bead: '#c98b5b', guru: '#8a4b2b', thread: '#e27396', bg: ['#fdf1e3', '#f5dcc2'] },
  rose: { bead: '#e7a0b0', guru: '#b24a6f', thread: '#f2c14e', bg: ['#fdeff3', '#f5d3de'] },
  jade: { bead: '#6bbf9a', guru: '#2f7a5c', thread: '#f2c14e', bg: ['#eaf7f0', '#cdebdc'] },
  lapis: { bead: '#3f5fb5', guru: '#f2c14e', thread: '#e8e2d9', bg: ['#e8ecfa', '#c9d3f2'] },
} as const
export type ThemeId = keyof typeof themes

export type MalaStore = { mantra: string; custom: string[]; theme: ThemeId; target: number; pace: number; log: { at: number; count: number; mantra: string }[] }
export const MALA_KEY = 'bloom-mala-v1'

/** Quarter milestones get a bell. */
export const isQuarter = (n: number, total = BEADS) => n > 0 && n % (total / 4) === 0
export const roundsOf = (count: number) => Math.floor(count / BEADS)
export const beadOf = (count: number) => count % BEADS
