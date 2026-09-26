import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { duration, type SleepEntry } from '../sleep/sleepModel'

export const ENERGY_KEY = 'bloom-energy-v1'
export type TimeLog = { id: string; date: string; category: string; hours: number }

/** Logged-by-hand activities and where their energy tends to go. */
export const categories: { id: string; label: string; color: string; flows: Record<string, number> }[] = [
  { id: 'exercise', label: 'Exercise', color: '#6bbf7a', flows: { Strength: 0.8, Recovery: 0.2 } },
  { id: 'learning', label: 'Learning', color: '#5aa9e6', flows: { Intelligence: 1 } },
  { id: 'projects', label: 'Side projects', color: '#7b8cf0', flows: { Intelligence: 0.7, Spirit: 0.3 } },
  { id: 'social', label: 'Friends & family', color: '#e27396', flows: { Spirit: 0.8, Recovery: 0.2 } },
  { id: 'leisure', label: 'Leisure', color: '#f2a65a', flows: { Recovery: 0.7, Spirit: 0.3 } },
  { id: 'screens', label: 'Scrolling & videos', color: '#b07b6b', flows: { Burnout: 0.8, Recovery: 0.2 } },
  { id: 'chores', label: 'Chores & admin', color: '#9a8f86', flows: { Strength: 0.2, Burnout: 0.4, Recovery: 0.4 } },
  { id: 'work', label: 'Meetings & shallow work', color: '#8c7ab8', flows: { Intelligence: 0.3, Burnout: 0.7 } },
]

export const outputColors: Record<string, string> = {
  Intelligence: '#5aa9e6',
  Strength: '#6bbf7a',
  Spirit: '#8f7ae5',
  Recovery: '#7fc6c6',
  Burnout: '#d9534f',
}

export type SankeyData = {
  nodes: { id: string; color: string; hours: number }[]
  links: { source: string; target: string; value: number }[]
}

const round = (n: number) => Math.round(n * 10) / 10

export function rangeDays(today: string, days: number) {
  const d = new Date(`${today}T12:00:00`)
  return Array.from({ length: days }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() - i)
    return dayKey(x)
  })
}

export type EnergyInputs = {
  data: AppData
  today: string
  days: number
  sleep: SleepEntry[]
  logs: TimeLog[]
  /** Daybook pages (updatedAt) as a rough journaling signal. */
  daybook: { updatedAt: string }[]
  includeBurnout: boolean
}

/** Hours in (sources) → where the energy went (stats, recovery, burnout). */
export function buildFlow(i: EnergyInputs): SankeyData & { exp: Record<string, number>; burnout: 'Low' | 'Medium' | 'High'; hours: Record<string, number> } {
  const days = new Set(rangeDays(i.today, i.days))
  const inRange = (at: number | string) => days.has(typeof at === 'string' ? at.slice(0, 10) : dayKey(new Date(at)))
  const flows = new Map<string, Map<string, number>>()
  const hours: Record<string, number> = {}
  const colors: Record<string, string> = {}
  const add = (source: string, color: string, h: number, split: Record<string, number>) => {
    if (h <= 0) return
    hours[source] = (hours[source] ?? 0) + h
    colors[source] = color
    const row = flows.get(source) ?? new Map<string, number>()
    for (const [target, w] of Object.entries(split)) {
      if (!i.includeBurnout && target === 'Burnout') continue
      row.set(target, (row.get(target) ?? 0) + h * w)
    }
    flows.set(source, row)
  }

  const sleepHours = i.sleep.filter((s) => days.has(s.date)).reduce((s, e) => s + duration(e.bedtime, e.wake), 0)
  add('Sleep', '#6b7fd7', sleepHours, { Recovery: 1 })
  const deep = i.data.rpg.focusHistory.filter((f) => inRange(f.completedAt)).reduce((s, f) => s + f.minutes / 60, 0)
  add('Deep work', '#3f6fb5', deep, { Intelligence: 1 })
  for (const h of i.data.habits) {
    const done = h.dates.filter((d) => days.has(d)).length
    const stat = h.stat ? h.stat[0].toUpperCase() + h.stat.slice(1) : 'Spirit'
    add('Habits', '#e0a458', done * 0.25, { [stat]: 1 })
  }
  const pages = i.daybook.filter((p) => inRange(p.updatedAt)).length + i.data.sessions.filter((s) => inRange(s.metadata.date)).length
  add('Journaling', '#c98bb9', pages * 0.3, { Spirit: 1 })
  for (const log of i.logs.filter((l) => days.has(l.date))) {
    const cat = categories.find((c) => c.id === log.category)
    if (cat) add(cat.label, cat.color, log.hours, cat.flows)
  }

  // Sleep debt and heavy scrolling feed burnout directly.
  const debt = Math.max(0, 7 * i.days - sleepHours)
  if (i.includeBurnout && debt > 0 && sleepHours > 0) add('Sleep debt', '#5a4a7a', debt, { Burnout: 1 })

  const links: SankeyData['links'] = []
  const targets = new Set<string>()
  for (const [source, row] of flows)
    for (const [target, value] of row)
      if (value > 0.05) {
        links.push({ source, target, value: round(value) })
        targets.add(target)
      }
  const nodes = [
    ...[...flows.keys()].filter((k) => links.some((l) => l.source === k)).map((id) => ({ id, color: colors[id], hours: round(hours[id]) })),
    ...[...targets].map((id) => ({ id, color: outputColors[id] ?? '#999', hours: round(links.filter((l) => l.target === id).reduce((s, l) => s + l.value, 0)) })),
  ]

  const exp: Record<string, number> = { Intelligence: 0, Strength: 0, Spirit: 0 }
  for (const entry of Object.values(i.data.rpg.ledger))
    if (entry.active && days.has(entry.day) && entry.stat) exp[entry.stat[0].toUpperCase() + entry.stat.slice(1)] += entry.exp

  const drain = links.filter((l) => l.target === 'Burnout').reduce((s, l) => s + l.value, 0)
  const restore = links.filter((l) => l.target === 'Recovery').reduce((s, l) => s + l.value, 0)
  const ratio = restore ? drain / restore : drain ? 2 : 0
  const burnout = ratio > 0.6 ? 'High' : ratio > 0.25 ? 'Medium' : 'Low'
  return { nodes, links, exp, burnout, hours }
}

/** Plain-language observations for "debugging your week". */
export function flowInsights(flow: ReturnType<typeof buildFlow>): string[] {
  const out: string[] = []
  const h = flow.hours
  const screens = h['Scrolling & videos'] ?? 0
  const growth = (h['Side projects'] ?? 0) + (h['Learning'] ?? 0) + (h['Deep work'] ?? 0)
  if (screens > 0 && growth > 0 && screens > growth * 0.5)
    out.push(`Scrolling took ${round(screens)} h, which is ${Math.round((screens / growth) * 100)}% of the time you gave to growth.`)
  if (flow.burnout === 'High') out.push('Drains outweigh recovery this week. Protect sleep and one slow evening.')
  if ((h['Sleep debt'] ?? 0) > 5) out.push(`You're ${round(h['Sleep debt'])} h short on sleep. It's the cheapest energy you can buy back.`)
  const top = Object.entries(flow.exp).sort((a, b) => b[1] - a[1])[0]
  if (top && top[1] > 0) out.push(`${top[0]} grew most (+${top[1]} EXP).`)
  if (!out.length) out.push('A balanced week. Your energy is flowing where you want it.')
  return out
}
