import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

/**
 * A lotus that opens as you breathe in and closes as you breathe out
 * (GSAP yoyo at the breath length). Sits behind a pose or breathing guide.
 */
export function Lotus({ seconds, running, color = '#b39ddb' }: { seconds: number; running: boolean; color?: string }) {
  const svg = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const el = svg.current
    if (!el || !running || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const petals = el.querySelectorAll<SVGPathElement>('.lo-petal')
    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: seconds / 2, ease: 'sine.inOut' } })
    tl.to(petals, { rotate: (i: number) => (i - (petals.length - 1) / 2) * 22, transformOrigin: '50% 100%' }).to(el.querySelector('.lo-glow'), { attr: { r: 70 }, opacity: 0.55 }, 0)
    return () => {
      tl.kill()
      gsap.set([...petals, el.querySelector('.lo-glow')], { clearProps: 'all' })
    }
  }, [seconds, running])
  return (
    <svg ref={svg} className="lo-lotus" viewBox="0 0 200 140" aria-hidden="true" style={{ ['--lo' as string]: color }}>
      <circle className="lo-glow" cx="100" cy="100" r="40" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} className="lo-petal" d="M100 110 C 80 80, 86 40, 100 26 C 114 40, 120 80, 100 110 Z" transform={`rotate(${(i - 2) * 8} 100 110)`} />
      ))}
      <ellipse cx="100" cy="114" rx="46" ry="8" className="lo-pad" />
    </svg>
  )
}
