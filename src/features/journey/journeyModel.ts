import { previousDay } from '../../dates'

export type JourneyStep = { date: string; index: number; milestone: boolean }

/**
 * The longest run of consecutive days for a habit (the current run when it is
 * also the longest). Steps are oldest first; every 7th day is a milestone.
 */
export function journeySteps(dates: string[], today: string): JourneyStep[] {
  const done = new Set(dates.filter((d) => d <= today))
  const sorted = [...done].sort()
  let best: string[] = []
  let run: string[] = []
  for (const day of sorted) {
    run = run.length && previousDay(day) === run[run.length - 1] ? [...run, day] : [day]
    if (run.length >= best.length) best = run
  }
  return best.map((date, index) => ({ date, index, milestone: (index + 1) % 7 === 0 }))
}

/** Winding path points (x, y, z) — one per step — for a CatmullRom curve. */
export function pathPoints(count: number): [number, number, number][] {
  const n = Math.max(count, 2)
  return Array.from({ length: n }, (_, i) => [
    Math.sin(i * 0.55) * 4 + Math.sin(i * 0.17) * 2,
    Math.sin(i * 0.3) * 0.6,
    -i * 3,
  ])
}
