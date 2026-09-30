import { useEffect, useRef, useState } from 'react'
import { keepAwakeAllowed } from '../settings/comfort'

/**
 * Physical presence. `useAway` uses the Idle Detection API (OS-wide keyboard,
 * mouse and screen-lock state) once you've granted it, and otherwise falls
 * back to in-page activity and tab visibility. `useKeepAwake` holds a Screen
 * Wake Lock while a guided session runs and re-acquires it after tab switches.
 */
type IdleDetectorT = EventTarget & { userState: 'active' | 'idle'; screenState: 'locked' | 'unlocked'; start: (o: { threshold: number; signal: AbortSignal }) => Promise<void> }
type IdleCtor = { new (): IdleDetectorT; requestPermission: () => Promise<'granted' | 'denied'> }
const Idle = () => (globalThis as { IdleDetector?: IdleCtor }).IdleDetector

export const idleSupported = () => !!Idle()
const PERM_KEY = 'bloom-idle-granted'
export const idleGranted = () => { try { return localStorage.getItem(PERM_KEY) === '1' } catch { return false } }

/** Must be called from a click (the browser asks the user). */
export async function requestIdle(): Promise<boolean> {
  const I = Idle()
  if (!I) return false
  const r = await I.requestPermission().catch(() => 'denied' as const)
  try { localStorage.setItem(PERM_KEY, r === 'granted' ? '1' : '0') } catch { /* optional */ }
  return r === 'granted'
}

export type AwayState = { away: boolean; since: number | null; source: 'os' | 'page' | null; locked: boolean }

export function useAway(enabled: boolean, thresholdMs = 60_000): AwayState {
  const [state, setState] = useState<AwayState>({ away: false, since: null, source: null, locked: false })
  useEffect(() => {
    if (!enabled) return
    const set = (away: boolean, source: 'os' | 'page', locked = false) => setState((s) => (s.away === away && s.locked === locked ? s : { away, since: away ? Date.now() - (source === 'page' ? thresholdMs : 0) : null, source, locked }))
    const I = Idle()
    if (I && idleGranted()) {
      const ac = new AbortController()
      const d = new I()
      const on = () => set(d.userState === 'idle' || d.screenState === 'locked', 'os', d.screenState === 'locked')
      d.addEventListener('change', on)
      d.start({ threshold: Math.max(60_000, thresholdMs), signal: ac.signal }).catch(() => {})
      return () => ac.abort()
    }
    // Fallback: no input on this page for the threshold, or the tab hidden.
    let last = Date.now()
    const poke = () => { last = Date.now(); set(false, 'page') }
    const evs = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, poke, { passive: true }))
    const t = setInterval(() => { if (Date.now() - last > thresholdMs || document.hidden) set(true, 'page') }, 5000)
    return () => { evs.forEach((e) => window.removeEventListener(e, poke)); clearInterval(t) }
  }, [enabled, thresholdMs])
  return state
}

type Sentinel = { release: () => Promise<void>; released: boolean }
export const wakeLockSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator

/** Keeps the screen on while `active`; returns whether a lock is currently held. */
export function useKeepAwake(active: boolean) {
  const [held, setHeld] = useState(false)
  const lock = useRef<Sentinel | null>(null)
  useEffect(() => {
    if (!active || !wakeLockSupported() || !keepAwakeAllowed()) return
    let off = false
    const acquire = async () => {
      try {
        const s = (await (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock.request('screen'))
        if (off) { void s.release(); return }
        lock.current = s
        setHeld(true)
      } catch { setHeld(false) }
    }
    const onVis = () => { if (document.visibilityState === 'visible' && (!lock.current || lock.current.released)) void acquire() }
    void acquire()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      off = true
      document.removeEventListener('visibilitychange', onVis)
      void lock.current?.release().catch(() => {})
      lock.current = null
      setHeld(false)
    }
  }, [active])
  return held
}
