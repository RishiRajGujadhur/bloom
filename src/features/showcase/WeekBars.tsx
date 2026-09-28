import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

export type DayBar = { label: string; value: number; hint: string; today?: boolean }

/**
 * Seven stacked-plate bars for the week (SVG). Plates drop into place with
 * GSAP, today is highlighted and every bar has a hover hint.
 */
export function WeekBars({ days, unit, color = '#546e7a' }: { days: DayBar[]; unit: string; color?: string }) {
  const root = useRef<SVGSVGElement>(null)
  const max = Math.max(1, ...days.map((d) => d.value))
  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const tw = gsap.from(root.current.querySelectorAll('.wb-plate'), { y: -60, opacity: 0, stagger: 0.03, duration: 0.45, ease: 'bounce.out' })
    return () => void tw.progress(1)
  }, [days.map((d) => d.value).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg ref={root} className="wb-bars" viewBox="0 0 280 110" role="img" aria-label={`This week in ${unit}`}>
      {days.map((d, i) => {
        const plates = d.value ? Math.max(1, Math.round((d.value / max) * 6)) : 0
        const x = 12 + i * 38
        return (
          <g key={d.label} data-hint={d.hint}>
            <rect x={x - 2} y="10" width="34" height="80" fill="transparent" />
            {Array.from({ length: plates }, (_, k) => (
              <rect key={k} className="wb-plate" x={x + (k % 2) * 2} y={82 - k * 12} width={30 - (k % 2) * 4} height="10" rx="3" fill={d.today ? '#e0703f' : color} opacity={0.55 + (k / 12)} />
            ))}
            <text x={x + 15} y="104" textAnchor="middle" className={d.today ? 'wb-day today' : 'wb-day'}>{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
