import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'

/**
 * Hand-built SVG gratitude jar. GSAP brings it to life:
 *   - hover: the lid lifts and tilts, notes bob, sparkles rise
 *   - a new note drops in from above and settles with a bounce
 *   - shake: the whole jar wobbles
 * Notes are folded paper hearts/stars stacked from the bottom.
 */
const reduced = () => typeof window !== 'undefined' && prefersReducedMotion()

const seeded = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function GratitudeJarSvg({
  count,
  color,
  shaking,
  label,
  capacity = 30,
}: {
  count: number
  color: string
  shaking: boolean
  label: string
  capacity?: number
}) {
  const root = useRef<SVGSVGElement>(null)
  const lid = useRef<SVGGElement>(null)
  const notes = useRef<SVGGElement>(null)
  const sparkles = useRef<SVGGElement>(null)
  const hover = useRef<gsap.core.Timeline | null>(null)
  const shown = Math.min(count, 24)
  const prevCount = useRef(count)

  // Positions of the notes: rows from the bottom, gently jittered.
  const slots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const row = Math.floor(i / 4)
        const col = i % 4
        return {
          x: 44 + col * 22 + (row % 2) * 10 + (seeded(i) - 0.5) * 6,
          y: 176 - row * 18 + (seeded(i + 40) - 0.5) * 5,
          r: (seeded(i + 80) - 0.5) * 50,
          shape: i % 3 === 0 ? 'star' : 'heart',
          hue: Math.round(seeded(i + 7) * 40 - 20),
        }
      }),
    [],
  )

  // Hover timeline (built once).
  useLayoutEffect(() => {
    if (!lid.current || !notes.current || !sparkles.current || reduced()) return
    const tl = gsap.timeline({ paused: true })
    tl.to(lid.current, { y: -14, rotation: -10, transformOrigin: '20% 100%', duration: 0.45, ease: 'back.out(2)' }, 0)
      .to(notes.current.children, { y: -4, duration: 0.35, stagger: { each: 0.02, from: 'random' }, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.05)
      .fromTo(
        sparkles.current.children,
        { y: 0, opacity: 0, scale: 0.4, transformOrigin: '50% 50%' },
        { y: -46, opacity: 1, scale: 1, duration: 0.9, stagger: 0.08, ease: 'power2.out' },
        0.1,
      )
      .to(sparkles.current.children, { opacity: 0, duration: 0.4, stagger: 0.08 }, 0.7)
    hover.current = tl
    return () => {
      tl.kill()
    }
  }, [])

  // A newly added note drops in.
  useLayoutEffect(() => {
    if (count > prevCount.current && notes.current && !reduced()) {
      const el = notes.current.children[Math.min(count, 24) - 1]
      if (el) gsap.from(el, { y: -150, rotation: 180, duration: 0.9, ease: 'bounce.out' })
      if (lid.current)
        gsap.fromTo(lid.current, { y: -18, rotation: -14 }, { y: 0, rotation: 0, duration: 0.6, delay: 0.25, ease: 'back.out(3)', transformOrigin: '20% 100%' })
    }
    prevCount.current = count
  }, [count])

  // Shake for a memory.
  useEffect(() => {
    if (!shaking || !root.current || reduced()) return
    const tween = gsap.fromTo(
      root.current,
      { rotation: 0 },
      { rotation: 9, duration: 0.08, yoyo: true, repeat: 7, ease: 'sine.inOut', transformOrigin: '50% 90%', onComplete: () => void gsap.set(root.current, { rotation: 0 }) },
    )
    return () => {
      tween.kill()
    }
  }, [shaking])

  const fill = Math.min(1, count / capacity)
  return (
    <svg
      ref={root}
      className="gj-svg"
      viewBox="0 0 160 220"
      role="img"
      aria-label={label}
      onMouseEnter={() => hover.current?.play()}
      onMouseLeave={() => hover.current?.reverse()}
      style={{ ['--jar' as string]: color }}
    >
      <defs>
        <linearGradient id="gj-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id="gj-glow" cx="0.5" cy="0.8" r="0.7">
          <stop offset="0" stopColor={color} stopOpacity={0.35 + fill * 0.35} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <clipPath id="gj-inside">
          <path d="M34 60 Q30 66 30 80 L30 186 Q30 204 50 204 L110 204 Q130 204 130 186 L130 80 Q130 66 126 60 Z" />
        </clipPath>
      </defs>
      {/* Warm glow behind the jar grows as it fills */}
      <ellipse cx="80" cy="150" rx="78" ry="70" fill="url(#gj-glow)" className="gj-glow" />
      {/* Notes */}
      <g clipPath="url(#gj-inside)">
        <g ref={notes}>
          {slots.slice(0, shown).map((s, i) => (
            // Outer <g> is GSAP's to move; the inner one keeps the SVG placement.
            <g key={i}>
              <g transform={`translate(${s.x} ${s.y}) rotate(${s.r}) scale(1.2)`}>
                {s.shape === 'heart' ? (
                  <path
                    d="M0 5 C-8 -2 -6 -9 0 -5 C6 -9 8 -2 0 5 Z"
                    fill={`color-mix(in oklab, ${color} ${85 + s.hue / 2}%, #c2410c)`}
                    stroke="#0003"
                    strokeWidth="0.8"
                  />
                ) : (
                  <path
                    d="M0 -8 L2.3 -2.5 L8 -2.5 L3.5 1 L5.2 7 L0 3.5 L-5.2 7 L-3.5 1 L-8 -2.5 L-2.3 -2.5 Z"
                    fill={`color-mix(in oklab, ${color} 55%, #ffd24a)`}
                    stroke="#0003"
                    strokeWidth="0.8"
                  />
                )}
              </g>
            </g>
          ))}
        </g>
      </g>
      {/* Glass body */}
      <path
        d="M34 60 Q30 66 30 80 L30 186 Q30 204 50 204 L110 204 Q130 204 130 186 L130 80 Q130 66 126 60 Z"
        fill="url(#gj-glass)"
        stroke={`color-mix(in oklab, ${color} 55%, #9a8f86)`}
        strokeWidth="3"
      />
      <path d="M42 84 Q40 130 44 176" stroke="#fff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Neck */}
      <rect x="38" y="50" width="84" height="12" rx="4" fill={`color-mix(in oklab, ${color} 25%, #fff)`} stroke={`color-mix(in oklab, ${color} 55%, #9a8f86)`} strokeWidth="2" />
      {/* Lid with a little tie */}
      <g ref={lid}>
        <rect x="34" y="34" width="92" height="18" rx="6" fill={`color-mix(in oklab, ${color} 80%, #6b4226)`} />
        <rect x="34" y="34" width="92" height="6" rx="3" fill="#fff" fillOpacity="0.25" />
        <path d="M80 34 C70 18 60 26 72 32 M80 34 C90 18 100 26 88 32" stroke="#fff6c8" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      {/* Sparkles (hidden until hover) */}
      <g ref={sparkles} fill="#ffe58a">
        {[56, 80, 104, 68, 94].map((x, i) => (
          <path key={i} opacity="0" transform={`translate(${x} ${50 - (i % 2) * 6})`} d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" />
        ))}
      </g>
    </svg>
  )
}

/** Tiny shelf jar with a gently moving "wave" fill line. */
export function MiniJarSvg({ fill, color, emoji }: { fill: number; color: string; emoji: string }) {
  const level = 44 - Math.min(1, fill) * 36
  return (
    <svg className="gj-mini" viewBox="0 0 44 52" aria-hidden="true">
      <defs>
        <clipPath id={`mj-${emoji}-${color}`}>
          <path d="M8 10 Q6 12 6 16 L6 44 Q6 50 12 50 L32 50 Q38 50 38 44 L38 16 Q38 12 36 10 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#mj-${emoji}-${color})`}>
        <path className="gj-wave" d={`M-44 ${level} q11 -4 22 0 t22 0 t22 0 t22 0 t22 0 V60 H-44 Z`} fill={color} fillOpacity="0.75" />
      </g>
      <path d="M8 10 Q6 12 6 16 L6 44 Q6 50 12 50 L32 50 Q38 50 38 44 L38 16 Q38 12 36 10 Z" fill="none" stroke={color} strokeWidth="2.5" />
      <rect x="7" y="4" width="30" height="7" rx="3" fill={color} />
      <text x="22" y="34" textAnchor="middle" fontSize="15">
        {emoji}
      </text>
    </svg>
  )
}
