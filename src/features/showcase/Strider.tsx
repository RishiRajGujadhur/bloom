import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

/**
 * A little SVG runner (or walker) whose limbs swing with GSAP while you are
 * moving, and who stands still when you pause.
 */
export function Strider({ active, walk = false, color = '#e0703f' }: { active: boolean; walk?: boolean; color?: string }) {
  const svg = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const el = svg.current
    if (!el || !active || prefersReducedMotion()) return
    const swing = walk ? 22 : 40
    const d = walk ? 0.5 : 0.28
    const q = (s: string) => el.querySelector(s)
    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: d, ease: 'sine.inOut' } })
    tl.fromTo(q('.sr-leg-a'), { rotate: -swing }, { rotate: swing, svgOrigin: '30 40' }, 0)
      .fromTo(q('.sr-leg-b'), { rotate: swing }, { rotate: -swing, svgOrigin: '30 40' }, 0)
      .fromTo(q('.sr-arm-a'), { rotate: swing * 0.8 }, { rotate: -swing * 0.8, svgOrigin: '30 22' }, 0)
      .fromTo(q('.sr-arm-b'), { rotate: -swing * 0.8 }, { rotate: swing * 0.8, svgOrigin: '30 22' }, 0)
      .fromTo(q('.sr-body'), { y: 0 }, { y: walk ? -1 : -3 }, 0)
    return () => {
      tl.kill()
      gsap.set(el.querySelectorAll('g, line'), { clearProps: 'transform' })
    }
  }, [active, walk])
  return (
    <svg ref={svg} className="sr-runner" viewBox="0 0 60 72" aria-hidden="true" style={{ ['--sr' as string]: color }}>
      <g className="sr-body">
        <circle cx="32" cy="10" r="7" />
        <line x1="31" y1="17" x2="30" y2="40" />
        <line className="sr-arm-a" x1="30" y1="22" x2="30" y2="36" />
        <line className="sr-arm-b" x1="30" y1="22" x2="30" y2="36" />
        <line className="sr-leg-a" x1="30" y1="40" x2="30" y2="64" />
        <line className="sr-leg-b" x1="30" y1="40" x2="30" y2="64" />
      </g>
      <line x1="4" y1="68" x2="56" y2="68" className="sr-ground" />
    </svg>
  )
}
