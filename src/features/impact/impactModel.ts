import type { AppData } from '../../model'
import { dayKey } from '../../dates'

type Task = AppData['todos'][number]

/**
 * How "heavy" a completed task feels: priority, how long it sat overdue,
 * how many subtasks it had, and whether it was deep work. 0 = light (no
 * physics), 1–3 = heavier impacts with more EXP when shattered.
 */
export function taskWeight(task: Task, today = dayKey()): number {
  let weight = 0
  if (task.priority === 'P1') weight += 2
  else if (task.priority === 'P2') weight += 1
  const days = Math.floor(
    (new Date(`${today}T12:00:00`).getTime() - new Date(`${task.due}T12:00:00`).getTime()) / 86400000,
  )
  if (days >= 21) weight += 2
  else if (days >= 7) weight += 1
  if (task.subtasks.length >= 3) weight += 1
  if (task.planning?.deepWork) weight += 1
  return Math.min(3, weight)
}

export const impactExp = (weight: number) => [0, 10, 20, 35][Math.max(0, Math.min(3, weight))]

/** A wall hit counts as a shatter only above this speed (px per step). */
export const SHATTER_SPEED = 11
