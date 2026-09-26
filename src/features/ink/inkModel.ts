import { getStroke } from 'perfect-freehand'

export type Tool = 'pen' | 'marker' | 'eraser'
export type Stroke = { id: string; tool: Tool; color: string; size: number; points: [number, number, number][]; t0: number }
export type Page = { id: string; date: string; paper: Paper; strokes: Stroke[]; prompt?: string }
export type Paper = 'blank' | 'lined' | 'dotted' | 'grid'
export const INK_KEY = 'bloom-ink-v1'

export const colors = ['#2b2230', '#3f6fb5', '#c2410c', '#3f8a5a', '#8f7ae5', '#e27396']

/** Freehand outline → SVG path (quadratic smoothing between points). */
export function pathFor(s: Pick<Stroke, 'points' | 'size' | 'tool'>, last = true) {
  const outline = getStroke(s.points, {
    size: s.tool === 'marker' ? s.size * 3 : s.size,
    thinning: s.tool === 'marker' ? 0 : 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: s.points.every((p) => p[2] === 0.5),
    last,
  })
  if (!outline.length) return ''
  const d = outline.reduce<(string | number)[]>(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...outline[0], 'Q'],
  )
  return `${d.join(' ')} Z`
}

/** Strokes whose points pass within `r` of (x, y) — the eraser removes these. */
export function hit(strokes: Stroke[], x: number, y: number, r = 12) {
  return strokes.filter((s) => s.points.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= r * r)).map((s) => s.id)
}

export const prompts = [
  'Draw how today felt.',
  'Three things you’re grateful for, in pictures.',
  'Map what’s on your mind.',
  'Sketch your ideal morning.',
  'Write one kind sentence to yourself.',
  'Doodle while you breathe for a minute.',
  'What would you tell your younger self?',
]
export const promptFor = (date: string) => prompts[Math.abs([...date].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % prompts.length]

/** Undo/redo stack helpers. */
export type History = { past: Stroke[][]; future: Stroke[][] }
export const push = (h: History, before: Stroke[]): History => ({ past: [...h.past, before].slice(-100), future: [] })
export function undo(h: History, now: Stroke[]) {
  if (!h.past.length) return null
  return { strokes: h.past[h.past.length - 1], history: { past: h.past.slice(0, -1), future: [now, ...h.future] } }
}
export function redo(h: History, now: Stroke[]) {
  if (!h.future.length) return null
  return { strokes: h.future[0], history: { past: [...h.past, now], future: h.future.slice(1) } }
}
