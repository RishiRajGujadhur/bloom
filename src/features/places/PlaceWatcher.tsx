import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Dispatch, SetStateAction } from 'react'
import type { AppData } from '../../model'
import { toggleHabit } from '../../model'
import { subOn } from '../subFeatures'
import { insideHabits } from './lifeMap'
import { readPlaces, type PlaceHabit } from './placesStore'
import './places.css'

/**
 * App-wide geofence for place habits: while Bloom is open (never in the
 * background), watches your approximate position and, when you arrive at a
 * place tied to a habit you haven't done today, offers a one-tap check-in.
 */
export function PlaceWatcher({ data, setData, today }: { data: AppData; setData: Dispatch<SetStateAction<AppData>>; today: string }) {
  const [arrived, setArrived] = useState<PlaceHabit | null>(null)
  const seen = useRef(new Set<string>())
  const card = useRef<HTMLDivElement>(null)
  const habits = readPlaces().habits ?? []
  const active = readPlaces().enabled && habits.length > 0 && subOn('placesMap', 'placeHabits')

  useEffect(() => {
    if (!active || !navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const hit = insideHabits(readPlaces().habits ?? [], here).find((h) => !seen.current.has(`${h.id}:${today}`))
        if (!hit) return
        seen.current.add(`${hit.id}:${today}`)
        setArrived(hit)
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [active, today])

  useLayoutEffect(() => {
    if (!arrived || !card.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(card.current, { y: 60, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' })
  }, [arrived])

  if (!arrived) return null
  const habit = data.habits.find((h) => h.id === arrived.habitId)
  if (!habit || habit.dates.includes(today)) return null
  return (
    <div ref={card} className="lm-arrive" role="status">
      <span>📍 You’ve arrived at <b>{arrived.label}</b>. Check in “{habit.title}”?</span>
      <button type="button" className="ov-primary" onClick={() => { setData((d) => toggleHabit(d, habit.id, today)); setArrived(null) }}>Check in</button>
      <button type="button" className="ov-secondary" onClick={() => setArrived(null)} aria-label="Dismiss">✕</button>
    </div>
  )
}
