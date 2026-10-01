import { subOn } from '../subFeatures'
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, BellRing, Check, X } from 'lucide-react'
import type { AppData } from '../../model'
import { dayKey, toggleHabit } from '../../model'
import {
  REMINDERS_EVENT,
  dueReminders,
  markFired,
  readReminders,
  saveReminders,
  type Remindable,
  type ReminderState,
} from './reminderRules'
import './reminders.css'

/** Shared live reminder state (kept in sync across components). */
export function useReminders() {
  const [state, setState] = useState(readReminders)
  useEffect(() => {
    const sync = () => setState(readReminders())
    window.addEventListener(REMINDERS_EVENT, sync)
    return () => window.removeEventListener(REMINDERS_EVENT, sync)
  }, [])
  const update = useCallback((next: ReminderState) => {
    saveReminders(next)
    setState(next)
  }, [])
  return [state, update] as const
}

/** Bell button on a habit or routine card: set a daily reminder time. */
export function ReminderButton({ id, title }: { id: string; title: string }) {
  const [state, update] = useReminders()
  const reminder = state.items[id]
  const [time, setTime] = useState(reminder?.time ?? '08:00')
  const on = Boolean(reminder?.enabled)
  const permission =
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="icon-button reminder-bell"
          data-on={on}
          data-ring={subOn('reminders', 'bellAnimation')}
          aria-label={on ? `Reminder for ${title} at ${reminder.time}` : `Set a reminder for ${title}`}
          title={on ? `Reminder at ${reminder.time}` : 'Set reminder'}
        >
          {on ? <BellRing size={16} /> : <Bell size={16} />}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="reminder-pop" sideOffset={8} collisionPadding={12}>
          <strong>Remind me daily</strong>
          <label>
            <span className="sr-only">Reminder time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <div className="reminder-pop-actions">
            <Popover.Close asChild>
              <button
                className="ov-primary"
                onClick={() => {
                  update({ ...state, items: { ...state.items, [id]: { time, enabled: true } } })
                  if (permission === 'default') void Notification.requestPermission()
                }}
              >
                <Check size={15} /> Save
              </button>
            </Popover.Close>
            {on && (
              <Popover.Close asChild>
                <button
                  className="ov-secondary"
                  onClick={() => {
                    const items = { ...state.items }
                    delete items[id]
                    update({ ...state, items })
                  }}
                >
                  <BellOff size={15} /> Remove
                </button>
              </Popover.Close>
            )}
          </div>
          {permission === 'denied' && (
            <small>Browser notifications are blocked; reminders will show inside Bloom.</small>
          )}
          <Popover.Arrow className="reminder-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

type Toast = Remindable & { at: number }

/**
 * Checks reminders every 30 seconds. Fires a system notification when the tab
 * is hidden and permission is granted, and always shows an in-app card with
 * one-tap "Done" for habits.
 */
export function ReminderCenter({
  data,
  setData,
  today,
  onOpen,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  today: string
  onOpen: () => void
}) {
  const [state, update] = useReminders()
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    const check = () => {
      // Settings -> Quiet hours: hold reminders overnight.
      const quiet = (() => {
        try {
          return localStorage.getItem('bloom-quiet-hours')
        } catch {
          return null
        }
      })()
      if (quiet) {
        const [from, to] = quiet.split('-').map(Number)
        const h = new Date().getHours()
        if (from > to ? h >= from || h < to : h >= from && h < to) return
      }
      const weekday = new Date().getDay()
      const items: Remindable[] = [
        ...data.habits.map((h) => ({
          id: h.id,
          title: h.title,
          kind: 'habit' as const,
          done: h.dates.includes(today),
          scheduled: true,
        })),
        ...(data.routines ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          kind: 'routine' as const,
          done: r.dates.includes(today),
          scheduled: r.days.includes(weekday),
        })),
      ]
      const due = dueReminders(
        state,
        items.filter((i) => subOn('reminders', i.kind === 'habit' ? 'habits' : 'routines')),
        today,
        new Date(),
      )
      if (!due.length) return
      update(markFired(state, due.map((d) => d.id), today))
      setToasts((list) => [...list, ...due.map((d) => ({ ...d, at: Date.now() }))])
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        subOn('reminders', 'system') &&
        document.visibilityState === 'hidden'
      )
        for (const item of due)
          new Notification(item.kind === 'habit' ? 'Time for a small habit' : 'Routine time', {
            body: localStorage.getItem('bloom-private-notifications') === '1' ? 'Open Bloom to see it' : item.title,
            tag: `bloom-${item.id}`,
          })
    }
    check()
    const timer = setInterval(check, 30000)
    return () => clearInterval(timer)
  }, [data.habits, data.routines, state, today, update])

  const dismiss = (id: string) => setToasts((list) => list.filter((t) => t.id !== id))
  return (
    <div className="reminder-stack" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className="reminder-toast"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
          >
            <BellRing size={18} className="reminder-ring" aria-hidden="true" />
            <span>
              <small>{toast.kind === 'habit' ? 'Habit reminder' : 'Routine reminder'}</small>
              <strong>{toast.title}</strong>
            </span>
            {toast.kind === 'habit' && subOn('reminders', 'quickDone') ? (
              <button
                className="ov-primary"
                onClick={() => {
                  setData((d) => toggleHabit(d, toast.id, dayKey()))
                  dismiss(toast.id)
                }}
              >
                <Check size={15} /> Done
              </button>
            ) : (
              <button
                className="ov-primary"
                onClick={() => {
                  onOpen()
                  dismiss(toast.id)
                }}
              >
                Start
              </button>
            )}
            <button
              className="quiet-button"
              title="Remind me again in 10 minutes"
              onClick={() => {
                dismiss(toast.id)
                window.setTimeout(() => setToasts((list) => (list.some((t) => t.id === toast.id) ? list : [...list, { ...toast, at: Date.now() }])), 10 * 60000)
              }}
            >
              10 min
            </button>
            <button className="icon-button" aria-label="Dismiss reminder" onClick={() => dismiss(toast.id)}>
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
