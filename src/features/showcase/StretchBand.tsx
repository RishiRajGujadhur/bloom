import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

/**
 * An elastic band that slowly lengthens and eases back while you hold a
 * stretch (GSAP), a visual cue to breathe into the stretch rather than bounce.
 */
export function StretchBand({ playing, color = '#4db6ac' }: { playing: boolean; color?: string }) {
  const path = useRef<SVGPathElement>(null)
  useEffect(() => {
    const el = path.current
    if (!el || !playing || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    tl.to(el, { attr: { d: 'M10 20 Q150 34 290 20' }, duration: 4, ease: 'sine.inOut' })
    return () => {
      tl.kill()
      el.setAttribute('d', 'M60 20 Q150 20 240 20')
    }
  }, [playing])
  return (
    <svg className="sb-band" viewBox="0 0 300 40" aria-hidden="true" style={{ ['--band' as string]: color }}>
      <path ref={path} d="M60 20 Q150 20 240 20" />
      <circle cx="10" cy="20" r="0" />
    </svg>
  )
}
