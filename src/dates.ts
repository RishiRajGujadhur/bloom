export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export function previousDay(day: string) {
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate()-1)
  return dayKey(date)
}
