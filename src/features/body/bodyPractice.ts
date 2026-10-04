import { useEffect, useRef, useSyncExternalStore } from 'react'
import { RULES, type Exercise } from '../workout/formModel'

type Practice = { movement: string; label: string; pause: () => void; log?: (liftId: string, reps: number, seconds?: number) => void }
const practices = new Map<string, Practice>()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(listener => listener())
export function useBodyPractice(page: string, movement: string, label: string, pause: () => void, log?: Practice['log']) {
  const actions = useRef({ pause, log }); actions.current = { pause, log }
  useEffect(() => {
    const practice: Practice = { movement, label, pause: () => actions.current.pause(), log: (id, reps, seconds) => actions.current.log?.(id, reps, seconds) }
    practices.set(page, practice); notify()
    return () => { if (practices.get(page) === practice) { practices.delete(page); notify() } }
  }, [page, movement, label])
}
export function useCurrentPractice(page: string) {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener) } }, () => practices.get(page) ?? null, () => null)
}
const aliases: Record<string, Exercise> = {
  airsquat: 'squat', squat: 'squat', pushup: 'pushup', lunge: 'lunge', plank: 'plank',
  seatedtwist: 'seatedTwist', wheelchairdip: 'wheelchairDip', chairpushup: 'chairPushup',
  seatedpress: 'seatedPress', seatedchestfly: 'chestFly', chairsquat: 'chairSquat',
  taichiflow: 'taiChi', taiChi: 'taiChi', seatedboxing: 'boxing', seatedkarate: 'karate', seatedkungfu: 'kungFu',
}
export function supportedBodyExercise(page: string, movement: string): Exercise | null {
  if (page === 'taichi') return 'taiChi'
  if (Object.hasOwn(aliases, movement)) return aliases[movement]
  return Object.hasOwn(RULES, movement) ? movement as Exercise : null
}

export function usePauseForBodyCoach(pause: () => void) {
  const action = useRef(pause); action.current = pause
  useEffect(() => { const listener = () => action.current(); window.addEventListener('bloom-body-coach-open', listener); return () => window.removeEventListener('bloom-body-coach-open', listener) }, [])
}
