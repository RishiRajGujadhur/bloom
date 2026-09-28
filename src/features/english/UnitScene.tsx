import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import type { AvatarDrawing } from '../../components/ui/avatarStyle'

/**
 * Every unit on the path has a theme: a weather effect, a tiny story and a
 * cast from Bloom's avatars. The effect is an SVG layer animated with GSAP.
 */
export type Effect = 'fireflies' | 'fire' | 'rain' | 'wind' | 'stars' | 'leaves' | 'snow' | 'storm'
export type UnitTheme = { effect: Effect; place: string; story: string; cast: { face: AvatarDrawing; name: string }[]; sky: [string, string] }

export const unitThemes: Record<string, UnitTheme> = {
  hello: { effect: 'fireflies', place: 'Petal Plaza at dusk', sky: ['#2b2350', '#58cc02'], story: 'Mochi blushes every time someone says hi. Teach her the greetings so she can say hello without glowing pink.', cast: [{ face: 'orb', name: 'Mochi' }, { face: 'bloom', name: 'Bloom' }] },
  food: { effect: 'fire', place: 'Sparky’s kitchen', sky: ['#3a1206', '#ff9600'], story: 'Sparky tried to order toast and set the kitchen on fire. Learn the food words before the smoke alarm starts singing.', cast: [{ face: 'spark', name: 'Sparky' }] },
  home: { effect: 'rain', place: 'Bloom’s house in a storm', sky: ['#1c2b3f', '#1cb0f6'], story: 'Rain traps everyone indoors. Pix wants a room-by-room tour, in English, with commentary.', cast: [{ face: 'pixel', name: 'Pix' }, { face: 'bloom', name: 'Bloom' }] },
  daily: { effect: 'wind', place: 'Windy Hill', sky: ['#bfe6ff', '#ce82ff'], story: 'A gust blew Beacon’s schedule off the hill. Help put the day back in order, from wake-up to bedtime.', cast: [{ face: 'beacon', name: 'Beacon' }] },
  travel: { effect: 'stars', place: 'The night train', sky: ['#070d1c', '#4a5fd6'], story: 'Professor Globe keeps missing the night train. Read the tickets, maps and signs with him before it leaves.', cast: [{ face: 'globe', name: 'Professor Globe' }] },
  feelings: { effect: 'leaves', place: 'Autumn garden', sky: ['#4a2a10', '#2ec4b6'], story: 'Mochi changes colour with every feeling. Name them all so she knows why she’s teal today.', cast: [{ face: 'orb', name: 'Mochi' }] },
  work: { effect: 'snow', place: 'The Gear Factory', sky: ['#1a1f2e', '#8f7ae5'], story: 'Tinker’s first day at the Gear Factory — and it’s snowing on the roof. Help him survive the interview and the meetings.', cast: [{ face: 'tinker', name: 'Tinker' }] },
  ideas: { effect: 'storm', place: 'Debate Tower', sky: ['#0d0d12', '#ffc800'], story: 'UNIT-7 insists robots are better debaters. Out-argue it — thunder and lightning optional.', cast: [{ face: 'robot', name: 'UNIT-7' }, { face: 'globe', name: 'Professor Globe' }] },
}

const rand = (a: number, b: number, i: number) => a + (((i * 9301 + 49297) % 233280) / 233280) * (b - a)

/** The animated effect layer (fills its parent). */
export function UnitScene({ theme, dense = false, className }: { theme: UnitTheme; dense?: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const n = dense ? 40 : 22
  const items = useMemo(() => Array.from({ length: n }, (_, i) => ({ x: rand(0, 800, i + 1), y: rand(0, 200, i * 3 + 7), s: rand(0.6, 1.4, i * 5 + 3) })), [n])
  const fx = theme.effect

  useLayoutEffect(() => {
    if (!ref.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const p = '.fx-p'
      if (fx === 'rain' || fx === 'storm') {
        gsap.fromTo(p, { y: -40 }, { y: 240, duration: () => gsap.utils.random(0.5, 0.9), repeat: -1, ease: 'none', delay: () => gsap.utils.random(0, 1) })
        if (fx === 'storm') gsap.timeline({ repeat: -1, repeatDelay: 3 }).to('.fx-flash', { opacity: 0.8, duration: 0.05 }).to('.fx-flash', { opacity: 0, duration: 0.2 }).to('.fx-flash', { opacity: 0.6, duration: 0.05 }).to('.fx-flash', { opacity: 0, duration: 0.4 }).fromTo('.fx-bolt', { opacity: 1, strokeDashoffset: 200 }, { strokeDashoffset: 0, duration: 0.15 }, 0).to('.fx-bolt', { opacity: 0, duration: 0.3 }, 0.3)
      } else if (fx === 'fire') {
        gsap.fromTo(p, { y: 210, opacity: 1, scale: 1 }, { y: () => gsap.utils.random(20, 120), x: () => `+=${gsap.utils.random(-30, 30)}`, opacity: 0, scale: 0.3, duration: () => gsap.utils.random(1.2, 2.4), repeat: -1, ease: 'power1.out', delay: () => gsap.utils.random(0, 2) })
        gsap.to('.fx-flame', { scaleY: () => gsap.utils.random(0.7, 1.3), scaleX: () => gsap.utils.random(0.85, 1.15), transformOrigin: '50% 100%', duration: 0.18, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.05 })
      } else if (fx === 'wind') {
        gsap.fromTo(p, { x: -120 }, { x: 900, duration: () => gsap.utils.random(1.2, 2.2), repeat: -1, ease: 'power1.inOut', delay: () => gsap.utils.random(0, 2) })
        gsap.to('.fx-grass', { skewX: 18, transformOrigin: '50% 100%', duration: 1, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.03 })
      } else if (fx === 'snow' || fx === 'leaves') {
        gsap.fromTo(p, { y: -30 }, { y: 240, x: () => `+=${gsap.utils.random(-60, 60)}`, rotate: () => gsap.utils.random(-360, 360), duration: () => gsap.utils.random(4, 8), repeat: -1, ease: 'none', delay: () => gsap.utils.random(0, 6) })
      } else if (fx === 'stars') {
        gsap.to(p, { opacity: 0.15, duration: () => gsap.utils.random(0.6, 1.6), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: () => gsap.utils.random(0, 2) })
        gsap.timeline({ repeat: -1, repeatDelay: 2.5 }).fromTo('.fx-shoot', { x: 0, y: 0, opacity: 1 }, { x: 400, y: 120, opacity: 0, duration: 0.9, ease: 'power2.in' })
      } else {
        gsap.to(p, { x: () => `+=${gsap.utils.random(-40, 40)}`, y: () => `+=${gsap.utils.random(-30, 30)}`, opacity: () => gsap.utils.random(0.3, 1), duration: () => gsap.utils.random(1.5, 3), yoyo: true, repeat: -1, ease: 'sine.inOut' })
      }
    }, ref)
    return () => ctx.revert()
  }, [fx, n])

  return (
    <svg ref={ref} className={`unit-scene fx-${fx} ${className ?? ''}`} viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-matrix-native>
      <defs>
        <linearGradient id={`us-sky-${fx}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.sky[0]} />
          <stop offset="1" stopColor={theme.sky[1]} />
        </linearGradient>
        <radialGradient id="us-glow"><stop offset="0" stopColor="#fff9c4" /><stop offset="1" stopColor="#fff9c4" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="800" height="200" fill={`url(#us-sky-${fx})`} />
      {fx === 'storm' && <rect className="fx-flash" width="800" height="200" fill="#fff" opacity="0" />}
      {fx === 'storm' && <path className="fx-bolt" d="M560 0 L530 70 L565 70 L520 160" stroke="#fff6a8" strokeWidth="4" fill="none" strokeDasharray="200" opacity="0" />}
      {fx === 'stars' && <line className="fx-shoot" x1="80" y1="20" x2="130" y2="35" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0" />}
      {fx === 'fire' && (
        <g>
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <path key={k} className="fx-flame" d={`M${60 + k * 110} 200 C ${40 + k * 110} 160, ${75 + k * 110} 140, ${60 + k * 110} 110 C ${95 + k * 110} 145, ${90 + k * 110} 175, ${75 + k * 110} 200 Z`} fill={k % 2 ? '#ffb347' : '#ff6a2f'} opacity="0.75" />)}
        </g>
      )}
      {fx === 'wind' && (
        <g>
          {Array.from({ length: 40 }, (_, k) => <path key={k} className="fx-grass" d={`M${k * 20 + 5} 200 q 3 -18 1 -30`} stroke="#58cc02" strokeWidth="3" fill="none" strokeLinecap="round" />)}
        </g>
      )}
      {items.map((it, i) => {
        const t = `translate(${it.x} ${it.y})`
        switch (fx) {
          case 'rain':
          case 'storm':
            return <line key={i} className="fx-p" x1={it.x} y1={it.y - 200} x2={it.x - 4} y2={it.y - 186} stroke="#bfe6ff" strokeWidth="1.6" opacity="0.7" />
          case 'fire':
            return <circle key={i} className="fx-p" cx={it.x} cy={0} r={2 * it.s} fill={i % 2 ? '#ffd24d' : '#ff7a2f'} />
          case 'wind':
            return <path key={i} className="fx-p" d={`M0 ${it.y} q 30 -8 60 0 t 60 0`} stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.6" strokeLinecap="round" />
          case 'snow':
            return <circle key={i} className="fx-p" cx={it.x} cy={0} r={2.5 * it.s} fill="#fff" opacity="0.85" />
          case 'leaves':
            return <path key={i} className="fx-p" transform={`translate(${it.x} 0)`} d="M0 0 C 6 -6, 14 -2, 12 6 C 6 10, 0 6, 0 0 Z" fill={['#e0703f', '#ffc800', '#c0392b'][i % 3]} />
          case 'stars':
            return <circle key={i} className="fx-p" cx={it.x} cy={it.y * 0.8} r={1.4 * it.s} fill="#fff" />
          default:
            return <g key={i} className="fx-p" transform={t}><circle r={10 * it.s} fill="url(#us-glow)" /><circle r={2} fill="#fffde0" /></g>
        }
      })}
    </svg>
  )
}
