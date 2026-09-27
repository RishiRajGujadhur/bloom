import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

export type Stage = { from: number; name: string; emoji: string; text: string }

/**
 * A compact SVG timeline of stages (e.g. fasting): stage icons sit at their
 * hour, the filled track and a marker glide to "now" with GSAP, and the goal
 * gets a flag. Hover a stage for what happens there.
 */
export function StageTrack({ stages, hours, goal, max = 36 }: { stages: Stage[]; hours: number; goal: number; max?: number }) {
  const fill = useRef<SVGRectElement>(null)
  const marker = useRef<SVGGElement>(null)
  const x = (h: number) => 16 + (Math.min(h, max) / max) * 368
  useLayoutEffect(() => {
    const d = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2
    const tl = gsap.timeline()
    tl.to(fill.current, { attr: { width: x(hours) - 16 }, duration: d, ease: 'power2.out' }).to(marker.current, { x: x(hours), duration: d, ease: 'power2.out' }, 0)
    return () => void tl.progress(1)
  }, [hours]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg className="sg-track" viewBox="0 0 400 70" role="img" aria-label={`${hours.toFixed(1)} of ${goal} hours`}>
      <rect x="16" y="40" width="368" height="8" rx="4" className="sg-bg" />
      <rect ref={fill} x="16" y="40" width="0" height="8" rx="4" className="sg-fill" />
      {stages.filter((s) => s.from <= max).map((s) => (
        <g key={s.name} transform={`translate(${x(s.from)} 0)`} data-hint={`${s.name} (${s.from} h+): ${s.text}`} className={hours >= s.from ? 'sg-stage on' : 'sg-stage'}>
          <line y1="30" y2="52" />
          <text y="22" textAnchor="middle">{s.emoji}</text>
        </g>
      ))}
      <g transform={`translate(${x(goal)} 0)`}>
        <line y1="36" y2="60" stroke="#2e7d32" strokeWidth="2" />
        <path d="M0 58 L12 62 L0 66Z" fill="#2e7d32" />
      </g>
      <g ref={marker} transform="translate(16 0)">
        <circle cy="44" r="8" className="sg-marker" />
      </g>
    </svg>
  )
}
