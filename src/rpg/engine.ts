import type { AppData } from '../model'
import { dayKey, previousDay } from '../dates'
import type { Rpg, Stat } from './schema'

const DAY = 86_400_000
type Award = Rpg['ledger'][string]
export const habitKey = (id: string, day: string) => `habit:${id}:${day}`
export const priorityKey = (id: string, day: string) => `priority:${id}:${day}`

export function multiplier(elapsedMs: number) {
  const days = Math.max(0, elapsedMs) / DAY
  return days >= 14 ? 3 : days <= 3 ? 1.5 ** (days / 3) : 1.5 * 2 ** ((days - 3) / 11)
}
export function combo(rpg: Rpg, clock = Date.now()) {
  const now = Math.max(clock, rpg.lastSeenAt)
  const today = dayKey(new Date(now))
  const days = new Map<string, number>()
  for (const event of Object.values(rpg.ledger)) {
    if (!event.active || event.exp === 0 || event.kind === 'boss' || event.at > now) continue
    days.set(event.day, Math.min(days.get(event.day) ?? Infinity, event.at))
  }
  let cursor = days.has(today) ? today : previousDay(today)
  if (!days.has(cursor)) return { elapsed: 0, multiplier: 1, days: 0, startedAt: null, loggedToday: false }
  let startedAt = days.get(cursor)!
  let count = 0
  while (days.has(cursor)) { startedAt = days.get(cursor)!; count++; cursor = previousDay(cursor) }
  const elapsed = Math.max(0, now - startedAt)
  return { elapsed, multiplier: multiplier(elapsed), days: count, startedAt, loggedToday: days.has(today) }
}
export function totals(rpg: Rpg) {
  const stats: Record<Stat, number> = { strength: 0, intelligence: 0, spirit: 0 }
  let exp = 0
  for (const reward of Object.values(rpg.ledger)) if (reward.active) { exp += reward.exp; if (reward.stat) stats[reward.stat] += reward.points }
  const sum = stats.strength + stats.intelligence + stats.spirit
  const tier = sum >= 300 ? 2 : sum >= 100 ? 1 : 0
  const healthEvents = [
    ...Object.values(rpg.bosses).filter(b=>b.penalty>0).map(b=>({ at:new Date(`${b.day}T23:59:59.999`).getTime(), amount:-b.penalty })),
    ...Object.values(rpg.ledger).filter(e=>e.kind==='boss'&&e.active).map(e=>({at:e.at,amount:5})),
  ].sort((a,b)=>a.at-b.at)
  // Full-health victories cannot bank healing against a future missed day.
  const hp = healthEvents.reduce((hp,event)=>Math.max(1,Math.min(100,hp+event.amount)),100)
  return { stats, exp, level: 1 + Math.floor(exp/100), nextLevel: 100 - exp%100, tier, hp }
}
export function bossHealth(data: AppData, day: string) {
  const boss = data.rpg.bosses[day]
  if (!boss) return null
  const habitHits = boss.habitIds.filter(id => data.habits.find(h => h.id === id)?.dates.includes(day)).length
  const priorityHits = boss.priorityIds.filter(id => data.plans.find(p => p.id === id)?.done).length
  const max = boss.habitIds.length*20 + boss.priorityIds.length*30
  return { max, remaining: Math.max(0, max-habitHits*20-priorityHits*30), habitHits, priorityHits, criticalComplete: priorityHits === boss.priorityIds.length }
}

/** First-run baseline: historical completions stay intact but are not farmable rewards. */
export function initializeGame(data: AppData, now = Date.now()): AppData {
  if (Object.keys(data.rpg.ledger).length || Object.keys(data.rpg.bosses).length) return data
  const rpg = { ...data.rpg, ledger: { ...data.rpg.ledger } }
  const baseline = (key: string, day: string, kind: Award['kind'], sourceId: string) => { rpg.ledger[key] = { day, at: now, exp: 0, stat: null, points: 0, active: true, kind, sourceId } }
  data.habits.forEach(h => h.dates.forEach(day => baseline(habitKey(h.id,day),day,'habit',h.id)))
  data.plans.filter(p => p.done).forEach(p => baseline(priorityKey(p.id,p.date),p.date,'priority',p.id))
  data.sessions.forEach(s => { const day = dayKey(new Date(s.metadata.date)); baseline(`journal:${day}`,day,'journal',s.metadata.id) })
  return { ...data, rpg }
}

/** Reconcile one transaction; every award has a stable source/day identity. */
export function syncGame(next: AppData, previous: AppData, clock = Date.now()): AppData {
  const now = Math.max(clock, next.rpg.lastSeenAt)
  const today = dayKey(new Date(now))
  const rpg: Rpg = { ...next.rpg, lastSeenAt: now, ledger: { ...next.rpg.ledger }, bosses: { ...next.rpg.bosses }, loot: [...next.rpg.loot] }
  let data = { ...next, rpg }
  // A committed boss is settled once when its local date closes, including offline gaps.
  for (const [day, boss] of Object.entries(rpg.bosses)) {
    if (day >= today || boss.settled) continue
    const health = bossHealth(data, day)!
    rpg.bosses[day] = { ...boss, settled: true, defeated: health.remaining === 0, penalty: health.criticalComplete ? 0 : 5 }
  }
  const fresh: { key: string; base: number }[] = []
  const update = (key: string, active: boolean, wasActive: boolean, kind: Award['kind'], sourceId: string, stat: Stat | null, base: number, points = 0) => {
    const found = rpg.ledger[key]
    if (found) { if (found.active !== active) rpg.ledger[key] = { ...found, active }; return }
    if (!active || wasActive) return
    rpg.ledger[key] = { day: today, at: now, exp: base, stat, points, active: true, kind, sourceId }
    fresh.push({ key, base })
  }
  for (const h of data.habits) update(habitKey(h.id,today), h.dates.includes(today), previous.habits.find(p => p.id === h.id)?.dates.includes(today) ?? false, 'habit', h.id, h.stat, 10, 5)
  for (const p of data.plans.filter(p => p.date === today)) update(priorityKey(p.id,today), p.done, previous.plans.find(old => old.id === p.id)?.done ?? false, 'priority', p.id, null, 10)
  const newJournal = data.sessions.find(s => s.flow.complete && !previous.sessions.some(old => old.metadata.id === s.metadata.id))
  if (newJournal) update(`journal:${today}`, true, false, 'journal', newJournal.metadata.id, 'spirit', 20, 5)
  const currentCombo = combo(rpg, now)
  for (const { key, base } of fresh) rpg.ledger[key] = { ...rpg.ledger[key], exp: Math.round(base*currentCombo.multiplier) }
  const boss = rpg.bosses[today]
  if (boss && !boss.settled) {
    const won = bossHealth(data,today)!.remaining === 0
    rpg.bosses[today] = { ...boss, defeated: won }
    const key = `boss:${today}`
    const reward = rpg.ledger[key]
    if (reward) rpg.ledger[key] = { ...reward, active: won }
    else if (won) rpg.ledger[key] = { day: today, at: now, exp: Math.round(50*currentCombo.multiplier), stat: null, points: 0, active: true, kind: 'boss', sourceId: today }
  }
  // Claim a milestone only on a real newly rewarded activity, not by waiting idle or undo/redo.
  if (fresh.length) for (const milestone of [7,30] as const) {
    if (currentCombo.elapsed >= milestone*DAY && !rpg.loot.some(l => l.milestone === milestone)) rpg.loot.push({ milestone, earnedAt: now, opened: false })
  }
  data = { ...data, rpg }
  return data
}
export function commitBoss(data: AppData, priorityIds: string[], clock = Date.now()): AppData {
  const now = Math.max(clock,data.rpg.lastSeenAt)
  const day = dayKey(new Date(now))
  const ids = [...new Set(priorityIds)]
  if (data.rpg.bosses[day] || ids.length < 1 || ids.length > 3 || ids.some(id => !data.plans.some(p => p.id === id && p.date === day))) return data
  return { ...data, rpg: { ...data.rpg, bosses: { ...data.rpg.bosses, [day]: { day, habitIds: data.habits.map(h => h.id), priorityIds: ids, startedAt: now, defeated: false, settled: false, penalty: 0 } } } }
}
export function openLoot(data: AppData, milestone: 7 | 30): AppData {
  const loot = data.rpg.loot.find(l => l.milestone === milestone)
  if (!loot || loot.opened) return data
  return { ...data, rpg: { ...data.rpg, loot: data.rpg.loot.map(l => l.milestone === milestone ? { ...l, opened: true } : l) } }
}
export function unlocks(rpg: Rpg) {
  return { forest: rpg.loot.some(l => l.milestone === 7 && l.opened), amber: rpg.loot.some(l => l.milestone === 30 && l.opened) }
}
