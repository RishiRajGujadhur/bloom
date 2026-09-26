import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './swipe.css'

export type GuidedMood = { id: string; emoji: string; label: string; color: string; hint: string }

/** Shared guided moods: one tap, and each feature suggests the next step. */
export const guidedMoods: GuidedMood[] = [
  { id: 'calm', emoji: '😌', label: 'Calm', color: '#7fc8a9', hint: 'Keep the calm going with something gentle.' },
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#f7c948', hint: 'Use the good energy on something that matters.' },
  { id: 'energised', emoji: '⚡', label: 'Energised', color: '#f08a4b', hint: 'A great moment for your hardest thing.' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: '#8e9aaf', hint: 'Go small. One easy win counts.' },
  { id: 'anxious', emoji: '😟', label: 'Anxious', color: '#b39ddb', hint: 'Breathe first, then choose one small step.' },
  { id: 'low', emoji: '😔', label: 'Low', color: '#6c8ebf', hint: 'Be kind to yourself. Tiny is enough today.' },
  { id: 'stressed', emoji: '😣', label: 'Stressed', color: '#e57373', hint: 'Shrink the list. What can wait?' },
  { id: 'focused', emoji: '🎯', label: 'Focused', color: '#4db6ac', hint: 'Protect this focus — start a timer.' },
]
export const moodById = (id?: string | null) => guidedMoods.find((m) => m.id === id)

/** Animated one-tap mood chips; an SVG ring draws around the selected one. */
export function MoodGuide({
  value,
  onChange,
  label = 'How are you feeling?',
  moods = guidedMoods,
}: {
  value?: string | null
  onChange: (id: string) => void
  label?: string
  moods?: GuidedMood[]
}) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = root.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tw = gsap.from(el.querySelectorAll('.mood-guide-chip'), { y: 10, opacity: 0, duration: 0.3, stagger: 0.035, ease: 'power2.out' })
    return () => void tw.revert()
  }, [])
  useLayoutEffect(() => {
    const ring = root.current?.querySelector<SVGCircleElement>('[aria-pressed="true"] circle')
    if (!ring) return
    const tw = gsap.fromTo(ring, { strokeDashoffset: 120 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' })
    return () => void tw.revert()
  }, [value])
  const current = moods.find((m) => m.id === value)
  return (
    <div className="mood-guide" ref={root}>
      <span className="mood-guide-label">{label}</span>
      <div className="mood-guide-row" role="group" aria-label={label}>
        {moods.map((m) => (
          <button
            key={m.id}
            type="button"
            className="mood-guide-chip"
            aria-pressed={value === m.id}
            style={{ ['--mood' as string]: m.color }}
            onClick={() => onChange(m.id)}
          >
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle cx="22" cy="22" r="19" strokeDasharray="120" />
            </svg>
            <span className="mood-guide-emoji">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
      {current && <p className="mood-guide-hint">{current.hint}</p>}
    </div>
  )
}
