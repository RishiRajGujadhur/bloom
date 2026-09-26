/**
 * Reminder rules for habits and routines, kept pure for testing.
 * A reminder fires once per day, at or after its time, only when the item
 * is still open today (and, for routines, only on their scheduled days).
 */
export type Reminder = { time: string; enabled: boolean }
export type ReminderMap = Record<string, Reminder>
export type ReminderState = { items: ReminderMap; fired: Record<string, string> }

export const REMINDERS_KEY = 'bloom-reminders-v1'
export const REMINDERS_EVENT = 'bloom:reminders-changed'
export const emptyReminders: ReminderState = { items: {}, fired: {} }

export type Remindable = {
  id: string
  title: string
  kind: 'habit' | 'routine'
  /** Already completed today? */
  done: boolean
  /** Scheduled today (routines use weekday lists; habits are daily). */
  scheduled: boolean
}

const minutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function dueReminders(
  state: ReminderState,
  items: Remindable[],
  today: string,
  now: Date,
) {
  const current = now.getHours() * 60 + now.getMinutes()
  return items.filter((item) => {
    const reminder = state.items[item.id]
    return (
      reminder?.enabled &&
      item.scheduled &&
      !item.done &&
      state.fired[item.id] !== today &&
      current >= minutes(reminder.time) &&
      // Don't nag about a reminder that is more than 3 hours stale.
      current - minutes(reminder.time) <= 180
    )
  })
}

export function markFired(state: ReminderState, ids: string[], today: string): ReminderState {
  if (!ids.length) return state
  const fired = { ...state.fired }
  for (const id of ids) fired[id] = today
  return { ...state, fired }
}

export function readReminders(): ReminderState {
  try {
    const value = JSON.parse(localStorage.getItem(REMINDERS_KEY) ?? 'null') as Partial<ReminderState> | null
    return value ? { ...emptyReminders, ...value } : emptyReminders
  } catch {
    return emptyReminders
  }
}

export function saveReminders(state: ReminderState) {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(state))
  } catch {
    /* Reminders still run for this visit. */
  }
  window.dispatchEvent(new Event(REMINDERS_EVENT))
}
