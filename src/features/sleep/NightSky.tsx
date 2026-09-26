import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'

/**
 * Animated night sky for the Sleep page: twinkling stars, a softly glowing
 * moon, drifting clouds and the occasional shooting star. The moon's phase
 * follows your average sleep quality (fuller = better rested).
 */
const rand = (i: number) => {
  const x = Math.sin(i * 91.7 + 13.3) * 43758.5453
  return x - Math.floor(x)
}

export function NightSky({ quality, children }: { quality: number; children?: React.ReactNode }) {
  const root = useRef<SVGSVGElement>(null)
  const stars = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ x: rand(i) * 1000, y: rand(i + 99) * 170, r: 0.6 + rand(i + 7) * 1.6 })),
    [],
  )
  // Phase: 0 = new moon, 1 = full. Offset shadow circle creates the crescent.
  const phase = Math.max(0.15, Math.min(1, quality / 5))
  const shadowX = 870 + phase * 70

  useLayoutEffect(() => {
    const svg = root.current
    if (!svg || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGCircleElement>('.ns-star').forEach((star) => {
        gsap.to(star, {
          opacity: gsap.utils.random(0.15, 0.5),
          duration: gsap.utils.random(0.8, 2.6),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: gsap.utils.random(0, 2),
        })
      })
      gsap.to('.ns-moon-glow', { scale: 1.15, opacity: 0.35, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: '50% 50%' })
      gsap.utils.toArray<SVGGElement>('.ns-cloud').forEach((cloud, i) => {
        gsap.fromTo(cloud, { x: -260 - i * 180 }, { x: 1200, duration: 70 + i * 25, repeat: -1, ease: 'none', delay: -i * 20 })
      })
      gsap
        .timeline({ repeat: -1, repeatDelay: 5 })
        .fromTo('.ns-shooting', { x: 0, y: 0, opacity: 0 }, { opacity: 1, duration: 0.1 })
        .to('.ns-shooting', { x: -260, y: 90, duration: 0.9, ease: 'power2.in' }, 0)
        .to('.ns-shooting', { opacity: 0, duration: 0.3 }, 0.6)
    }, svg)
    return () => ctx.revert()
  }, [])

  return (
    <div className="night-sky">
      <svg ref={root} viewBox="0 0 1000 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="ns-bg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#101437" />
            <stop offset="0.7" stopColor="#2a2d6b" />
            <stop offset="1" stopColor="#4a3b7a" />
          </linearGradient>
          <radialGradient id="ns-glow">
            <stop offset="0" stopColor="#fff6c8" stopOpacity="0.8" />
            <stop offset="1" stopColor="#fff6c8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ns-tail" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
          </linearGradient>
          <mask id="ns-phase">
            <circle cx="900" cy="62" r="30" fill="#fff" />
            <circle cx={shadowX} cy="56" r="30" fill="#000" />
          </mask>
        </defs>
        <rect width="1000" height="200" fill="url(#ns-bg)" />
        {stars.map((s, i) => (
          <circle key={i} className="ns-star" cx={s.x} cy={s.y} r={s.r} fill="#fff" />
        ))}
        <circle className="ns-moon-glow" cx="900" cy="62" r="70" fill="url(#ns-glow)" opacity="0.25" />
        <circle cx="900" cy="62" r="30" fill="#2a2d6b" />
        <g mask="url(#ns-phase)">
          <circle cx="900" cy="62" r="30" fill="#fff3c4" />
          <circle cx="890" cy="54" r="5" fill="#e8dca6" />
          <circle cx="908" cy="72" r="7" fill="#e8dca6" />
          <circle cx="914" cy="50" r="3" fill="#e8dca6" />
        </g>
        <g className="ns-shooting" opacity="0">
          <line x1="700" y1="20" x2="780" y2="-10" stroke="url(#ns-tail)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i} className="ns-cloud" transform={`translate(0 ${110 + i * 26})`} opacity={0.18 + i * 0.07}>
            <ellipse cx="60" cy="0" rx="60" ry="14" fill="#c8c2e8" />
            <ellipse cx="100" cy="-8" rx="40" ry="14" fill="#c8c2e8" />
            <ellipse cx="30" cy="-6" rx="28" ry="10" fill="#c8c2e8" />
          </g>
        ))}
        <path d="M0 200 L0 176 Q120 150 260 170 T520 168 T780 160 T1000 172 L1000 200 Z" fill="#1a1740" />
      </svg>
      <div className="night-sky-content">{children}</div>
    </div>
  )
}
