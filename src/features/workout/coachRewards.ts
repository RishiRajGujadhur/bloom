import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { raidAttack } from '../../rpg/engine'
export type CoachReward = { id: string; damage: number; xp: number; battle?: { mode: string; item: string; hits: number; seconds: number } }
export function awardCoachSet(data: AppData, reward: CoachReward, at = Date.now()): AppData {
  const key = `coach:${reward.id}`
  if (data.rpg.ledger[key]) return data
  const damage = Number.isFinite(reward.damage) ? Math.max(0, Math.min(1000, Math.floor(reward.damage))) : 0
  const xp = Number.isFinite(reward.xp) ? Math.max(0, Math.min(500, Math.floor(reward.xp))) : 0
  if (!damage && !xp) return data
  const next = raidAttack(data, damage)
  const loot = reward.battle && Number.isFinite(reward.battle.hits) && Number.isFinite(reward.battle.seconds) ? [{ id: reward.id, at, mode: reward.battle.mode.slice(0, 30), item: reward.battle.item.slice(0, 80), hits: Math.max(0, Math.round(reward.battle.hits)), seconds: Math.max(0, Math.round(reward.battle.seconds)) }] : []
  return { ...next, rpg: { ...next.rpg, cameraLoot: [...(next.rpg.cameraLoot ?? []), ...loot].slice(-100), ledger: { ...next.rpg.ledger, [key]: { day: dayKey(new Date(at)), at, exp: xp, stat: 'strength', points: Math.floor(xp / 10), gold: 0, active: true, kind: reward.battle ? 'boss' : 'impact', sourceId: reward.id } } } }
}
