import { loadSettings } from '../../SettingsPage'
import { subOn } from '../../features/subFeatures'

/**
 * "Juicy" completion feedback: pixel coins and stars burst from the element
 * you just completed. Loaded on demand, skipped under reduced motion or when
 * Celebrations is switched off in Settings.
 */
type Origin = HTMLElement | { x: number; y: number } | null | undefined
type Confetti = typeof import('canvas-confetti')

let confettiModule: Promise<Confetti> | null = null
const load = () =>
  (confettiModule ??= import('canvas-confetti').then((m) => (m.default ?? m) as Confetti))

let shapes: ReturnType<Confetti['shapeFromPath']>[] | null = null
function pixelShapes(confetti: Confetti) {
  if (!shapes) {
    shapes = [
      // A chunky 8-bit coin (octagon) and a pixel star.
      confetti.shapeFromPath({ path: 'M3 0h6l3 3v6l-3 3H3L0 9V3z' }),
      confetti.shapeFromPath({ path: 'M5 0h2v4h4v2H7v4H5V6H1V4h4z' }),
    ]
  }
  return shapes
}

const enabled = () => {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return loadSettings().features.celebrations !== false
  } catch {
    return true
  }
}

function origin(from: Origin) {
  if (!from) return { x: 0.5, y: 0.45 }
  const point =
    from instanceof HTMLElement
      ? (() => {
          const r = from.getBoundingClientRect()
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        })()
      : from
  return { x: point.x / window.innerWidth, y: point.y / window.innerHeight }
}

const gold = ['#ffcf40', '#f2a900', '#fff1a8', '#e8743b']
const stars = ['#ffffff', '#fff6a8', '#9fd6ff', '#ffb3d1']

/** A small localized burst, e.g. for a habit check-in. */
export type BurstSource = 'checkins' | 'routines' | 'shop' | 'release' | 'yearbook'
export function burst(from?: Origin, kind: 'coins' | 'stars' = 'coins', source: BurstSource = 'checkins') {
  if (!enabled() || !subOn('celebrations', source)) return
  void load().then((confetti) => {
    const [coin, star] = pixelShapes(confetti)
    confetti({
      origin: origin(from),
      particleCount: 26,
      spread: 70,
      startVelocity: 26,
      gravity: 1.1,
      ticks: 90,
      scalar: 0.9,
      shapes: [kind === 'coins' ? coin : star],
      colors: kind === 'coins' ? gold : stars,
      disableForReducedMotion: true,
      zIndex: 9999,
    })
  }).catch(() => {
    /* No canvas (tests, locked-down browsers): skip the flourish. */
  })
}

/** A big gold fountain for milestones (e.g. a 30-day streak). */
export function fountain() {
  if (!enabled() || !subOn('celebrations', 'milestones')) return
  void load().then((confetti) => {
    const [coin, star] = pixelShapes(confetti)
    const end = Date.now() + 1200
    const frame = () => {
      for (const x of [0.15, 0.85])
        confetti({
          origin: { x, y: 0.9 },
          angle: x < 0.5 ? 65 : 115,
          particleCount: 6,
          spread: 40,
          startVelocity: 55,
          shapes: [coin, star],
          colors: [...gold, ...stars],
          scalar: 1.1,
          disableForReducedMotion: true,
          zIndex: 9999,
        })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }).catch(() => {
    /* No canvas: skip the flourish. */
  })
}

/** True when a streak length deserves the big fountain. */
export const isMilestoneStreak = (days: number) =>
  days > 0 && (days % 30 === 0 || days === 7 || days === 100 || days === 365)

/** Streak lengths that also earn a drawn illustration. */
const drawnStreaks = new Set([7, 30, 100, 365])
export function streakMilestone(days: number, habit: string) {
  if (!isMilestoneStreak(days)) return
  fountain()
  if (drawnStreaks.has(days))
    void import('../../features/achievements/DrawnAchievement').then(({ announceAchievement }) =>
      announceAchievement({
        kind: 'streaks',
        title: `${days}-day streak`,
        subtitle: `${habit}: your roots are growing deep.`,
      }),
    )
}
