import { dayKey, previousDay } from '../dates'

export function habitStats(dates: string[], today: string) {
  const days = [...new Set(dates.filter((d) => d <= today))].sort()
  const completed = new Set(days)
  let current = 0
  let cursor = completed.has(today) ? today : previousDay(today)
  while (completed.has(cursor)) {
    current++
    cursor = previousDay(cursor)
  }
  let best = 0
  let chain = 0
  days.forEach((day, index) => {
    chain = index > 0 && days[index - 1] === previousDay(day) ? chain + 1 : 1
    best = Math.max(best, chain)
  })
  return { current, best, total: days.length }
}

export function gridDays(today: string, weeks = 20) {
  const end = new Date(`${today}T12:00:00`)
  end.setDate(end.getDate() + 6 - end.getDay())
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(end)
    date.setDate(date.getDate() - weeks * 7 + 1 + index)
    return dayKey(date)
  })
}
