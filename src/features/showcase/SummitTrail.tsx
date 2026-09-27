import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import './showcase.css'

gsap.registerPlugin(MotionPathPlugin)
export type Climber = { id: string; label: string; progress: number; color: string; emoji: string }
const TRAIL = 'M10 150 C 70 150, 80 110, 130 112 S 200 70, 250 78 S 330 30, 390 22'

/**
 * Summit trail: every active challenge is a climber walking a winding SVG
 * path; GSAP MotionPath moves each one to its progress. Flags mark the top.
 */
export function SummitTrail({ climbers, onPick }: { climbers: Climber[]; onPick: (id: string) => void }) {
  const root = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const svg = root.current
    // MotionPath needs real SVG geometry (absent in test DOMs).
    if (!svg || typeof svg.getCTM !== 'function') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const tweens = climbers.map((c) =>
      gsap.fromTo(
        svg.querySelector(`[data-climber="${c.id}"]`),
        { motionPath: { path: '#st-trail', align: '#st-trail', alignOrigin: [0.5, 0.9], start: 0, end: 0 } },
        { motionPath: { path: '#st-trail', align: '#st-trail', alignOrigin: [0.5, 0.9], start: 0, end: Math.max(0.02, Math.min(1, c.progress)) }, duration: reduced ? 0 : 1.6, ease: 'power2.inOut' },
      ),
    )
    const flag = reduced ? null : gsap.to(svg.querySelector('.stl-flag'), { skewY: 12, transformOrigin: '0% 50%', yoyo: true, repeat: -1, duration: 0.6, ease: 'sine.inOut' })
    return () => {
      tweens.forEach((t) => t.progress(1))
      flag?.kill()
    }
  }, [climbers.map((c) => `${c.id}:${c.progress}`).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!climbers.length) return null
  return (
    <svg ref={root} className="stl" viewBox="0 0 400 170" role="group" aria-label="Your challenges as climbers on a trail">
      <path d="M0 170 L110 90 L170 120 L260 40 L330 80 L400 10 L400 170Z" className="stl-mountain" />
      <path d="M240 58 L260 40 L280 58 Z" className="stl-snow" />
      <path id="st-trail" d={TRAIL} className="stl-trail" />
      <g transform="translate(386 22)">
        <line x1="0" y1="0" x2="0" y2="-26" stroke="#5d4037" strokeWidth="2.5" />
        <path className="stl-flag" d="M0 -26 L18 -20 L0 -14 Z" fill="#e2553f" />
      </g>
      {climbers.map((c) => (
        <g key={c.id} data-climber={c.id} className="stl-climber" role="button" tabIndex={0} aria-label={`${c.label}: ${Math.round(c.progress * 100)}%`} data-hint={`${c.label} · ${Math.round(c.progress * 100)}% up the trail`} onClick={() => onPick(c.id)}>
          <circle r="11" fill={c.color} stroke="#fff" strokeWidth="2.5" />
          <text y="4.5" textAnchor="middle" fontSize="12">{c.emoji}</text>
        </g>
      ))}
    </svg>
  )
}
