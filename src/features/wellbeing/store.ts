import { useEffect, useState } from 'react'

/**
 * Small, self-contained stores for the optional wellbeing tools. They live in
 * their own localStorage keys so switching a tool off never touches AppData.
 */
export function useStoredList<T>(key: string) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
      return Array.isArray(value) ? (value as T[]) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items))
    } catch {
      /* Storage full or blocked: the list still works for this visit. */
    }
  }, [key, items])
  return [items, setItems] as const
}

export type MoodEntry = {
  id: string
  at: number
  mood: number
  note: string
  /** Detailed mode only. */
  emotions?: string[]
  energy?: number
}
/** A compact emotion wheel: core feelings and the finer words inside them. */
export const emotionWheel = [
  { core: 'Joy', color: '#f2c14e', words: ['Grateful', 'Proud', 'Hopeful', 'Playful', 'Content'] },
  { core: 'Calm', color: '#6bbf7a', words: ['Relaxed', 'Safe', 'Grounded', 'Peaceful', 'Relieved'] },
  { core: 'Sad', color: '#5aa9e6', words: ['Lonely', 'Disappointed', 'Tired', 'Hurt', 'Low'] },
  { core: 'Anxious', color: '#8f7ae5', words: ['Worried', 'Overwhelmed', 'Restless', 'Nervous', 'Unsure'] },
  { core: 'Angry', color: '#e27396', words: ['Frustrated', 'Irritated', 'Resentful', 'Annoyed', 'Stressed'] },
] as const
export type GratitudeEntry = { id: string; at: number; text: string; jarId?: string }
export type GratitudeJar = { id: string; name: string; emoji: string; color: string }
export const GRATITUDE_JARS_KEY = 'bloom-gratitude-jars-v1'
/** Notes a jar holds before it looks full; it keeps accepting more. */
export const JAR_CAPACITY = 30
export const defaultJars: GratitudeJar[] = [
  { id: 'moments', name: 'Little moments', emoji: '✨', color: '#f2a65a' },
  { id: 'people', name: 'People', emoji: '🤝', color: '#e27396' },
  { id: 'nature', name: 'Nature', emoji: '🌿', color: '#6bbf7a' },
  { id: 'self', name: 'Myself', emoji: '🌱', color: '#8f7ae5' },
  { id: 'growth', name: 'Lessons', emoji: '📚', color: '#5aa9e6' },
  { id: 'comfort', name: 'Comforts', emoji: '☕', color: '#c98b5b' },
]
/** Notes per jar, most-filled first. Older notes without a jar go to "moments". */
export function jarTotals(jars: GratitudeJar[], entries: GratitudeEntry[]) {
  return jars
    .map((jar) => ({
      jar,
      count: entries.filter((e) => (e.jarId ?? 'moments') === jar.id).length,
    }))
    .sort((a, b) => b.count - a.count)
}
export type BreathSession = { id: string; at: number; pattern: string; cycles: number }

export const MOOD_KEY = 'bloom-mood-v1'
export const GRATITUDE_KEY = 'bloom-gratitude-v1'
export const BREATH_KEY = 'bloom-breath-v1'

export const moods = [
  { value: 1, emoji: '😞', label: 'Heavy' },
  { value: 2, emoji: '🙁', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Bright' },
] as const

/** Average mood per day for the last `days` days (null when not logged). */
export function moodWeek(entries: MoodEntry[], days = 7, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (days - 1 - i))
    const next = day.getTime() + 86400000
    const values = entries
      .filter((e) => e.at >= day.getTime() && e.at < next)
      .map((e) => e.mood)
    return {
      date: day,
      mood: values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null,
    }
  })
}
