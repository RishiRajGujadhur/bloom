import { useSyncExternalStore } from 'react'
import { z } from 'zod'

export const LIFE_KEY = 'bloom-life-tools-v1'
const recordSchema = z.object({
  id: z.string(),
  tool: z.string(),
  title: z.string().max(150),
  values: z.record(z.string(), z.string()),
  created: z.number().finite(),
  updated: z.number().finite(),
  done: z.boolean(),
  next: z.string().max(150),
})
const schema = z.object({
  version: z.literal(1),
  records: z.array(recordSchema),
  preferences: z.record(
    z.string(),
    z.object({
      enabled: z.boolean().default(true),
      animate: z.boolean().default(true),
      hidden: z.array(z.string()).default([]),
    }),
  ),
})
export type LifeStore = z.infer<typeof schema>
const empty: LifeStore = { version: 1, records: [], preferences: {} }
type Snapshot = { data: LifeStore; error: string; blocked: boolean }
let snapshot: Snapshot | undefined
let lastRaw: string | null | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())
export function parseLife(raw: string): LifeStore {
  return schema.parse(JSON.parse(raw))
}
function read(): Snapshot {
  try {
    const raw = localStorage.getItem(LIFE_KEY)
    if (snapshot && raw === lastRaw) return snapshot
    lastRaw = raw
    snapshot = { data: raw ? parseLife(raw) : empty, error: '', blocked: false }
  } catch {
    snapshot = {
      data: empty,
      error:
        'Saved Life tools data could not be read. Download the original before restoring a valid backup. Saving is paused to protect it.',
      blocked: true,
    }
  }
  return snapshot
}
export function updateLife(fn: (data: LifeStore) => LifeStore) {
  const current = read()
  if (current.blocked) return false
  try {
    const next = schema.parse(fn(current.data))
    const raw = JSON.stringify(next)
    localStorage.setItem(LIFE_KEY, raw)
    lastRaw = raw
    snapshot = { data: next, error: '', blocked: false }
    emit()
    return true
  } catch {
    snapshot = {
      ...current,
      error:
        'Could not save. Your last saved records are safe. Free browser storage and try again.',
    }
    emit()
    return false
  }
}
export function restoreLife(raw: string) {
  const next = parseLife(raw)
  localStorage.setItem(LIFE_KEY, JSON.stringify(next))
  snapshot = undefined
  emit()
}
function subscribe(fn: () => void) {
  listeners.add(fn)
  const storage = (event: StorageEvent) => {
    if (event.key === LIFE_KEY || event.key === null) {
      snapshot = undefined
      fn()
    }
  }
  window.addEventListener('storage', storage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', storage)
  }
}
export function useLife() {
  return useSyncExternalStore(subscribe, read, read)
}
export const preference = (data: LifeStore, id: string) =>
  data.preferences[id] ?? { enabled: true, animate: true, hidden: [] }
