import type { Rpg, Stat } from './schema'
import { totals } from './engine'

export type StarNode = {
  id: string
  title: string
  detail: string
  requirement: string
  lit: boolean
  position: [number, number, number]
  group: 'core' | Stat
  links: string[]
}

const core = [
  { id: 'mindfulness', title: 'Mindfulness', detail: 'The root of every path: noticing, gently.' },
  { id: 'breathwork', title: 'Breathwork', detail: 'Calm on demand through the breath.' },
  { id: 'meditation', title: 'Meditation', detail: 'Longer sits; focus sessions earn bonus XP.' },
  { id: 'zen', title: 'Zen', detail: 'Steady presence, even on hard days.' },
]
const branches: Record<Stat, { title: string; angle: number; words: string[] }> = {
  strength: { title: 'Strength', angle: Math.PI * 0.85, words: ['First steps', 'Steady body', 'Active days', 'Strong routine', 'Unstoppable'] },
  intelligence: { title: 'Intelligence', angle: Math.PI * 0.15, words: ['Curious', 'Focused', 'Deep worker', 'Scholar', 'Sage'] },
  spirit: { title: 'Spirit', angle: Math.PI * 1.5, words: ['Present', 'Grateful', 'Grounded', 'Radiant', 'Luminous'] },
}
export const milestones = [10, 25, 50, 100, 200]

/** Builds the constellation from real skill and stat progress. */
export function constellation(rpg: Rpg): StarNode[] {
  const { stats } = totals(rpg)
  const nodes: StarNode[] = core.map((skill, i) => ({
    ...skill,
    requirement: i === 0 ? 'Unlocked from the start' : `Unlock on the Growth skill tree`,
    lit: i === 0 || rpg.skills[skill.id]?.state === 'unlocked',
    position: [0, i * 2.4 - 3, 0],
    group: 'core',
    links: i ? [core[i - 1].id] : [],
  }))
  for (const [stat, branch] of Object.entries(branches) as [Stat, (typeof branches)[Stat]][]) {
    milestones.forEach((points, i) => {
      const r = 3 + i * 2.1
      nodes.push({
        id: `${stat}-${points}`,
        title: `${branch.words[i]}`,
        detail: `${branch.title} milestone`,
        requirement: `${points} ${branch.title.toLowerCase()} points (you have ${stats[stat]})`,
        lit: stats[stat] >= points,
        position: [Math.cos(branch.angle) * r, -3 + i * 0.9, Math.sin(branch.angle) * r],
        group: stat,
        links: [i ? `${stat}-${milestones[i - 1]}` : 'mindfulness'],
      })
    })
  }
  return nodes
}
