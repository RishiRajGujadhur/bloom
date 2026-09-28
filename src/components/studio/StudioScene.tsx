import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'

/**
 * A living backdrop for studio pages: blurred colour orbs drifting slowly, a
 * flowing line that redraws itself, and a few rising motes. Colours and the
 * line's shape are per page so each studio has its own mood.
 */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function StudioScene({
  colors,
  line = 'wave',
  motes = 14,
}: {
  colors: [string, string, string]
  line?: 'wave' | 'pulse' | 'mountain' | 'none'
  motes?: number
}) {
  const root = useRef<SVGSVGElement>(null)
  const dots = useMemo(() => Array.from({ length: motes }, (_, i) => ({ x: rand(i) * 1000, y: 300 + rand(i + 50) * 300, r: 2 + rand(i + 9) * 4 })), [motes])
  const path =
    line === 'pulse'
      ? 'M0 420 L300 420 L340 360 L380 480 L420 330 L460 440 L500 420 L1000 420'
      : line === 'mountain'
        ? 'M0 520 L160 380 L260 450 L420 280 L560 420 L700 330 L860 460 L1000 380'
        : 'M0 430 C 150 360, 300 500, 500 430 S 850 360, 1000 430'

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGCircleElement>('.ss-orb').forEach((orb, i) => {
        gsap.to(orb, { x: gsap.utils.random(-120, 120), y: gsap.utils.random(-80, 80), scale: gsap.utils.random(0.8, 1.25), duration: gsap.utils.random(9, 16), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i })
      })
      gsap.fromTo('.ss-line', { strokeDashoffset: 1400 }, { strokeDashoffset: 0, duration: 6, repeat: -1, ease: 'none' })
      gsap.utils.toArray<SVGCircleElement>('.ss-mote').forEach((m) => {
        gsap.fromTo(m, { y: 0, opacity: 0 }, { y: -gsap.utils.random(160, 320), opacity: 0.7, duration: gsap.utils.random(6, 12), repeat: -1, delay: gsap.utils.random(0, 8), ease: 'sine.out', yoyo: false })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <svg ref={root} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="ss-blur">
          <feGaussianBlur stdDeviation="60" />
        </filter>
      </defs>
      <g filter="url(#ss-blur)" opacity="0.55">
        <circle className="ss-orb" cx="160" cy="120" r="170" fill={colors[0]} />
        <circle className="ss-orb" cx="820" cy="140" r="150" fill={colors[1]} />
        <circle className="ss-orb" cx="560" cy="520" r="190" fill={colors[2]} />
      </g>
      {line !== 'none' && <path className="ss-line" d={path} fill="none" stroke={colors[0]} strokeOpacity="0.35" strokeWidth="3" strokeDasharray="1400" strokeLinecap="round" strokeLinejoin="round" />}
      {dots.map((d, i) => (
        <circle key={i} className="ss-mote" cx={d.x} cy={d.y} r={d.r} fill={colors[i % 3]} opacity="0" />
      ))}
    </svg>
  )
}
