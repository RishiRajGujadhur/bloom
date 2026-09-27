import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useDrag } from '@use-gesture/react'
import gsap from 'gsap'
import { Check, Undo2, X } from 'lucide-react'
import './swipe.css'

export type SwipeCard = { id: string; title: string; detail?: string; emoji?: string }

/**
 * Tinder-style yes / no deck. Drag a card right for yes, left for no, or use
 * the buttons and arrow keys. Cards fling off with GSAP and an SVG stamp
 * draws itself in. Low friction: one gesture per decision.
 */
export function SwipeDeck<T extends SwipeCard>({
  cards,
  onSwipe,
  yes = 'Yes',
  no = 'No',
  empty,
  label = 'Swipe to decide',
  render,
  onUndo,
}: {
  cards: T[]
  onSwipe: (card: T, answer: boolean) => void
  yes?: string
  no?: string
  empty?: ReactNode
  label?: string
  render?: (card: T) => ReactNode
  onUndo?: (card: T, answer: boolean) => void
}) {
  const [history, setHistory] = useState<{ card: T; answer: boolean }[]>([])
  const top = useRef<HTMLDivElement>(null)
  const stampYes = useRef<SVGSVGElement>(null)
  const stampNo = useRef<SVGSVGElement>(null)
  const decided = new Set(history.map((h) => h.card.id))
  const visible = cards.filter((c) => !decided.has(c.id))
  const card = visible[0]
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useLayoutEffect(() => {
    if (!top.current || reduced) return
    const tw = gsap.fromTo(top.current, { y: 18, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.6)' })
    return () => void tw.revert()
  }, [card?.id, reduced])

  const stamp = (answer: boolean, amount: number) => {
    const s = answer ? stampYes.current : stampNo.current
    const o = answer ? stampNo.current : stampYes.current
    if (s) s.style.opacity = String(Math.min(1, amount))
    if (o) o.style.opacity = '0'
  }

  const decide = (answer: boolean) => {
    if (!card) return
    let fired = false
    const done = () => {
      if (fired) return
      fired = true
      onSwipe(card, answer)
      setHistory((h) => [...h, { card, answer }])
    }
    if (!top.current || reduced) return done()
    stamp(answer, 1)
    gsap.to(top.current, { x: answer ? 420 : -420, rotate: answer ? 22 : -22, opacity: 0, duration: 0.32, ease: 'power2.in', onComplete: done })
    window.setTimeout(done, 380)
  }

  const undo = () => {
    const last = history.at(-1)
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    onUndo?.(last.card, last.answer)
  }

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
      const el = top.current
      if (!el) return
      if (!down) {
        if (Math.abs(mx) > 110 || (vx > 0.6 && Math.abs(mx) > 40)) return decide((mx || dx) > 0)
        stamp(true, 0)
        return void gsap.to(el, { x: 0, rotate: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
      }
      gsap.set(el, { x: mx, rotate: mx / 14 })
      stamp(mx > 0, Math.abs(mx) / 110)
    },
    { axis: 'x', filterTaps: true },
  )

  return (
    <div
      className="swipe-deck"
      role="group"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') decide(true)
        if (e.key === 'ArrowLeft') decide(false)
        if (e.key === 'Backspace') undo()
      }}
    >
      <div className="swipe-stack">
        {card ? (
          <>
            {visible[1] && <div className="swipe-card swipe-under" aria-hidden="true" />}
            <div key={card.id} ref={top} className="swipe-card" data-cursor-text="Drag" {...bind()}>
              <svg ref={stampYes} className="swipe-stamp yes" viewBox="0 0 90 40" aria-hidden="true">
                <rect x="3" y="3" width="84" height="34" rx="8" />
                <text x="45" y="27">{yes}</text>
              </svg>
              <svg ref={stampNo} className="swipe-stamp no" viewBox="0 0 90 40" aria-hidden="true">
                <rect x="3" y="3" width="84" height="34" rx="8" />
                <text x="45" y="27">{no}</text>
              </svg>
              {render ? (
                render(card)
              ) : (
                <>
                  {card.emoji && <span className="swipe-emoji">{card.emoji}</span>}
                  <strong>{card.title}</strong>
                  {card.detail && <p>{card.detail}</p>}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="swipe-empty">{empty ?? 'All done. Nice.'}</div>
        )}
      </div>
      <div className="swipe-actions">
        <button type="button" data-cursor-stick className="swipe-btn no" onClick={() => decide(false)} disabled={!card} aria-label={no}>
          <X size={20} />
        </button>
        <button type="button" className="swipe-btn undo" onClick={undo} disabled={!history.length} aria-label="Undo">
          <Undo2 size={16} />
        </button>
        <button type="button" data-cursor-stick className="swipe-btn yes" onClick={() => decide(true)} disabled={!card} aria-label={yes}>
          <Check size={20} />
        </button>
      </div>
      <small className="swipe-count">{history.length}/{history.length + visible.length}</small>
    </div>
  )
}
