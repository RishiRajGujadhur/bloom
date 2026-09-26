import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { createNoise2D } from 'simplex-noise'

/**
 * Focus grow scenes: SVG worlds that fill in as a session progresses. Each
 * scene has N pieces; piece i appears (with a GSAP pop) once progress passes
 * i/N. `extra` (sessions already done today) scales the scene up.
 */
export const scenes = [
  { id: 'tree', name: 'Tree', emoji: '🌳' },
  { id: 'flowers', name: 'Flower bed', emoji: '🌷' },
  { id: 'city', name: 'City skyline', emoji: '🏙️' },
  { id: 'treasure', name: 'Treasure hunt', emoji: '💎' },
  { id: 'reef', name: 'Coral reef', emoji: '🐠' },
  { id: 'space', name: 'Space station', emoji: '🚀' },
] as const
export type SceneId = (typeof scenes)[number]['id']

const rand = (seed: number) => {
  const x = Math.sin(seed * 999) * 10000
  return x - Math.floor(x)
}

type Piece = { key: string; el: React.ReactNode }

function pieces(scene: SceneId, count: number): Piece[] {
  const out: Piece[] = []
  const noise = createNoise2D(() => 0.42)
  for (let i = 0; i < count; i++) {
    const r = rand(i + 1)
    const x = 14 + ((i * 172) / Math.max(1, count - 1) || 0) + (r - 0.5) * 8
    const key = `${scene}-${i}`
    if (scene === 'tree') {
      const a = (i / count) * Math.PI * 2
      out.push({ key, el: <circle cx={100 + Math.cos(a) * 32 * r} cy={62 + Math.sin(a) * 22 * r} r={10 + r * 6} fill={i % 3 ? '#5f9e6e' : '#86c28b'} /> })
    } else if (scene === 'flowers') {
      const colors = ['#f48fb1', '#ffd54f', '#ba68c8', '#ff8a65', '#81d4fa']
      out.push({
        key,
        el: (
          <g transform={`translate(${x} ${118 - r * 18})`}>
            <path d={`M0 0 V${22 + r * 18}`} stroke="#5f9e6e" strokeWidth="2" />
            {[0, 72, 144, 216, 288].map((d) => <ellipse key={d} rx="3" ry="6" transform={`rotate(${d}) translate(0 -5)`} fill={colors[i % colors.length]} />)}
            <circle r="2.6" fill="#fff59d" />
          </g>
        ),
      })
    } else if (scene === 'city') {
      const h = 30 + r * 70 + noise(i, 0) * 10
      const w = 12 + r * 10
      out.push({
        key,
        el: (
          <g>
            <rect x={x - w / 2} y={140 - h} width={w} height={h} fill={i % 2 ? '#5c6bc0' : '#7986cb'} rx="1.5" />
            {Array.from({ length: Math.floor(h / 12) }, (_, j) => <rect key={j} x={x - w / 2 + 3} y={146 - h + j * 12} width="3" height="4" fill="#fff59d" opacity={rand(i * 7 + j) > 0.4 ? 0.9 : 0.2} />)}
          </g>
        ),
      })
    } else if (scene === 'treasure') {
      const gem = i % 4 === 3
      out.push({
        key,
        el: gem ? (
          <path d={`M${x} ${120 - r * 60} l7 -8 h10 l7 8 l-12 14 z`} fill="#4dd0e1" stroke="#00838f" strokeWidth="1" />
        ) : (
          <g>
            <ellipse cx={x} cy={128 - r * 40} rx="7" ry="7" fill="#ffca28" stroke="#f9a825" strokeWidth="1.5" />
            <text x={x} y={131 - r * 40} fontSize="8" textAnchor="middle" fill="#f57f17">¢</text>
          </g>
        ),
      })
    } else if (scene === 'reef') {
      out.push({
        key,
        el:
          i % 3 === 2 ? (
            <text x={x} y={50 + r * 50} fontSize="14">🐠</text>
          ) : (
            <path d={`M${x} 140 q${-8 + r * 4} -${20 + r * 20} 0 -${34 + r * 26} q${6} ${14} 4 ${34 + r * 26}`} fill={i % 2 ? '#ff7043' : '#f06292'} />
          ),
      })
    } else {
      out.push({
        key,
        el:
          i === 0 ? (
            <rect x="80" y="62" width="40" height="18" rx="6" fill="#b0bec5" />
          ) : i % 2 ? (
            <rect x={i % 4 === 1 ? 40 + i * 2 : 124} y={66} width={36 - i} height="10" fill="#4fc3f7" stroke="#0277bd" strokeWidth="1" />
          ) : (
            <circle cx={20 + r * 160} cy={10 + r * 40} r="1.6" fill="#fff" />
          ),
      })
    }
  }
  return out
}

const skies: Record<SceneId, [string, string]> = {
  tree: ['#e3f2fd', '#fffde7'],
  flowers: ['#fce4ec', '#fffde7'],
  city: ['#1a237e', '#ff8a65'],
  treasure: ['#fff8e1', '#d7ccc8'],
  reef: ['#4fc3f7', '#01579b'],
  space: ['#0d1b2a', '#1b263b'],
}

export function GrowScene({ scene, progress, extra = 0 }: { scene: SceneId; progress: number; extra?: number }) {
  const count = Math.min(24, 8 + extra * 4)
  const list = useMemo(() => pieces(scene, count), [scene, count])
  const root = useRef<SVGGElement>(null)
  const shown = Math.floor(progress * count + 0.0001)
  const prev = useRef(shown)
  useLayoutEffect(() => {
    const els = root.current?.children
    if (!els) return
    const fresh = [...els].slice(prev.current, shown)
    prev.current = shown
    if (!fresh.length || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tw = gsap.from(fresh, { scale: 0, opacity: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.08, ease: 'back.out(2.2)' })
    return () => void tw.progress(1)
  }, [shown])
  const [top, bottom] = skies[scene]
  return (
    <svg className="grow-scene" viewBox="0 0 200 150" role="img" aria-label={`${scenes.find((s) => s.id === scene)?.name}: ${shown} of ${count} grown`}>
      <defs>
        <linearGradient id={`sky-${scene}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="200" height="150" rx="14" fill={`url(#sky-${scene})`} />
      {scene === 'tree' && <path d="M96 140 V70 M100 140 V64 M104 140 V72" stroke="#795548" strokeWidth="6" strokeLinecap="round" />}
      {scene === 'treasure' && <path d="M70 140 h60 v-22 q-30 -18 -60 0z" fill="#8d6e63" stroke="#5d4037" strokeWidth="2" />}
      <g ref={root}>
        {list.map((p, i) => (
          <g key={p.key} style={{ display: i < shown ? undefined : 'none' }}>
            {p.el}
          </g>
        ))}
      </g>
      <rect y="138" width="200" height="12" rx="4" fill={scene === 'reef' ? '#ffe0b2' : scene === 'space' ? '#37474f' : '#a1887f'} />
    </svg>
  )
}
