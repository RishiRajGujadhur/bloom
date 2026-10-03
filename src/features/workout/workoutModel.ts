import type { Muscle } from '../exercise/exercises'

export type Lift = { id: string; name: string; muscles: Muscle[]; bodyweight?: boolean; step: number }
export const lifts: Lift[] = [
  { id: 'bench', name: 'Bench press', muscles: ['chest', 'triceps', 'shoulders'], step: 2.5 },
  { id: 'squat', name: 'Back squat', muscles: ['quads', 'glutes', 'hamstrings'], step: 2.5 },
  { id: 'deadlift', name: 'Deadlift', muscles: ['hamstrings', 'glutes', 'back'], step: 2.5 },
  { id: 'press', name: 'Overhead press', muscles: ['shoulders', 'triceps'], step: 2.5 },
  { id: 'row', name: 'Barbell row', muscles: ['back', 'biceps'], step: 2.5 },
  { id: 'pullup', name: 'Pull-up', muscles: ['back', 'biceps'], bodyweight: true, step: 2.5 },
  { id: 'dip', name: 'Dip', muscles: ['triceps', 'chest'], bodyweight: true, step: 2.5 },
  { id: 'pushup', name: 'Push-up', muscles: ['chest', 'triceps'], bodyweight: true, step: 2.5 },
  { id: 'airsquat', name: 'Air squat', muscles: ['quads', 'glutes'], bodyweight: true, step: 2.5 },
  { id: 'lunge', name: 'Lunge', muscles: ['quads', 'glutes'], step: 2 },
  { id: 'rdl', name: 'Romanian deadlift', muscles: ['hamstrings', 'glutes'], step: 2.5 },
  { id: 'curl', name: 'Biceps curl', muscles: ['biceps', 'forearms'], step: 1 },
  { id: 'extension', name: 'Triceps extension', muscles: ['triceps'], step: 1 },
  { id: 'hipthrust', name: 'Hip thrust', muscles: ['glutes', 'hamstrings'], step: 2.5 },
  { id: 'calf', name: 'Calf raise', muscles: ['calves'], step: 2.5 },
  { id: 'plank', name: 'Plank (seconds)', muscles: ['abs'], bodyweight: true, step: 5 },
  { id: 'seatedtwist', name: 'Seated Core Twist', muscles: ['obliques', 'abs'], step: 1 },
  { id: 'wheelchairdip', name: 'Wheelchair Dips', muscles: ['triceps', 'shoulders'], step: 1 },
  { id: 'chairpushup', name: 'Chair Push-up', muscles: ['triceps', 'chest'], step: 1 },
  { id: 'taichiflow', name: 'Tai Chi (Flow)', muscles: ['shoulders', 'forearms', 'abs'], step: 1 },
  { id: 'seatedboxing', name: 'Boxing (Jab-Cross)', muscles: ['shoulders', 'triceps', 'abs'], step: 1 },
  { id: 'seatedkarate', name: 'Karate (Blocks)', muscles: ['shoulders', 'forearms'], step: 1 },
  { id: 'seatedkungfu', name: 'Kung Fu (Hand Form)', muscles: ['shoulders', 'forearms'], step: 1 },
]
export const liftById = (id: string) => lifts.find((l) => l.id === id)

export const templates = [
  { id: 'push', name: 'Push', emoji: '💪', lifts: ['bench', 'press', 'dip', 'extension'] },
  { id: 'pull', name: 'Pull', emoji: '🏋️', lifts: ['deadlift', 'row', 'pullup', 'curl'] },
  { id: 'legs', name: 'Legs', emoji: '🦵', lifts: ['squat', 'rdl', 'lunge', 'calf'] },
  { id: 'full', name: 'Full body', emoji: '⚡', lifts: ['squat', 'bench', 'row', 'plank'] },
  { id: 'home', name: 'Home, no kit', emoji: '🏠', lifts: ['pushup', 'lunge', 'hipthrust', 'plank'] },
]

export type WSet = { liftId: string; weight: number; reps: number; seconds?: number; rpe?: number; at: number }
export type Workout = { id: string; name: string; templateId: string; startedAt: number; finishedAt?: number; sets: WSet[]; note?: string }
export type WorkoutStore = { workouts: Workout[]; rest: number; bodyweight: number }
export const WORKOUT_KEY = 'bloom-workouts-v1'

/** Epley estimate of a one-rep max. */
export const e1rm = (weight: number, reps: number) => (reps <= 1 ? weight : Math.round(weight * (1 + reps / 30) * 10) / 10)

export const load = (s: WSet, bodyweight = 0) => (liftById(s.liftId)?.bodyweight ? bodyweight + s.weight : s.weight)

export function volume(sets: WSet[], bodyweight = 0) {
  return Math.round(sets.reduce((t, s) => t + (s.seconds === undefined ? load(s, bodyweight) * s.reps : 0), 0))
}

/** Personal records a new set would set, compared with all previous sets. */
export function prsFor(set: WSet, history: WSet[], bodyweight = 0) {
  if (set.seconds !== undefined) return []
  const prior = history.filter((s) => s.liftId === set.liftId && s.at < set.at)
  const out: ('e1rm' | 'weight' | 'reps')[] = []
  if (!prior.length) return out
  const w = load(set, bodyweight)
  if (e1rm(w, set.reps) > Math.max(...prior.map((s) => e1rm(load(s, bodyweight), s.reps)))) out.push('e1rm')
  if (w > Math.max(...prior.map((s) => load(s, bodyweight)))) out.push('weight')
  const sameWeight = prior.filter((s) => load(s, bodyweight) === w)
  if (sameWeight.length && set.reps > Math.max(...sameWeight.map((s) => s.reps))) out.push('reps')
  return out
}

/** Best estimated 1RM per workout for one lift, oldest first. */
export function progress(workouts: Workout[], liftId: string, bodyweight = 0) {
  return workouts
    .filter((w) => w.sets.some((s) => s.liftId === liftId && s.seconds === undefined))
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((w) => ({
      at: w.startedAt,
      best: Math.max(...w.sets.filter((s) => s.liftId === liftId && s.seconds === undefined).map((s) => e1rm(load(s, bodyweight), s.reps))),
      volume: volume(w.sets.filter((s) => s.liftId === liftId), bodyweight),
    }))
}

/** Hard sets per muscle over the last 7 days (primary muscle counts 1, others ½). */
export function weeklyMuscleSets(workouts: Workout[], now = Date.now()) {
  const since = now - 7 * 86_400_000
  const out = new Map<Muscle, number>()
  for (const w of workouts)
    for (const s of w.sets) {
      if (s.at < since) continue
      const muscles = liftById(s.liftId)?.muscles ?? []
      muscles.forEach((m, i) => out.set(m, (out.get(m) ?? 0) + (i === 0 ? 1 : 0.5)))
    }
  return out
}

/** Plates per side for a target on a bar (greedy, standard kg plates). */
export function plates(target: number, bar = 20, available = [25, 20, 15, 10, 5, 2.5, 1.25]) {
  let side = Math.max(0, (target - bar) / 2)
  const out: number[] = []
  for (const p of available)
    while (side >= p - 1e-9) {
      out.push(p)
      side -= p
    }
  return { perSide: out, leftover: Math.round(side * 2 * 100) / 100 }
}

/** Warm-up ramp to a working weight: empty bar, then ~50/70/85%, rounded to 2.5 kg. */
export function warmups(work: number, bar = 20) {
  if (work < bar + 20) return []
  const r = (x: number) => Math.max(bar, Math.round(x / 2.5) * 2.5)
  const steps = [
    { weight: bar, reps: 10 },
    { weight: r(work * 0.5), reps: 5 },
    { weight: r(work * 0.7), reps: 3 },
    { weight: r(work * 0.85), reps: 1 },
  ]
  return steps.filter((s, i) => s.weight < work && (i === 0 || s.weight > steps[i - 1].weight))
}
