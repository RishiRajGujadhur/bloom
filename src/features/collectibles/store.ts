import { useMemo, useSyncExternalStore } from 'react'
import { z } from 'zod'
import { dayKey } from '../../dates'
import { cars, findCar } from './catalog'

export const COLLECTIBLES_KEY = 'bloom-collectibles-v1'
const changeEvent = 'bloom-collectibles-change'
const carId = z.string().refine((id) => !!findCar(id))
const schema = z
  .object({
    version: z.literal(1),
    owned: z.array(carId),
    selected: carId.nullable(),
    lastSpin: z
      .object({
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        timestamp: z.number().nonnegative(),
        reels: z.tuple([
          z.number().int().min(1).max(7),
          z.number().int().min(1).max(7),
          z.number().int().min(1).max(7),
        ]),
        reward: carId.nullable(),
      })
      .nullable(),
  })
  .refine(
    (value) => value.selected === null || value.owned.includes(value.selected),
  )
export type Collection = z.infer<typeof schema>
export const emptyCollection: Collection = {
  version: 1,
  owned: [],
  selected: null,
  lastSpin: null,
}

export function parseCollection(raw: string | null): Collection {
  return raw === null ? emptyCollection : schema.parse(JSON.parse(raw))
}

export function canSpin(state: Collection, date = new Date()) {
  return (
    (!state.lastSpin || state.lastSpin.day < dayKey(date)) &&
    state.owned.length < cars.length
  )
}

// Both the roll and the reward are resolved before the presentation starts.
export function rollCollection(
  state: Collection,
  date = new Date(),
  random = Math.random,
): Collection {
  if (!canSpin(state, date)) return state
  const remaining = cars.filter((car) => !state.owned.includes(car.id))
  const won = random() < 1 / 3
  const reward = won
    ? remaining[
        Math.min(remaining.length - 1, Math.floor(random() * remaining.length))
      ].id
    : null
  const first = 1 + Math.floor(random() * 7)
  const second = 1 + Math.floor(random() * 7)
  // Losing rolls cannot accidentally display three matching symbols.
  const third =
    first === second ? (first % 7) + 1 : 1 + Math.floor(random() * 7)
  return {
    ...state,
    owned: reward ? [...state.owned, reward] : state.owned,
    lastSpin: {
      day: dayKey(date),
      timestamp: date.getTime(),
      reels: won ? [7, 7, 7] : [first, second, third],
      reward,
    },
  }
}

function snapshot() {
  try {
    return localStorage.getItem(COLLECTIBLES_KEY)
  } catch {
    return 'unavailable'
  }
}
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === COLLECTIBLES_KEY || event.key === null) notify()
  }
  window.addEventListener('storage', storage)
  window.addEventListener(changeEvent, notify)
  return () => {
    window.removeEventListener('storage', storage)
    window.removeEventListener(changeEvent, notify)
  }
}
export function useCollection() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null)
  return useMemo(() => {
    try {
      return { collection: parseCollection(raw), error: '' }
    } catch {
      return {
        collection: emptyCollection,
        error:
          'Your collection could not be read. Allow browser storage or restore your saved collection before playing.',
      }
    }
  }, [raw])
}

async function updateCollection(update: (state: Collection) => Collection) {
  // Serialize tabs so two simultaneous clicks still consume only one daily spin.
  if (!navigator.locks)
    throw new Error(
      'Daily rewards need a browser with Web Locks support. Please update your browser.',
    )
  return navigator.locks.request(COLLECTIBLES_KEY, () => {
    const current = parseCollection(localStorage.getItem(COLLECTIBLES_KEY))
    const next = update(current)
    if (next !== current) {
      localStorage.setItem(COLLECTIBLES_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event(changeEvent))
    }
    return next
  })
}
export const spinDaily = () =>
  updateCollection((state) => rollCollection(state))
export const selectCar = (id: string | null) =>
  updateCollection((state) => {
    if (id !== null && !state.owned.includes(id))
      throw new Error('This car is still locked.')
    return { ...state, selected: id }
  })
