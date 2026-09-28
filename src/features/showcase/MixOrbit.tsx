import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './showcase.css'

/**
 * Mix orbit: each active sound layer circles the centre (GSAP) at a distance
 * and size set by its volume, so you can see your soundscape at a glance.
 */
export function MixOrbit({ layers, playing }: { layers: { id: string; emoji: string; label: string; volume: number }[]; playing: boolean }) {
  const ring = useRef<SVGGElement>(null)
  const active = layers.filter((l) => l.volume > 0)
  useEffect(() => {
    const el = ring.current
    if (!el || !playing || prefersReducedMotion()) return
    const spin = gsap.to(el, { rotate: 360, svgOrigin: '100 100', duration: 40, repeat: -1, ease: 'none' })
    const counter = gsap.to(el.querySelectorAll('text'), { rotate: -360, transformOrigin: '50% 50%', duration: 40, repeat: -1, ease: 'none' })
    const bob = gsap.to(el.querySelectorAll('.mo-planet'), { scale: 1.12, transformOrigin: '50% 50%', yoyo: true, repeat: -1, duration: 1.2, stagger: 0.3, ease: 'sine.inOut' })
    return () => {
      spin.kill()
      counter.kill()
      bob.kill()
    }
  }, [playing, active.length])
  return (
    <svg className="mo-orbit" viewBox="0 0 200 200" role="img" aria-label={`${active.length} sounds in the mix`}>
      {[40, 64, 88].map((r) => <circle key={r} cx="100" cy="100" r={r} className="mo-path" />)}
      <g ref={ring}>
        {active.map((l, i) => {
          const r = 40 + (1 - l.volume) * 48
          const a = (i / active.length) * Math.PI * 2
          return (
            <g key={l.id} className="mo-planet" data-hint={`${l.label} · ${Math.round(l.volume * 100)}%`}>
              <circle cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} r={10 + l.volume * 8} className="mo-bg" />
              <text x={100 + Math.cos(a) * r} y={100 + Math.sin(a) * r + 5} textAnchor="middle" fontSize={12 + l.volume * 8}>{l.emoji}</text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
