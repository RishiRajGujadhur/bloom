import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import rough from 'roughjs'
import { pathLength } from '../../utils/svgLength'

/**
 * A hand-drawn underline and quill that ink themselves in when a page opens
 * (rough.js strokes, drawn on with GSAP). Seeded per mode so each journal
 * type has its own squiggle.
 */
export function InkFlourish({ seed, color = '#d9653b' }: { seed: number; color?: string }) {
  const svg = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const el = svg.current
    if (!el) return
    el.innerHTML = ''
    const rc = rough.svg(el)
    const line = rc.path('M6 22 C 80 8, 160 30, 240 16 S 380 10, 420 20', { stroke: color, strokeWidth: 2.4, roughness: 1.4, bowing: 2, seed })
    const dot = rc.circle(432, 20, 7, { fill: color, fillStyle: 'solid', stroke: color, seed })
    el.append(line, dot)
    if (prefersReducedMotion()) return
    const paths = el.querySelectorAll('path')
    const tl = gsap.timeline()
    paths.forEach((p) => {
      const len = pathLength(p, 400)
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
    })
    tl.to(paths, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.05 })
    return () => void tl.kill()
  }, [seed, color])
  return <svg ref={svg} className="ink-flourish" viewBox="0 0 440 34" aria-hidden="true" />
}
