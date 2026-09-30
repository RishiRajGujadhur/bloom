import * as chrono from 'chrono-node'

/**
 * Natural-language task entry (QoL 59, 300, 304): "Call mum tomorrow p1 #family
 * every week" → title, due date, priority, tags and recurrence. Anything not
 * recognised stays in the title.
 */
export type QuickTask = {
  title: string
  due: string | null
  priority: 'P1' | 'P2' | 'P3' | 'P4' | null
  tags: string[]
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
}

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function parseQuickTask(text: string, today: string): QuickTask {
  let s = ` ${text} `
  let priority: QuickTask['priority'] = null
  s = s.replace(/\s(?:p|!)([1-4])(?=\s)/i, (_, n: string) => { priority = `P${n}` as QuickTask['priority']; return ' ' })
  const tags: string[] = []
  s = s.replace(/\s#([\p{L}\d_-]+)/gu, (_, t: string) => { if (!tags.includes(t.toLowerCase())) tags.push(t.toLowerCase()); return ' ' })
  let recurrence: QuickTask['recurrence'] = 'none'
  s = s.replace(/\s(every\s(day|week|month)|daily|weekly|monthly)(?=\s)/i, (m: string) => {
    const w = m.toLowerCase()
    recurrence = /day|daily/.test(w) ? 'daily' : /week/.test(w) ? 'weekly' : 'monthly'
    return ' '
  })
  let due: string | null = null
  const ref = new Date(`${today}T09:00:00`)
  const hit = chrono.parse(s, ref, { forwardDate: true })[0]
  if (hit) {
    due = key(hit.start.date())
    s = s.slice(0, hit.index) + ' ' + s.slice(hit.index + hit.text.length)
    s = s.replace(/\s(on|by|due|at)\s*$/i, ' ')
  }
  const title = s.replace(/\s+/g, ' ').trim()
  return { title: title || text.trim(), due, priority, tags: tags.slice(0, 6), recurrence }
}

/** Pasting several lines creates one task per non-empty line (bullets stripped). */
export const splitLines = (text: string) =>
  text.split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ x]\])\s*/i, '').trim()).filter(Boolean).slice(0, 50)

/** Shift a YYYY-MM-DD by n days. */
export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() + n)
  return key(d)
}
