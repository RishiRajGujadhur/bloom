import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ChevronDown, Sparkles } from 'lucide-react'
import { readStore, writeStore } from '../studio/Studio'
import './swipe.css'

/**
 * The same low-friction panel on every page: a collapsible card holding a
 * swipe deck and/or guided mood. Open state is remembered per feature.
 */
export function QuickPanel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const key = 'bloom-quick-open-v1'
  const [open, setOpen] = useState(() => readStore<Record<string, boolean>>(key, {})[id] ?? true)
  const body = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!open || !body.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tw = gsap.from(body.current, { height: 0, opacity: 0, duration: 0.35, ease: 'power2.out', clearProps: 'height' })
    return () => void tw.revert()
  }, [open])
  return (
    <section className="quick-panel" data-quick={id}>
      <button
        type="button"
        className="quick-panel-head"
        aria-expanded={open}
        onClick={() => {
          const next = !open
          setOpen(next)
          writeStore(key, { ...readStore<Record<string, boolean>>(key, {}), [id]: next })
        }}
      >
        <Sparkles size={15} aria-hidden="true" /> {title}
        <ChevronDown size={16} className="quick-panel-chev" aria-hidden="true" />
      </button>
      {open && (
        <div ref={body} className="quick-panel-body">
          {children}
        </div>
      )}
    </section>
  )
}

/** One shared log of guided moods from every feature (feeds Mood insights). */
export type MoodLogEntry = { feature: string; mood: string; at: number; note?: string }
export const MOOD_LOG_KEY = 'bloom-guided-mood-log-v1'
export const readMoodLog = (): MoodLogEntry[] => {
  const v = readStore<unknown>(MOOD_LOG_KEY, [])
  return Array.isArray(v) ? (v as MoodLogEntry[]) : []
}
export function logMood(feature: string, mood: string, note?: string) {
  const next = [...readMoodLog(), { feature, mood, at: Date.now(), note }].slice(-500)
  writeStore(MOOD_LOG_KEY, next)
  return next
}
export const lastMood = (feature?: string) =>
  [...readMoodLog()].reverse().find((e) => !feature || e.feature === feature)?.mood ?? null
