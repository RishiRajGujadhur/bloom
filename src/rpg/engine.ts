import type { AppData } from '../model'
import { dayKey, previousDay } from '../dates'
import type { Rpg, Stat } from './schema'

const DAY = 86_400_000
export const FOCUS_QUEST_MS = 25 * 60 * 1000
type Award = Rpg['ledger'][string]
const weekStart = (day: string) => {
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate() - date.getDay())
  return dayKey(date)
}
export const habitKey = (id: string, day: string) => `habit:${id}:${day}`
export const priorityKey = (id: string, day: string) => `priority:${id}:${day}`

export function elapsedParts(startedAt: number | null, now = Date.now()) {
  const elapsed = Math.max(0, startedAt === null ? 0 : now - startedAt)
  const totalMinutes = Math.floor(elapsed / 60_000)
  return { days: Math.floor(totalMinutes / 1440), hours: Math.floor(totalMinutes / 60) % 24, minutes: totalMinutes % 60, milliseconds: elapsed }
}
export function momentumState(rpg: Rpg, now = Date.now()) {
  const elapsed = elapsedParts(rpg.momentum.startedAt, now)
  const state = rpg.momentum.shatteredAt ? 'shattered' : rpg.momentum.resetAt && (!rpg.momentum.startedAt || rpg.momentum.resetAt >= rpg.momentum.startedAt) ? 'reset' : rpg.momentum.startedAt ? 'active' : 'idle'
  return { ...elapsed, state }
}
export function startMomentum(data: AppData, now = Date.now()): AppData {
  if (data.rpg.momentum.startedAt && !data.rpg.momentum.shatteredAt) return data
  return { ...data, rpg: { ...data.rpg, momentum: { startedAt: now, resetAt: null, shatteredAt: null } } }
}
export function resetMomentum(data: AppData, now = Date.now()): AppData {
  return { ...data, rpg: { ...data.rpg, momentum: { startedAt: now, resetAt: now, shatteredAt: null } } }
}
export function shatterMomentum(data: AppData, now = Date.now()): AppData {
  return { ...data, rpg: { ...data.rpg, momentum: { ...data.rpg.momentum, shatteredAt: now } } }
}

export type FocusQuestState = 'idle' | 'active' | 'completed' | 'failed'
export function focusQuestState(rpg: Rpg, now = Date.now()): FocusQuestState {
  const quest = rpg.focusQuest
  if (quest.completedAt) return 'completed'
  if (quest.failedAt) return 'failed'
  if (quest.startedAt && now - quest.startedAt >= FOCUS_QUEST_MS) return 'active'
  return quest.startedAt ? 'active' : 'idle'
}
export function startFocusQuest(data: AppData, soundscape: Rpg['focusQuest']['soundscape'], now = Date.now()): AppData {
  if (focusQuestState(data.rpg, now) === 'active') return data
  return { ...data, rpg: { ...data.rpg, focusQuest: { ...data.rpg.focusQuest, startedAt: now, completedAt: null, failedAt: null, soundscape } } }
}
export function completeFocusQuest(data: AppData, now = Date.now()): AppData {
  const quest = data.rpg.focusQuest
  if (!quest.startedAt || quest.completedAt || quest.failedAt || now - quest.startedAt < (quest.durationMinutes ?? 25) * 60000) return data
  const key = `focus:${quest.startedAt}`
  const minutes = quest.durationMinutes ?? 25
  const bonus = data.rpg.skills.meditation?.state === 'unlocked' ? 5 : 0
  const reward = { day: dayKey(new Date(now)), at: now, exp: minutes + bonus, stat: 'intelligence' as const, points: 5, gold: 5, active: true, kind: 'priority' as const, sourceId: key }
  return { ...data, rpg: { ...data.rpg, gold: data.rpg.gold + 5, ledger: { ...data.rpg.ledger, [key]: reward }, focusHistory: [...(data.rpg.focusHistory ?? []), { id: key, completedAt: now, minutes, taskTitle: data.todos?.find(task => task.id === quest.taskId)?.title ?? 'Open focus' }], focusQuest: { ...quest, completedAt: now } } }
}
export function failFocusQuest(data: AppData, now = Date.now()): AppData {
  const quest = data.rpg.focusQuest
  if (!quest.startedAt || quest.completedAt || quest.failedAt) return data
  return { ...data, rpg: { ...data.rpg, focusQuest: { ...quest, failedAt: now, damage: quest.damage + 1 } } }
}
export function contractSignature(given: string, when: string, then: string) {
  return `BLOOM-${[given, when, then].join('|').replace(/\s+/g, ' ').trim().split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7).toString(16).toUpperCase()}`
}

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
  if (!days.has(cursor) && rpg.buffs.some(buff => buff.kind === 'streak-shield' && buff.quantity > 0)) cursor = previousDay(cursor)
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
    ...(rpg.posture ?? []).map(p=>({ at:p.at, amount: p.kind==='poison' ? -p.amount : p.amount })),
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
  const baseline = (key: string, day: string, kind: Award['kind'], sourceId: string) => { rpg.ledger[key] = { day, at: now, exp: 0, stat: null, points: 0, gold: 0, active: true, kind, sourceId } }
  data.habits.forEach(h => h.dates.forEach(day => baseline(habitKey(h.id,day),day,'habit',h.id)))
  data.plans.filter(p => p.done).forEach(p => baseline(priorityKey(p.id,p.date),p.date,'priority',p.id))
  data.sessions.forEach(s => { const day = dayKey(new Date(s.metadata.date)); baseline(`journal:${day}`,day,'journal',s.metadata.id) })
  return { ...data, rpg }
}

/** Reconcile one transaction; every award has a stable source/day identity. */
export function syncGame(next: AppData, previous: AppData, clock = Date.now()): AppData {
  const now = Math.max(clock, next.rpg.lastSeenAt)
  const today = dayKey(new Date(now))
  const rpg: Rpg = { ...next.rpg, lastSeenAt: now, ledger: { ...next.rpg.ledger }, bosses: { ...next.rpg.bosses }, loot: [...next.rpg.loot], buffs: [...next.rpg.buffs], badges: [...next.rpg.badges] }
  let data = { ...next, rpg }
  // A committed boss is settled once when its local date closes, including offline gaps.
  for (const [day, boss] of Object.entries(rpg.bosses)) {
    if (day >= today || boss.settled) continue
    const health = bossHealth(data, day)!
    rpg.bosses[day] = { ...boss, settled: true, defeated: health.remaining === 0, penalty: health.criticalComplete ? 0 : 5 }
  }
  const fresh: { key: string; base: number }[] = []
  const update = (key: string, active: boolean, wasActive: boolean, kind: Award['kind'], sourceId: string, stat: Stat | null, base: number, points = 0, gold = 0) => {
    const found = rpg.ledger[key]
    if (found) { if (found.active !== active) rpg.ledger[key] = { ...found, active }; return }
    if (!active || wasActive) return
    rpg.ledger[key] = { day: today, at: now, exp: base, stat, points, gold, active: true, kind, sourceId }
    rpg.gold += gold
    fresh.push({ key, base })
  }
  for (const h of data.habits) update(habitKey(h.id,today), h.dates.includes(today), previous.habits.find(p => p.id === h.id)?.dates.includes(today) ?? false, 'habit', h.id, h.stat, 10, 5, 10)
  for (const p of data.plans.filter(p => p.date === today)) update(priorityKey(p.id,today), p.done, previous.plans.find(old => old.id === p.id)?.done ?? false, 'priority', p.id, null, 10, 0, 10)
  const newJournal = data.sessions.find(s => s.flow.complete && !previous.sessions.some(old => old.metadata.id === s.metadata.id))
  if (newJournal) update(`journal:${today}`, true, false, 'journal', newJournal.metadata.id, 'spirit', data.rpg.skills.breathwork?.state === 'unlocked' ? 25 : 20, 5)
  const currentCombo = combo(rpg, now)
  const focusMultiplier = rpg.buffs.some(buff => buff.kind === 'focus-elixir' && buff.expiresAt !== null && buff.expiresAt > now) ? 1.1 : 1
  for (const { key, base } of fresh) rpg.ledger[key] = { ...rpg.ledger[key], exp: Math.round(base*currentCombo.multiplier*focusMultiplier) }
  const boss = rpg.bosses[today]
  if (boss && !boss.settled) {
    const won = bossHealth(data,today)!.remaining === 0
    rpg.bosses[today] = { ...boss, defeated: won }
    const key = `boss:${today}`
    const reward = rpg.ledger[key]
    if (reward) rpg.ledger[key] = { ...reward, active: won }
    else if (won) rpg.ledger[key] = { day: today, at: now, exp: Math.round(50*currentCombo.multiplier), stat: null, points: 0, gold: 0, active: true, kind: 'boss', sourceId: today }
  }
  const currentWeek = weekStart(today)
  const raid = rpg.weeklyRaid?.weekStart === currentWeek
    ? rpg.weeklyRaid
    : { weekStart: currentWeek, maxHp: 500, hp: 500, defeated: false, lootClaimed: false, badgeUnlocked: false }
  const damage = fresh.reduce((sum, { key }) => sum + (key.startsWith('priority:') ? 35 : key.startsWith('habit:') ? 20 : 0), 0)
  const raidHp = Math.max(0, raid.hp - damage)
  rpg.weeklyRaid = { ...raid, hp: raidHp, defeated: raidHp === 0, lootClaimed: raid.lootClaimed || raidHp === 0, badgeUnlocked: raid.badgeUnlocked || raidHp === 0 }
  if (raidHp === 0 && !rpg.badges.includes('fog-breaker')) rpg.badges.push('fog-breaker')
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

export function buyShopItem(data: AppData, item: 'streak-shield' | 'focus-elixir', now = Date.now()): AppData {
  const cost = item === 'streak-shield' ? 120 : 80
  if (data.rpg.gold < cost) return data
  const expiresAt = item === 'focus-elixir' ? now + 4 * 60 * 60 * 1000 : null
  return { ...data, rpg: { ...data.rpg, gold: data.rpg.gold - cost, buffs: [...data.rpg.buffs, { kind: item, expiresAt, quantity: 1 }] } }
}

export function toggleGraceDay(data: AppData, day: string): AppData {
  const graceDays = data.rpg.graceDays.includes(day) ? data.rpg.graceDays.filter(value => value !== day) : [...data.rpg.graceDays, day]
  return { ...data, rpg: { ...data.rpg, graceDays } }
}

export function unlockSkill(data: AppData, skillId: string, exp: number, stats: Record<Stat, number>, definitions: Record<string, { prerequisites: string[]; attribute: Stat | null; threshold: number; expCost: number }>): AppData {
  if (data.rpg.skills[skillId]?.state === 'unlocked') return data
  const definition = definitions[skillId]
  if (!definition || exp < definition.expCost || (definition.attribute && stats[definition.attribute] < definition.threshold) || definition.prerequisites.some(id => id !== 'mindfulness' && data.rpg.skills[id]?.state !== 'unlocked')) return data
  return { ...data, rpg: { ...data.rpg, skills: { ...data.rpg.skills, [skillId]: { ...definition, state: 'unlocked' } } } }
}

export function raidAttack(data: AppData, damage: number): AppData {
  const raid = data.rpg.weeklyRaid
  if (!raid || raid.defeated) return data
  const hp = Math.max(0, raid.hp - Math.max(0, damage))
  return { ...data, rpg: { ...data.rpg, weeklyRaid: { ...raid, hp, defeated: hp === 0, lootClaimed: hp === 0 || raid.lootClaimed, badgeUnlocked: hp === 0 || raid.badgeUnlocked }, badges: hp === 0 && !data.rpg.badges.includes('fog-breaker') ? [...data.rpg.badges, 'fog-breaker'] : data.rpg.badges } }
}

/** Applies one point of decay per inactive day while honoring explicitly planned grace dates. */
export function statsAfterDecay(rpg: Rpg, clock = Date.now()) {
  const stats: Record<Stat, number> = { strength: 0, intelligence: 0, spirit: 0 }
  const activeDays = new Set(Object.values(rpg.ledger).filter(event => event.active && event.points > 0).map(event => event.day))
  for (const reward of Object.values(rpg.ledger)) if (reward.active && reward.stat) stats[reward.stat] += reward.points
  const latest = [...activeDays].sort().at(-1)
  if (!latest) return stats
  const cursor = new Date(`${latest}T12:00:00`)
  const today = new Date(clock)
  while (cursor < today) {
    cursor.setDate(cursor.getDate() + 1)
    const day = dayKey(cursor)
    if (!activeDays.has(day) && !rpg.graceDays.includes(day)) {
      stats.strength = Math.max(0, stats.strength - 1)
      stats.intelligence = Math.max(0, stats.intelligence - 1)
      stats.spirit = Math.max(0, stats.spirit - 1)
    }
  }
  return stats
}
