/**
 * Minimal .ics reader for importing events as calendar blocks: SUMMARY,
 * DTSTART and DTEND of each VEVENT (UTC "Z", floating local, or all-day).
 */
export type IcsEvent = { title: string; start: Date; end: Date }

function parseIcsDate(raw: string): Date | null {
  const v = raw.trim()
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h = '00', mi = '00', s = '00', z] = m
  return z ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)) : new Date(+y, +mo - 1, +d, +h, +mi, +s)
}

export function parseIcs(text: string): IcsEvent[] {
  // Unfold continuation lines first.
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const out: IcsEvent[] = []
  let cur: { title?: string; start?: Date | null; end?: Date | null } | null = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {}
    else if (line === 'END:VEVENT' && cur) {
      if (cur.start) {
        const end = cur.end && cur.end > cur.start ? cur.end : new Date(+cur.start + 60 * 60000)
        out.push({ title: (cur.title ?? 'Event').replace(/\\,/g, ',').replace(/\\n/g, ' '), start: cur.start, end })
      }
      cur = null
    } else if (cur) {
      const i = line.indexOf(':')
      if (i < 0) continue
      const key = line.slice(0, i).split(';')[0].toUpperCase()
      const value = line.slice(i + 1)
      if (key === 'SUMMARY') cur.title = value
      else if (key === 'DTSTART') cur.start = parseIcsDate(value)
      else if (key === 'DTEND') cur.end = parseIcsDate(value)
    }
  }
  return out
}
