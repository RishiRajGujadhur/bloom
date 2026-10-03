import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { raidAttack } from '../../rpg/engine'
export function awardCoachSet(data: AppData, reward: { id: string; damage: number; xp: number }, at = Date.now()): AppData {
  const key = `coach:${reward.id}`
  if (data.rpg.ledger[key]) return data
  const damage = Number.isFinite(reward.damage) ? Math.max(0, Math.min(1000, Math.floor(reward.damage))) : 0
  const xp = Number.isFinite(reward.xp) ? Math.max(0, Math.min(500, Math.floor(reward.xp))) : 0
  if (!damage && !xp) return data
  const next = raidAttack(data, damage)
  return { ...next, rpg: { ...next.rpg, ledger: { ...next.rpg.ledger, [key]: { day: dayKey(new Date(at)), at, exp: xp, stat: 'strength', points: Math.floor(xp / 10), gold: 0, active: true, kind: 'impact', sourceId: reward.id } } } }
}
