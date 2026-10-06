import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

/**
 * Day capacity as one animated SVG ring: booked time fills the ring (GSAP),
 * deep work shows as an inner arc. Replaces a row of stat boxes, so it takes
 * a fraction of the height on phones.
 */
export function CapacityRing({ capacity, booked, deep, label }: { capacity: number; booked: number; deep: number; label: (m: number) => string }) {
  const outer = useRef<SVGCircleElement>(null)
  const inner = useRef<SVGCircleElement>(null)
  const C = 2 * Math.PI * 40
  const c = 2 * Math.PI * 30
  const used = capacity ? Math.min(1, booked / capacity) : 0
  const deepShare = capacity ? Math.min(1, deep / capacity) : 0
  const over = booked > capacity && capacity > 0
  useLayoutEffect(() => {
    const d = prefersReducedMotion() ? 0 : 0.9
    const tl = gsap.timeline()
    tl.to(outer.current, { strokeDashoffset: C * (1 - used), duration: d, ease: 'power3.out' }).to(inner.current, { strokeDashoffset: c * (1 - deepShare), duration: d, ease: 'power3.out' }, 0)
    return () => void tl.progress(1)
  }, [used, deepShare, C, c])
  return (
    <div className="cap-ring bloom-inline" data-hint={`${label(booked)} of ${label(capacity)} booked · ${label(deep)} deep work`}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${Math.round(used * 100)}% of the day booked`}>
        <circle cx="50" cy="50" r="40" className="cap-track" />
        <circle ref={outer} cx="50" cy="50" r="40" className={`cap-used${over ? ' over' : ''}`} strokeDasharray={C} strokeDashoffset={C} />
        <circle cx="50" cy="50" r="30" className="cap-track thin" />
        <circle ref={inner} cx="50" cy="50" r="30" className="cap-deep" strokeDasharray={c} strokeDashoffset={c} />
        <text x="50" y="48" textAnchor="middle" className="cap-num">{Math.round(used * 100)}%</text>
        <text x="50" y="62" textAnchor="middle" className="cap-sub">booked</text>
      </svg>
      <dl>
        <div><dt>Free</dt><dd>{label(Math.max(0, capacity - booked))}</dd></div>
        <div><dt>Booked</dt><dd>{label(booked)}</dd></div>
        <div><dt>Deep</dt><dd>{label(deep)}</dd></div>
      </dl>
    </div>
  )
}
