import { forwardRef, useImperativeHandle, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

export type PilesHandle = { fly: (to: 'again' | 'learning' | 'known') => void }

/**
 * Three SVG card piles (due, learning, known). `fly()` sends a small card
 * from the due pile to another pile with a GSAP arc, so grading feels physical.
 */
export const CardPiles = forwardRef<PilesHandle, { due: number; learning: number; known: number }>(function CardPiles({ due, learning, known }, ref) {
  const svg = useRef<SVGSVGElement>(null)
  const piles = { again: 50, learning: 150, known: 250 }
  useImperativeHandle(ref, () => ({
    fly(to) {
      const el = svg.current?.querySelector<SVGRectElement>('.cp-fly')
      if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
      gsap.timeline()
        .set(el, { opacity: 1, x: 0, y: 0, rotate: 0 })
        .to(el, { x: piles[to] - 50, y: -30, rotate: to === 'known' ? 20 : -10, duration: 0.25, ease: 'power2.out' })
        .to(el, { y: 0, duration: 0.25, ease: 'power2.in' })
        .to(el, { opacity: 0, duration: 0.1 })
      const target = svg.current?.querySelector(`[data-pile="${to}"]`)
      if (target) gsap.fromTo(target, { scale: 1.15, transformOrigin: '50% 100%' }, { scale: 1, duration: 0.4, delay: 0.5, ease: 'back.out(3)' })
    },
  }))
  const pile = (x: number, n: number, color: string, name: string, key: string, hint: string) => (
    <g data-pile={key} data-hint={hint}>
      {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(n / 5))) }, (_, i) => (
        <rect key={i} x={x - 18 + i * 1.5} y={40 - i * 3} width="36" height="46" rx="5" fill={color} stroke="#fff" strokeWidth="2" opacity={n ? 1 : 0.3} />
      ))}
      <text x={x} y="102" textAnchor="middle" className="cp-num">{n}</text>
      <text x={x} y="116" textAnchor="middle" className="cp-lbl">{name}</text>
    </g>
  )
  return (
    <svg ref={svg} className="cp-piles" viewBox="0 0 300 120" role="img" aria-label={`${due} due, ${learning} learning, ${known} known`}>
      {pile(50, due, '#e2553f', 'due', 'again', 'Cards waiting for review today')}
      {pile(150, learning, '#f0a500', 'learning', 'learning', 'Seen, but still settling in memory')}
      {pile(250, known, '#3f8a5a', 'known', 'known', 'Reviews spaced three weeks or more apart')}
      <rect className="cp-fly" x="32" y="40" width="36" height="46" rx="5" fill="#fff" stroke="#8f7ae5" strokeWidth="2" opacity="0" />
    </svg>
  )
})
