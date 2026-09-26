/**
 * Power breathing (Wim Hof style): rounds of deep breaths, an exhale-hold
 * ("retention") you time yourself, then a 15-second recovery breath held in.
 */
export type Phase = 'breathe' | 'retention' | 'recovery' | 'rest' | 'done'
export type Settings = { rounds: number; breaths: number; pace: number; recovery: number }
export const defaultSettings: Settings = { rounds: 3, breaths: 30, pace: 1.6, recovery: 15 }

export type State = { phase: Phase; round: number; breath: number; phaseStart: number; retentions: number[] }
export const initial = (now: number): State => ({ phase: 'breathe', round: 1, breath: 0, phaseStart: now, retentions: [] })

/** Advance the machine. `tap` ends the retention (user presses when they need to breathe). */
export function step(s: State, cfg: Settings, now: number, tap = false): State {
  const el = (now - s.phaseStart) / 1000
  if (s.phase === 'breathe') {
    const breath = Math.floor(el / (cfg.pace * 2))
    if (breath >= cfg.breaths) return { ...s, phase: 'retention', phaseStart: now, breath: cfg.breaths }
    return breath !== s.breath ? { ...s, breath } : s
  }
  if (s.phase === 'retention' && tap) return { ...s, phase: 'recovery', phaseStart: now, retentions: [...s.retentions, Math.round(el)] }
  if (s.phase === 'recovery' && el >= cfg.recovery) {
    if (s.round >= cfg.rounds) return { ...s, phase: 'done', phaseStart: now }
    return { ...s, phase: 'rest', phaseStart: now }
  }
  if (s.phase === 'rest' && el >= 3) return { ...s, phase: 'breathe', round: s.round + 1, breath: 0, phaseStart: now }
  return s
}

/** 0–1 lung fullness for the animation during the breathing phase. */
export const lung = (s: State, cfg: Settings, now: number) => {
  if (s.phase === 'retention') return 0.15
  if (s.phase === 'recovery') return 1
  if (s.phase !== 'breathe') return 0.4
  const t = ((now - s.phaseStart) / 1000) % (cfg.pace * 2)
  return 0.5 - 0.5 * Math.cos((Math.PI * t) / cfg.pace)
}

export type Session = { at: number; retentions: number[] }
export const BREATHWORK_KEY = 'bloom-breathwork-v1'
export const best = (hist: Session[]) => Math.max(0, ...hist.flatMap((h) => h.retentions))
