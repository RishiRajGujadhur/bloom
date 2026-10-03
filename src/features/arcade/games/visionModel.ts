export const VISION_WIDTH = 800
export const VISION_HEIGHT = 600
export type VisionPoint = { x: number; y: number }
export const COLOURS = [{ name: 'Rose', fill: '#fb7185' }, { name: 'Sky', fill: '#38bdf8' }, { name: 'Mint', fill: '#34d399' }] as const
export type BubbleKind = 'colour' | 'pollen' | 'freeze' | 'prism' | 'thorn'
export type GardenMode = 'colour' | 'order' | 'zen'
export type VisionBubble = VisionPoint & { id: number; radius: number; colour: number; speed: number; phase: number; kind?: BubbleKind; bornAt?: number }
export type GardenState = {
  mode: GardenMode; bubbles: VisionBubble[]; score: number; hits: number; elapsed: number
  target: number; combo: number; maxCombo: number; lastMatch: number; freeze: number
  sequence: number[]; orderStep: number; orders: number; nextId: number; spawn: number
  message: string; finished: boolean
}
export const ROUND_SECONDS = 90
export const STREAK_SECONDS = 6
export const PAUSE_RECT = { x: 620, y: 18, width: 160, height: 80 }

/** Mirror the camera without cropping so preview, landmarks and targets align. */
export function handPoints(hands: VisionPoint[][]): VisionPoint[] {
  return hands.flatMap((hand) => [4, 8, 12, 16, 20, 9].flatMap((i) => {
    const p = hand[i]
    return p ? [{ x: (1 - p.x) * VISION_WIDTH, y: p.y * VISION_HEIGHT }] : []
  }))
}

export function touchesBubble(points: VisionPoint[], bubble: VisionBubble) {
  return points.some((p) => Math.hypot(p.x - bubble.x, p.y - bubble.y) <= bubble.radius + 22)
}

export function overPause(points: VisionPoint[]) {
  return points.some((p) => p.x >= PAUSE_RECT.x && p.x <= PAUSE_RECT.x + PAUSE_RECT.width && p.y >= PAUSE_RECT.y && p.y <= PAUSE_RECT.y + PAUSE_RECT.height)
}
export type HoverState = { progress: number; latched: boolean; away: number }
export function hoverPause(state: HoverState, inside: boolean, dt: number) {
  if (!inside) {
    const away = state.away + dt
    return { state: { progress: 0, latched: state.latched && away < .4, away }, toggle: false }
  }
  if (state.latched) return { state: { ...state, away: 0 }, toggle: false }
  const progress = Math.min(1, state.progress + dt / .9)
  return { state: { progress, latched: progress >= 1, away: 0 }, toggle: progress >= 1 }
}
export const multiplier = (combo: number) => Math.min(4, 1 + Math.floor(Math.max(0, combo - 1) / 4))
export function newGarden(mode: GardenMode): GardenState {
  return { mode, bubbles: [], score: 0, hits: 0, elapsed: 0, target: 0, combo: 0, maxCombo: 0, lastMatch: -Infinity, freeze: 0, sequence: [0, 2, 1], orderStep: 0, orders: 0, nextId: 0, spawn: 0, message: 'Reach for the matching colour. Take your time.', finished: false }
}
function match(s: GardenState) {
  s.combo = s.elapsed - s.lastMatch <= STREAK_SECONDS ? s.combo + 1 : 1
  s.maxCombo = Math.max(s.maxCombo, s.combo)
  s.lastMatch = s.elapsed
  const earned = 35 * multiplier(s.combo)
  s.score += earned; s.hits++
  s.message = `Lovely reach! +${earned}`
  if (s.mode === 'order') {
    s.orderStep++
    if (s.orderStep === s.sequence.length) {
      s.orders++; s.orderStep = 0; s.score += 105
      s.sequence = [s.orders % 3, (s.orders + 2) % 3, (s.orders + 1) % 3]
      s.message = 'Garden order complete! +105 bonus. A new order is ready.'
    }
    s.target = s.sequence[s.orderStep]
  } else s.target = Math.floor(s.hits / 5) % 3
}
/** Paused/tracking-lost frames never enter the simulation. */
export function gardenTick(previous: GardenState, dt: number, points: VisionPoint[], random = Math.random): { state: GardenState; popped: VisionBubble[] } {
  if (previous.finished) return { state: previous, popped: [] }
  const s = { ...previous, bubbles: previous.bubbles.map((b) => ({ ...b })) }
  s.elapsed += dt; s.freeze = Math.max(0, s.freeze - dt); s.spawn -= dt
  if (s.combo && s.elapsed - s.lastMatch > STREAK_SECONDS) s.combo = 0
  if (s.spawn <= 0 && s.bubbles.length < 7) {
    const id = ++s.nextId
    let kind: BubbleKind = id % 13 === 0 ? 'thorn' : id % 11 === 0 ? 'prism' : id % 9 === 0 ? 'freeze' : id % 6 === 0 ? 'pollen' : 'colour'
    if (s.mode === 'zen' && kind === 'thorn') kind = 'prism'
    let x = 150 + random() * 500, clearance = -1
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = 150 + random() * 500
      const gap = s.bubbles.reduce((nearest, b) => Math.min(nearest, Math.hypot(candidate - b.x, 500 - b.y)), Infinity)
      if (gap > clearance) { clearance = gap; x = candidate }
    }
    // Fully visible, larger bubbles in a comfortable central reach zone.
    s.bubbles.push({ id, kind, x, y: 500, radius: kind === 'thorn' ? 34 : 48, colour: id % 2 ? s.target : Math.floor(random() * 3), speed: 23, phase: random() * Math.PI * 2, bornAt: s.elapsed })
    s.spawn = 1.3
  }
  for (const b of s.bubbles) {
    const slow = s.freeze > 0 ? .25 : 1
    b.y -= dt * b.speed * slow
    b.x = Math.max(120, Math.min(680, b.x + Math.sin(s.elapsed + b.phase) * dt * 9 * slow))
  }
  const removed = new Set<number>(), popped: VisionBubble[] = []
  const pop = (b: VisionBubble) => { removed.add(b.id); popped.push(b) }
  for (const b of s.bubbles) {
    if (removed.has(b.id) || (b.bornAt !== undefined && s.elapsed - b.bornAt < .6) || !touchesBubble(points, b)) continue
    const kind = b.kind ?? 'colour'
    if (kind === 'thorn') {
      pop(b); s.score = Math.max(0, s.score - 35); s.combo = 0; s.lastMatch = -Infinity
      s.message = 'A thorn! −35. A fresh streak starts with your next match.'
    } else if (kind === 'freeze') {
      pop(b); s.freeze = 8; s.message = 'Time Freeze! Bubbles drift slowly for 8 seconds.'
    } else if (kind === 'pollen') {
      pop(b)
      const wanted = s.target
      const nearby = s.bubbles.filter((other) => !removed.has(other.id) && (other.kind === 'prism' || ((other.kind ?? 'colour') === 'colour' && other.colour === wanted)) && Math.hypot(other.x - b.x, other.y - b.y) <= 230)
      let count = 0
      for (const other of nearby) {
        if (s.mode === 'order' && other.kind !== 'prism' && other.colour !== s.target) continue
        pop(other); match(s); count++
      }
      s.message = `Pollen Storm! ${count} nearby matching ${count === 1 ? 'bubble' : 'bubbles'} bloomed.`
    } else if (kind === 'prism' || b.colour === s.target) { pop(b); match(s) }
    // Brushing a nonmatching colour carries no penalty.
  }
  const missed = s.bubbles.some((b) => !removed.has(b.id) && b.y < 115 && (b.kind ?? 'colour') === 'colour' && b.colour === s.target)
  if (missed && s.mode !== 'zen') { s.combo = 0; s.lastMatch = -Infinity; s.message = 'A matching bubble drifted away. Your score is safe; start a new streak.' }
  s.bubbles = s.bubbles.filter((b) => b.y >= 115 && !removed.has(b.id))
  s.finished = s.mode !== 'zen' && s.elapsed >= ROUND_SECONDS
  return { state: s, popped }
}
