import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { X } from 'lucide-react'
import type { GratitudeEntry, GratitudeJar } from '../wellbeing/store'
import { usePageActions } from '../../components/ui/PageMenu'
import { subOn } from '../subFeatures'
import './showcase.css'

gsap.registerPlugin(Flip)
const reduced = () => !!prefersReducedMotion()
const tilt = (id: string) => ((id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % 11) - 5

/**
 * Gratitude letter wall: every note is a little envelope pinned to a cork
 * board under string lights. Filtering by jar reflows with GSAP Flip;
 * opening one unfolds the letter.
 */
export function LetterWall({ entries, jars }: { entries: GratitudeEntry[]; jars: GratitudeJar[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [open, setOpen] = useState<GratitudeEntry | null>(null)
  const board = useRef<HTMLDivElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)
  const letter = useRef<HTMLDivElement>(null)
  const shown = useMemo(() => [...entries].sort((a, b) => b.at - a.at).filter((e) => filter === 'all' || (e.jarId ?? 'moments') === filter).slice(0, 24), [entries, filter])
  const pick = (f: string) => {
    if (board.current && !reduced()) flipState.current = Flip.getState(board.current.querySelectorAll('.lw-note'))
    setFilter(f)
  }
  useLayoutEffect(() => {
    if (!flipState.current) return
    Flip.from(flipState.current, { duration: 0.6, ease: 'power2.inOut', stagger: 0.02, absolute: true, onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4 }), onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.6, duration: 0.3 }) })
    flipState.current = null
  }, [filter])
  useLayoutEffect(() => {
    if (!board.current || reduced()) return
    const tw = gsap.from(board.current.querySelectorAll('.lw-note'), { y: -40, opacity: 0, rotate: () => gsap.utils.random(-25, 25), stagger: 0.04, duration: 0.6, ease: 'bounce.out' })
    const lights = gsap.to(board.current.parentElement!.querySelectorAll('.lw-bulb'), { opacity: 0.35, duration: 0.8, stagger: { each: 0.15, repeat: -1, yoyo: true } })
    return () => {
      tw.progress(1)
      lights.kill()
    }
  }, [])
  useLayoutEffect(() => {
    if (!open || !letter.current || reduced()) return
    const tl = gsap.timeline()
    tl.from(letter.current, { scale: 0.3, rotate: -12, opacity: 0, duration: 0.45, ease: 'back.out(1.7)' }).from(letter.current.querySelector('.lw-flap'), { rotateX: 0, duration: 0.4 }, '-=0.1').from(letter.current.querySelector('.lw-paper'), { y: 60, opacity: 0, duration: 0.45, ease: 'power2.out' }, '-=0.2')
    return () => void tl.progress(1)
  }, [open])
  usePageActions(
    entries.length
      ? [{ id: 'wall-random', label: 'Open a random letter', icon: '💌', run: () => setOpen(entries[Math.floor(Math.random() * entries.length)]) }]
      : [],
  )
  if (!subOn('gratitude', 'letterWall') || !entries.length) return null
  const jarOf = (e: GratitudeEntry) => jars.find((j) => j.id === (e.jarId ?? 'moments'))
  return (
    <section className="lw-wrap" aria-label="Letter wall">
      <svg className="lw-lights" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 4 Q100 26 200 8 T400 6" stroke="#5d4037" strokeWidth="1.5" fill="none" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} className="lw-bulb" cx={16 + i * 33} cy={10 + Math.sin(i) * 6} r="4.5" fill={['#ffd54f', '#f48fb1', '#81d4fa', '#aed581'][i % 4]} />
        ))}
      </svg>
      <div className="studio-chip-row lw-filters" role="group" aria-label="Filter letters">
        <button type="button" className="studio-chip" aria-pressed={filter === 'all'} onClick={() => pick('all')}>All letters</button>
        {jars.map((j) => (
          <button key={j.id} type="button" className="studio-chip" aria-pressed={filter === j.id} onClick={() => pick(j.id)}>
            {j.emoji} {j.name}
          </button>
        ))}
      </div>
      <div ref={board} className="lw-board">
        {shown.map((e) => (
          <button key={e.id} type="button" data-flip-id={e.id} className="lw-note" style={{ ['--tilt' as string]: `${tilt(e.id)}deg`, ['--jar' as string]: jarOf(e)?.color ?? '#f2a65a' }} onClick={() => setOpen(e)} data-cursor-text="Read">
            <span className="lw-pin" aria-hidden="true" />
            <span className="lw-env" aria-hidden="true">{jarOf(e)?.emoji ?? '💌'}</span>
            <small>{new Date(e.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</small>
            <span className="lw-peek">{e.text.slice(0, 40)}{e.text.length > 40 ? '…' : ''}</span>
          </button>
        ))}
      </div>
      {open &&
        createPortal(
          <div className="lw-modal" role="dialog" aria-modal="true" aria-label="Gratitude letter" onClick={() => setOpen(null)}>
            <div ref={letter} className="lw-letter" onClick={(ev) => ev.stopPropagation()} style={{ ['--jar' as string]: jarOf(open)?.color ?? '#f2a65a' }}>
              <span className="lw-flap" aria-hidden="true" />
              <div className="lw-paper">
                <small>{new Date(open.at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
                <p>{open.text}</p>
                <span className="lw-sign">— {jarOf(open)?.emoji} {jarOf(open)?.name}</span>
              </div>
              <button type="button" className="icon-button lw-close" aria-label="Close letter" onClick={() => setOpen(null)}>
                <X size={18} />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
