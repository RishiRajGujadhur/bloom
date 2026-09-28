import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

export type DialItem = { id: string; time: string; emoji: string; color: string; label: string; done: boolean }
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
const at = (min: number, r: number) => {
  const a = (min / 1440) * Math.PI * 2 - Math.PI / 2
  return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r]
}

/**
 * A 24-hour SVG dial: today's items sit at their times, the hand sweeps to
 * "now" with GSAP and the next item pulses. Tap an item to open it.
 */
export function DayDial({ items, onPick, now = new Date() }: { items: DialItem[]; onPick: (id: string) => void; now?: Date }) {
  const hand = useRef<SVGLineElement>(null)
  const root = useRef<SVGSVGElement>(null)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const next = [...items].filter((i) => !i.done && toMin(i.time) >= nowMin - 30).sort((a, b) => toMin(a.time) - toMin(b.time))[0]
  useLayoutEffect(() => {
    if (!hand.current || !root.current) return
    const reduced = prefersReducedMotion()
    const tl = gsap.timeline()
    tl.fromTo(hand.current, { rotate: 0 }, { rotate: (nowMin / 1440) * 360, svgOrigin: '100 100', duration: reduced ? 0 : 1.4, ease: 'power3.out' })
    tl.from(root.current.querySelectorAll('.dd-item'), { scale: 0, transformOrigin: 'center', stagger: 0.08, duration: reduced ? 0 : 0.4, ease: 'back.out(3)' }, 0.3)
    const pulse = reduced ? null : gsap.to(root.current.querySelector('.dd-item.next circle'), { attr: { r: 15 }, yoyo: true, repeat: -1, duration: 0.8, ease: 'sine.inOut' })
    return () => {
      tl.progress(1)
      pulse?.kill()
    }
  }, [nowMin, items.length])
  return (
    <svg ref={root} className="dd-dial" viewBox="0 0 200 200" role="group" aria-label="Today on a 24-hour clock">
      <circle cx="100" cy="100" r="92" className="dd-face" />
      <path d={`M${at(360, 92).join(' ')} A92 92 0 0 1 ${at(1080, 92).join(' ')}`} className="dd-daylight" />
      {Array.from({ length: 24 }, (_, h) => {
        const [x1, y1] = at(h * 60, 86)
        const [x2, y2] = at(h * 60, h % 6 ? 82 : 76)
        return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} className="dd-tick" />
      })}
      {[0, 6, 12, 18].map((h) => {
        const [x, y] = at(h * 60, 66)
        return <text key={h} x={x} y={y + 3} textAnchor="middle" className="dd-hour">{h}</text>
      })}
      <line ref={hand} x1="100" y1="100" x2="100" y2="22" className="dd-hand" />
      <circle cx="100" cy="100" r="5" className="dd-hub" />
      {items.map((i) => {
        const [x, y] = at(toMin(i.time), 92)
        return (
          <g key={i.id} className={`dd-item${next?.id === i.id ? ' next' : ''}${i.done ? ' done' : ''}`} onClick={() => onPick(i.id)} role="button" tabIndex={0} aria-label={`${i.label} at ${i.time}`} data-hint={`${i.label} · ${i.time}${i.done ? ' · done' : next?.id === i.id ? ' · up next' : ''}`} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(i.id)}>
            <circle cx={x} cy={y} r="12" fill={i.color} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize="13">{i.done ? '✓' : i.emoji}</text>
          </g>
        )
      })}
    </svg>
  )
}
