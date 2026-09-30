import { prefersReducedMotion } from '../../utils/motion'
import { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { MOTIFS, linePath, type Motif } from './studioMotifs'

/**
 * A living backdrop for studio pages: blurred colour orbs drifting slowly, a
 * flowing line, rising motes, and a motif that belongs to the page — coins
 * fall on Money, brackets rise on Code, chess pieces march on Chess, notes
 * sway on Sounds — each with its own GSAP choreography.
 */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Studio shares its name so the scene can pick the page's motif. */
export const StudioNameContext = createContext<string>('')

function animate(el: Element, m: Motif, i: number) {
  const r = gsap.utils.random
  switch (m.anim) {
    case 'fall': return gsap.fromTo(el, { y: -120, rotation: r(-40, 40) }, { y: 760, rotation: `+=${r(-180, 180)}`, duration: r(9, 16), repeat: -1, delay: -r(0, 16), ease: 'none' })
    case 'rise': return gsap.fromTo(el, { y: 700, opacity: 0 }, { y: -120, opacity: 0.9, duration: r(10, 18), repeat: -1, delay: -r(0, 18), ease: 'sine.inOut' })
    case 'drift': return gsap.to(el, { x: `+=${r(-160, 160)}`, y: `+=${r(-60, 60)}`, rotation: r(-20, 20), duration: r(8, 14), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.3 })
    case 'spin': return gsap.to(el, { rotation: r(0, 1) > 0.5 ? 360 : -360, transformOrigin: '50% 50%', duration: r(12, 24), repeat: -1, ease: 'none' })
    case 'pulse': return gsap.to(el, { scale: r(1.2, 1.5), opacity: 0.25, transformOrigin: '50% 50%', duration: r(3, 6), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.4 })
    case 'march': return gsap.fromTo(el, { x: -200 }, { x: 1200, duration: r(18, 30), repeat: -1, delay: -r(0, 30), ease: 'none' })
    case 'flip': return gsap.to(el, { scaleX: -1, transformOrigin: '50% 50%', duration: r(1.4, 2.4), repeat: -1, yoyo: true, repeatDelay: r(1, 4), ease: 'power2.inOut', delay: i * 0.5 })
    case 'blink': return gsap.to(el, { opacity: 0.05, duration: 0.18, repeat: -1, yoyo: true, repeatDelay: r(2, 6), delay: i * 0.7 })
    case 'orbit': return gsap.to(el, { rotation: 360, transformOrigin: `${r(-200, 200)}px ${r(-120, 120)}px`, duration: r(20, 36), repeat: -1, ease: 'none' })
    default: return gsap.to(el, { rotation: r(-18, 18), y: `+=${r(-30, 30)}`, transformOrigin: '50% 100%', duration: r(2.5, 4.5), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.3 })
  }
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
  const name = useContext(StudioNameContext)
  const motif = MOTIFS[name]
  const root = useRef<SVGSVGElement>(null)
  const dots = useMemo(() => Array.from({ length: motes }, (_, i) => ({ x: rand(i) * 1000, y: 300 + rand(i + 50) * 300, r: 2 + rand(i + 9) * 4 })), [motes])
  const glyphs = useMemo(() => (motif ? Array.from({ length: motif.count }, (_, i) => ({ g: motif.glyphs[i % motif.glyphs.length], x: 40 + rand(i + 300) * 920, y: 60 + rand(i + 400) * 480, s: motif.size[0] + rand(i + 500) * (motif.size[1] - motif.size[0]) })) : []), [motif])
  // Each page gets its own line; the prop's style is the fallback for unnamed studios.
  const path = name
    ? linePath(name)
    : line === 'pulse'
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
      gsap.fromTo('.ss-line', { strokeDashoffset: 1600 }, { strokeDashoffset: 0, duration: 6, repeat: -1, ease: 'none' })
      gsap.utils.toArray<SVGCircleElement>('.ss-mote').forEach((m) => {
        gsap.fromTo(m, { y: 0, opacity: 0 }, { y: -gsap.utils.random(160, 320), opacity: 0.7, duration: gsap.utils.random(6, 12), repeat: -1, delay: gsap.utils.random(0, 8), ease: 'sine.out', yoyo: false })
      })
      if (motif) gsap.utils.toArray<SVGTextElement>('.ss-glyph').forEach((g, i) => animate(g, motif, i))
    }, root)
    return () => ctx.revert()
  }, [motif])

  return (
    <svg ref={root} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" data-motif={name || undefined}>
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
      {line !== 'none' && <path className="ss-line" d={path} fill="none" stroke={colors[0]} strokeOpacity="0.35" strokeWidth="3" strokeDasharray="1600" strokeLinecap="round" strokeLinejoin="round" />}
      {glyphs.map((g, i) => (
        <text key={i} className="ss-glyph" x={g.x} y={g.y} fontSize={g.s} fill={colors[i % 3]} opacity={0.22 + rand(i + 600) * 0.18} textAnchor="middle" style={{ fontWeight: 800 }}>{g.g}</text>
      ))}
      {dots.map((d, i) => (
        <circle key={i} className="ss-mote" cx={d.x} cy={d.y} r={d.r} fill={colors[i % 3]} opacity="0" />
      ))}
    </svg>
  )
}
