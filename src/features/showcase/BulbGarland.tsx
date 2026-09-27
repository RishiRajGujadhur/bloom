import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { retention, type Epiphany } from '../epiphany/epiphanyModel'
import { usePageActions } from '../../components/ui/PageMenu'
import { subOn } from '../subFeatures'
import './showcase.css'

/** Recall right now for an insight, 0–1. */
export function recallNow(e: Epiphany, now = Date.now()) {
  const last = e.reviews.at(-1)?.at ?? e.createdAt
  return retention(e, (now - last) / 864e5)
}

/**
 * Epiphany garland: insights hang as lightbulbs on swaying wires. A bulb
 * glows as brightly as you still remember it; click to flip it over.
 */
export function BulbGarland({ list }: { list: Epiphany[] }) {
  const root = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const shown = [...list].sort((a, b) => b.createdAt - a.createdAt).slice(0, 18)
  usePageActions(shown.length ? [{ id: 'garland-flip', label: flipped.size ? 'Turn all bulbs back' : 'Flip every bulb', icon: '💡', run: () => setFlipped(flipped.size ? new Set() : new Set(shown.map((e) => e.id))) }] : [])
  useLayoutEffect(() => {
    const el = root.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('.bg-bulb', { y: -80, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
      gsap.utils.toArray<HTMLElement>('.bg-bulb').forEach((b, i) =>
        gsap.to(b, { rotate: i % 2 ? 4 : -4, transformOrigin: '50% 0%', yoyo: true, repeat: -1, duration: 2 + (i % 4) * 0.4, ease: 'sine.inOut' }),
      )
    }, el)
    return () => ctx.revert()
  }, [shown.length])
  const flip = (id: string) => {
    const card = root.current?.querySelector<HTMLElement>(`[data-bulb="${id}"] .bg-card`)
    const next = new Set(flipped)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    if (card && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(card, { rotateY: 90 }, { rotateY: 0, duration: 0.35, ease: 'power2.out' })
    setFlipped(next)
  }
  if (!subOn('epiphanies', 'garland') || !shown.length) return null
  return (
    <section ref={root} className="bg-garland" aria-label="Epiphany garland">
      <svg className="bg-wire" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 6 Q250 40 500 10 T1000 8" stroke="#6d5d4b" strokeWidth="2" fill="none" />
      </svg>
      <div className="bg-row">
        {shown.map((e) => {
          const r = recallNow(e)
          return (
            <button key={e.id} type="button" className="bg-bulb" data-bulb={e.id} onClick={() => flip(e.id)} style={{ ['--glow' as string]: r.toFixed(2) }} aria-label={`${e.text.slice(0, 60)} — ${Math.round(r * 100)}% remembered`}>
              <span className="bg-cord" aria-hidden="true" />
              <span className="bg-glass" aria-hidden="true">💡</span>
              <span className="bg-card">
                {flipped.has(e.id) ? (
                  <>
                    <small>From {e.source.title}</small>
                    <small>Next review {e.due}</small>
                    <small>{Math.round(r * 100)}% remembered</small>
                  </>
                ) : (
                  <span>{e.text.length > 90 ? `${e.text.slice(0, 90)}…` : e.text}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
