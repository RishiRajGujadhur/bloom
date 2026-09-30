import { differenceInCalendarDays, parseISO } from 'date-fns'
import { RRule } from 'rrule'

/**
 * People Garden model — each person has a “keep in touch” rhythm; their plant's
 * health falls as days pass beyond it. Birthdays recur yearly (rrule) so the
 * next one is always known.
 */
export type Person = { id: string; name: string; emoji: string; every: number; last: string; birthday?: string; notes?: string; phone?: string; email?: string; city?: { name: string; lat: number; lng: number; tz: string } }
export const rhythms = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Fortnightly' },
  { days: 30, label: 'Monthly' },
  { days: 90, label: 'Every season' },
]

/** 1 = thriving, 0 = wilted. Healthy until the rhythm is due, then fades over another rhythm. */
export function health(p: Person, today = new Date()) {
  const since = Math.max(0, differenceInCalendarDays(today, parseISO(p.last)))
  if (since <= p.every) return 1 - (since / p.every) * 0.25
  return Math.max(0, 0.75 - ((since - p.every) / p.every) * 0.75)
}
export const daysSince = (p: Person, today = new Date()) => Math.max(0, differenceInCalendarDays(today, parseISO(p.last)))

/** Next birthday date (yearly rule from the birth date). */
export function nextBirthday(p: Person, today = new Date()): Date | null {
  if (!p.birthday) return null
  const b = parseISO(p.birthday)
  const rule = new RRule({ freq: RRule.YEARLY, dtstart: new Date(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate(), 12)) })
  const from = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0))
  return rule.after(from, true)
}

/** Who to reach out to first: most overdue relative to their rhythm, then birthdays soon. */
export function suggestions(people: Person[], today = new Date()) {
  return [...people]
    .map((p) => {
      const nb = nextBirthday(p, today)
      const bdayIn = nb ? differenceInCalendarDays(nb, today) : 999
      return { p, due: daysSince(p, today) / p.every, bdayIn }
    })
    .filter((x) => x.due >= 1 || x.bdayIn <= 7)
    // Birthdays this week first (soonest first), then the most overdue.
    .sort((a, b) => (a.bdayIn <= 7 ? a.bdayIn - 100 : -a.due) - (b.bdayIn <= 7 ? b.bdayIn - 100 : -b.due))
}
