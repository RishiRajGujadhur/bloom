import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

/**
 * A friendly SVG eye: the pupil follows the pointer (GSAP quickTo), it blinks
 * now and then, and the ring around it counts down to your next eye break.
 */
export function WatchEye({ minutesLeft, every }: { minutesLeft: number; every: number }) {
  const svg = useRef<SVGSVGElement>(null)
  const C = 2 * Math.PI * 56
  const share = Math.max(0, Math.min(1, minutesLeft / every))
  useEffect(() => {
    const el = svg.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const pupil = el.querySelector('.we-pupil')
    const x = gsap.quickTo(pupil, 'x', { duration: 0.35, ease: 'power3' })
    const y = gsap.quickTo(pupil, 'y', { duration: 0.35, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(14, d / 12)
      x((dx / d) * k)
      y((dy / d) * k * 0.7)
    }
    const lids = el.querySelectorAll('.we-lid')
    const blink = gsap.timeline({ repeat: -1, repeatDelay: 3.2 }).to(lids, { scaleY: 1, transformOrigin: '50% 50%', duration: 0.09 }).to(lids, { scaleY: 0, duration: 0.14 })
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      blink.kill()
    }
  }, [])
  return (
    <svg ref={svg} className="we-eye" viewBox="0 0 140 140" role="img" aria-label={`Next eye break in ${Math.ceil(minutesLeft)} minutes`} data-hint={`20-20-20: look 20 ft away for 20 s · next in ${Math.ceil(minutesLeft)} min`}>
      <circle cx="70" cy="70" r="56" className="we-track" />
      <circle cx="70" cy="70" r="56" className="we-ring" strokeDasharray={C} strokeDashoffset={C * (1 - share)} />
      <path d="M22 70 Q70 26 118 70 Q70 114 22 70 Z" className="we-white" />
      <g className="we-pupil">
        <circle cx="70" cy="70" r="17" fill="#3f7fd0" />
        <circle cx="70" cy="70" r="8" fill="#1b1b2f" />
        <circle cx="75" cy="64" r="3.5" fill="#fff" />
      </g>
      <path className="we-lid" d="M22 70 Q70 26 118 70 Q70 26 22 70 Z" transform="scale(1 0)" style={{ transformOrigin: '50% 50%' }} />
      <path className="we-lid" d="M22 70 Q70 114 118 70 Q70 114 22 70 Z" transform="scale(1 0)" style={{ transformOrigin: '50% 50%' }} />
      <text x="70" y="132" textAnchor="middle" className="we-time">{Math.ceil(minutesLeft)} min</text>
    </svg>
  )
}
