import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { subOn } from '../subFeatures'
import './drawn.css'

/**
 * "Kurzgesagt-style" achievement moments: an illustration is drawn line by
 * line with vivus, then floods with colour. Other code dispatches
 * `announceAchievement(...)`; the host (mounted once in the app) shows it.
 */
export type AchievementKind = 'skills' | 'levels' | 'streaks'
export type Achievement = { kind: AchievementKind; title: string; subtitle: string }
const EVENT = 'bloom:achievement'

export function announceAchievement(achievement: Achievement) {
  if (!subOn('drawnAchievements', achievement.kind)) return
  window.dispatchEvent(new CustomEvent<Achievement>(EVENT, { detail: achievement }))
}

/* Each illustration is plain strokes (drawn first) + fills (faded in after). */
const art: Record<AchievementKind, string> = {
  // A branching tree growing from the ground.
  streaks: `
    <path class="d-fill" fill="#6bbf7a" d="M100 38c-26 0-44 18-44 40 0 8 3 15 8 21-12 3-20 13-20 25 0 15 13 26 28 26h56c15 0 28-11 28-26 0-12-8-22-20-25 5-6 8-13 8-21 0-22-18-40-44-40z"/>
    <path class="d-fill" fill="#8b5a2b" d="M94 150h12v34H94z"/>
    <path d="M100 184V96M100 128l-22-18M100 118l20-16M100 146l-16-10M100 140l18-12"/>
    <path d="M100 38c-26 0-44 18-44 40 0 8 3 15 8 21-12 3-20 13-20 25 0 15 13 26 28 26h56c15 0 28-11 28-26 0-12-8-22-20-25 5-6 8-13 8-21 0-22-18-40-44-40z"/>
    <path d="M40 184h120M60 184c6-8 14-8 20 0M120 184c6-8 14-8 20 0"/>
    <circle cx="78" cy="80" r="4"/><circle cx="124" cy="72" r="4"/><circle cx="112" cy="106" r="4"/>`,
  // A glowing sword with a star guard.
  skills: `
    <path class="d-fill" fill="#cfe7ff" d="M96 30h8l6 104H90z"/>
    <path class="d-fill" fill="#ffcf40" d="M70 134h60v10H70zM94 144h12v30H94z"/>
    <path d="M100 22l10 16-4 96H94l-4-96z"/>
    <path d="M100 38v94"/>
    <path d="M70 134h60v10H70zM94 144h12v30H94z"/>
    <circle cx="100" cy="182" r="8"/>
    <path d="M100 8v8M84 14l6 6M116 14l-6 6M76 30h8M116 30h8"/>`,
  // A medal with a star and ribbons.
  levels: `
    <path class="d-fill" fill="#e27396" d="M76 20h20l14 50H90zM124 20h-20L90 70h20z"/>
    <circle class="d-fill" fill="#ffcf40" cx="100" cy="120" r="48"/>
    <path class="d-fill" fill="#fff1a8" d="M100 88l9 20 22 2-17 14 5 22-19-12-19 12 5-22-17-14 22-2z"/>
    <path d="M76 20h20l14 50M124 20h-20L90 70"/>
    <circle cx="100" cy="120" r="48"/>
    <circle cx="100" cy="120" r="38"/>
    <path d="M100 88l9 20 22 2-17 14 5 22-19-12-19 12 5-22-17-14 22-2z"/>`,
}

function Drawing({ kind }: { kind: AchievementKind }) {
  const host = useRef<SVGSVGElement>(null)
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const svg = host.current
    if (!svg) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setFilled(true)
      return
    }
    let instance: { destroy: () => void } | null = null
    let cancelled = false
    void import('vivus')
      .then(({ default: Vivus }) => {
        if (cancelled) return
        instance = new Vivus(
          svg as unknown as HTMLElement,
          { type: 'oneByOne', duration: 90, animTimingFunction: Vivus.EASE_OUT, start: 'autostart' },
          () => setFilled(true),
        )
      })
      .catch(() => setFilled(true))
    // Colour arrives even if the drawing callback is slow or skipped.
    const fallback = setTimeout(() => setFilled(true), 2600)
    return () => {
      cancelled = true
      clearTimeout(fallback)
      instance?.destroy()
    }
  }, [kind])
  return (
    <svg
      ref={host}
      className={`drawn-art${filled ? ' is-filled' : ''}`}
      viewBox="0 0 200 200"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: art[kind] }}
    />
  )
}

export function AchievementHost() {
  const [queue, setQueue] = useState<Achievement[]>([])
  useEffect(() => {
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<Achievement>).detail
      setQueue((q) => (q.length > 3 ? q : [...q, detail]))
    }
    window.addEventListener(EVENT, onEvent)
    return () => window.removeEventListener(EVENT, onEvent)
  }, [])
  const current = queue[0]
  const close = () => setQueue((q) => q.slice(1))
  useEffect(() => {
    if (!current) return
    const timer = subOn('drawnAchievements', 'autoClose') ? setTimeout(close, 6500) : undefined
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [current])
  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={`${current.kind}-${current.title}`}
          className="drawn-overlay"
          role="dialog"
          aria-label={current.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="drawn-card"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="icon-button drawn-close" aria-label="Close" onClick={close}>
              <X size={18} />
            </button>
            <Drawing kind={current.kind} />
            <strong>{current.title}</strong>
            <p>{current.subtitle}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
