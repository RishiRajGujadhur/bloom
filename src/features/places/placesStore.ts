/**
 * Opt-in location log. Nothing is recorded until the user turns it on; points
 * stay in this browser. Nearby points (≈150 m) are grouped into "places" so
 * patterns like "I feel best at the café" emerge.
 */
export type PlacePoint = {
  id: string
  lat: number
  lng: number
  at: number
  kind: 'mood' | 'daybook' | 'manual' | 'spend' | 'memo'
  mood: number | null
  /** Id of the thing recorded here (transaction, Daybook page, voice memo). */
  ref?: string
  /** Short label: shop name, page title or memo title. */
  label?: string
  /** Spend points: amount in minor units and the Money category. */
  amount?: number
  category?: string
}
/** A habit tied to a place: arriving there (while Bloom is open) offers a check-in. */
export type PlaceHabit = { id: string; habitId: string; lat: number; lng: number; radius: number; label: string }
export type PlacesState = { enabled: boolean; points: PlacePoint[]; names: Record<string, string>; habits?: PlaceHabit[] }
export const PLACES_KEY = 'bloom-places-v1'
export const emptyPlaces: PlacesState = { enabled: false, points: [], names: {} }

export function readPlaces(): PlacesState {
  try {
    const v = JSON.parse(localStorage.getItem(PLACES_KEY) ?? 'null') as Partial<PlacesState> | null
    return v ? { ...emptyPlaces, ...v } : emptyPlaces
  } catch {
    return emptyPlaces
  }
}
export function savePlaces(state: PlacesState) {
  try {
    localStorage.setItem(PLACES_KEY, JSON.stringify(state))
  } catch {
    /* Location simply isn't remembered. */
  }
}

/** Records the current position if the user opted in. Never throws. */
export function capturePlace(kind: PlacePoint['kind'], mood: number | null = null, extra: Pick<PlacePoint, 'ref' | 'label' | 'amount' | 'category'> = {}) {
  const state = readPlaces()
  if (!state.enabled || typeof navigator === 'undefined' || !navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const current = readPlaces()
      savePlaces({
        ...current,
        points: [
          ...current.points,
          {
            id: crypto.randomUUID(),
            // ~11 m precision is plenty and a little kinder to privacy.
            lat: Math.round(pos.coords.latitude * 10000) / 10000,
            lng: Math.round(pos.coords.longitude * 10000) / 10000,
            at: Date.now(),
            kind,
            mood,
            ...extra,
          },
        ],
      })
    },
    () => {
      /* Permission denied or unavailable: skip silently. */
    },
    { enableHighAccuracy: false, maximumAge: 5 * 60000, timeout: 10000 },
  )
}

/** Groups points into ~150 m cells with visit count and average mood. */
export function clusterPlaces(points: PlacePoint[]) {
  const cells = new Map<string, PlacePoint[]>()
  for (const p of points) {
    const key = `${Math.round(p.lat * 700)}:${Math.round(p.lng * 700)}`
    cells.set(key, [...(cells.get(key) ?? []), p])
  }
  return [...cells.entries()]
    .map(([key, list]) => {
      const moods = list.map((p) => p.mood).filter((m): m is number => m !== null)
      return {
        key,
        lat: list.reduce((a, p) => a + p.lat, 0) / list.length,
        lng: list.reduce((a, p) => a + p.lng, 0) / list.length,
        visits: list.length,
        mood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
      }
    })
    .sort((a, b) => b.visits - a.visits)
}
