export type KeyResult = { id: string; title: string; current: number; target: number }
export type Milestone = { id: string; title: string; start: string; end: string; progress: number; dependsOn?: string }
export type Goal = { id: string; title: string; color: string; confidence: number; krs: KeyResult[]; milestones: Milestone[]; reviewedAt?: string; note?: string }
export type RoadmapStore = { goals: Goal[]; view: 'Week' | 'Month' | 'Year' }
export const ROADMAP_KEY = 'bloom-roadmap-v1'

export const goalColors = ['#e2703f', '#8f7ae5', '#3f8a76', '#5aa9e6', '#e27396']

const add = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00`)
  x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}

export function sampleGoal(today: string): Goal {
  const a = crypto.randomUUID()
  const b = crypto.randomUUID()
  return {
    id: crypto.randomUUID(),
    title: 'Run a 10K',
    color: goalColors[0],
    confidence: 7,
    krs: [
      { id: crypto.randomUUID(), title: 'Runs per week', current: 1, target: 3 },
      { id: crypto.randomUUID(), title: 'Longest run (km)', current: 4, target: 10 },
    ],
    milestones: [
      { id: a, title: 'Run 5K without stopping', start: today, end: add(today, 21), progress: 30 },
      { id: b, title: 'Run 8K', start: add(today, 21), end: add(today, 49), progress: 0, dependsOn: a },
      { id: crypto.randomUUID(), title: 'Race day', start: add(today, 49), end: add(today, 63), progress: 0, dependsOn: b },
    ],
  }
}

/** Goal progress = mean of key-result progress (or milestones if no KRs). */
export function goalProgress(g: Goal) {
  if (g.krs.length) return g.krs.reduce((t, k) => t + Math.min(1, k.current / Math.max(1e-9, k.target)), 0) / g.krs.length
  if (g.milestones.length) return g.milestones.reduce((t, m) => t + m.progress / 100, 0) / g.milestones.length
  return 0
}

/** Is the goal on track given how much of its timeline has passed? */
export function onTrack(g: Goal, today: string) {
  if (!g.milestones.length) return null
  const start = g.milestones.map((m) => m.start).sort()[0]
  const end = g.milestones.map((m) => m.end).sort().at(-1)!
  const span = (Date.parse(end) - Date.parse(start)) / 86400000
  const elapsed = Math.max(0, Math.min(1, (Date.parse(today) - Date.parse(start)) / 86400000 / Math.max(1, span)))
  const p = goalProgress(g)
  return { expected: elapsed, actual: p, status: p + 0.1 >= elapsed ? 'on track' : p + 0.25 >= elapsed ? 'a little behind' : 'behind' }
}

/** Weekly review is due if never reviewed or last review ≥ 7 days ago. */
export const reviewDue = (g: Goal, today: string) => !g.reviewedAt || (Date.parse(today) - Date.parse(g.reviewedAt)) / 86400000 >= 7

export const reviewPrompts = ['What moved this goal forward this week?', 'What got in the way?', 'What is the single next step?', 'Is this goal still worth it? Why?']

/** Tasks for frappe-gantt: one bar per milestone, coloured per goal. */
export function ganttTasks(goals: Goal[]) {
  return goals.flatMap((g, gi) =>
    g.milestones.map((m) => ({
      id: m.id,
      name: `${g.title} · ${m.title}`,
      start: m.start,
      end: m.end,
      progress: m.progress,
      dependencies: m.dependsOn ?? '',
      custom_class: `rm-goal-${gi % goalColors.length}`,
    })),
  )
}
