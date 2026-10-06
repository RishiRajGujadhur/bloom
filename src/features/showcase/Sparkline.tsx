import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'
import { pathLength } from '../../utils/svgLength'

/**
 * A compact SVG sparkline that draws itself on with GSAP; dots show values on
 * hover and a chip shows the change since the first point.
 */
export function Sparkline({ values, labels, unit, goodWhenDown = false, color = '#3f7fd0' }: { values: number[]; labels: string[]; unit: string; goodWhenDown?: boolean; color?: string }) {
  const line = useRef<SVGPathElement>(null)
  const pts = values.slice(-14)
  const lbls = labels.slice(-14)
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const xy = pts.map((v, i) => [8 + (i / Math.max(1, pts.length - 1)) * 204, 50 - ((v - min) / span) * 40])
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const delta = pts.length > 1 ? pts[pts.length - 1] - pts[0] : 0
  const good = goodWhenDown ? delta <= 0 : delta >= 0
  useLayoutEffect(() => {
    const el = line.current
    if (!el || prefersReducedMotion()) return
    const len = pathLength(el, 300)
    const tw = gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' })
    return () => void tw.progress(1)
  }, [d])
  if (pts.length < 2) return null
  return (
    <div className="spk bloom-inline">
      <svg viewBox="0 0 220 58" role="img" aria-label={`Trend: ${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${unit}`}>
        <path ref={line} d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {xy.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" className="spk-dot" data-hint={`${lbls[i]}: ${pts[i].toFixed(1)} ${unit}`} />
        ))}
      </svg>
      <span className={`spk-chip ${good ? 'good' : 'bad'}`}>
        {delta > 0 ? '▲' : delta < 0 ? '▼' : '•'} {Math.abs(delta).toFixed(1)} {unit}
      </span>
    </div>
  )
}
