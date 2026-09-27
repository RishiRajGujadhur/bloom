import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

/**
 * A one-line SVG ribbon of the whole year: each day is a sliver shaded by how
 * much happened. A GSAP marker follows the chosen day; click to jump.
 */
export function YearRibbon({ days, selected, onPick }: { days: { date: string; intensity: number }[]; selected: number; onPick: (i: number) => void }) {
  const marker = useRef<SVGRectElement>(null)
  const w = 360 / Math.max(1, days.length)
  useLayoutEffect(() => {
    if (!marker.current) return
    const tw = gsap.to(marker.current, { attr: { x: selected * w - 1 }, duration: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 0.5, ease: 'power3.out' })
    return () => void tw.progress(1)
  }, [selected, w])
  return (
    <svg
      className="yr-ribbon"
      viewBox="0 0 360 26"
      preserveAspectRatio="none"
      role="slider"
      aria-label="Day of the year"
      aria-valuemin={1}
      aria-valuemax={days.length}
      aria-valuenow={selected + 1}
      tabIndex={0}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        onPick(Math.floor(((e.clientX - r.left) / r.width) * days.length))
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onPick(selected + 1)
        if (e.key === 'ArrowLeft') onPick(selected - 1)
      }}
      data-hint={days[selected] ? `${new Date(`${days[selected].date}T12:00:00`).toLocaleDateString([], { day: 'numeric', month: 'long' })} · click anywhere to jump` : undefined}
    >
      {days.map((d, i) => (
        <rect key={d.date} x={i * w} y={4} width={Math.max(0.6, w)} height="18" fill="#8f7ae5" opacity={0.12 + d.intensity * 0.88} />
      ))}
      <rect ref={marker} x="0" y="0" width={Math.max(3, w + 2)} height="26" rx="1.5" className="yr-marker" />
    </svg>
  )
}
