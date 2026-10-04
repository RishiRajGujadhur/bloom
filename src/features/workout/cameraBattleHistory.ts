import { COMBAT_MODES, type CombatMode, type CombatState } from './cameraCombatModel'
export type BattleDrop = { id: string; at: number; mode: CombatMode; item: string; hits: number; seconds: number; xp: number }
const KEY = 'bloom-camera-battles-v1'
export function battleDrop(id: string, mode: CombatMode, state: CombatState, source: string, at = Date.now()): BattleDrop | null {
  if (source !== 'camera' || state.bossHp > 0 || state.hp <= 0 || state.hits < 1 || state.elapsed < .2) return null
  const item = mode === 'sword' ? 'Moonlit training blade' : mode === 'cloud' ? 'Cloud silk ribbon' : mode === 'ropes' || mode === 'doubleRopes' ? 'Storm rope charm' : 'Centre-line gauntlet'
  return { id, at, mode, item, hits: state.hits, seconds: Math.round(state.elapsed), xp: Math.min(150, 25 + state.hits * 3) }
}
export function readBattles(): BattleDrop[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((v: BattleDrop) => v && typeof v.id === 'string' && COMBAT_MODES.some(m => m.id === v.mode) && typeof v.item === 'string' && Number.isFinite(v.at) && Number.isFinite(v.xp) && Number.isFinite(v.hits) && Number.isFinite(v.seconds)).slice(-100) : []
  } catch { return [] }
}
export function saveBattle(drop: BattleDrop) {
  const history = readBattles(); if (history.some(v => v.id === drop.id)) return history
  const next = [...history, drop].slice(-100); localStorage.setItem(KEY, JSON.stringify(next)); return next
}
export function battleMarkdown(history: BattleDrop[]) {
  return '# Bloom camera battle journal\n\nReal-camera victories; movement cues and power are estimates.\n\n' + history.map(v => `- ${new Date(v.at).toISOString()} · ${COMBAT_MODES.find(m => m.id === v.mode)?.name}: ${v.hits} cycles, ${v.seconds}s, ${v.xp} XP · ${v.item}`).join('\n') + '\n'
}
