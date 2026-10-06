import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { prefersReducedMotion } from '../../utils/motion'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { ChevronLeft, ChevronRight, DoorOpen } from 'lucide-react'
import type { FeatureFlags } from '../../settings/appSettings'
import { usePageActions } from '../../components/ui/PageMenu'
import { subOn } from '../subFeatures'
import { readRecentPages } from '../../components/layout/navigationHistory'
import './street.css'

gsap.registerPlugin(Draggable)

/**
 * Bloom Street (inspired by Dinotaeng's town): every feature is a building on
 * one long illustrated street. A little sprout walks to the building you pick;
 * windows light up for the places you visited today.
 */
type Roof = 'gable' | 'dome' | 'pagoda' | 'flat' | 'awning' | 'glass'
export type Building = {
  page: string
  name: string
  sign: string
  emoji: string
  blurb: string
  color: string
  roof: Roof
  flag?: keyof FeatureFlags
}

export const buildings: Building[] = [
  {
    page: 'overview',
    name: 'Town hall',
    sign: 'HOME',
    emoji: '🏛️',
    blurb: 'Your day at a glance.',
    color: '#f3efe6',
    roof: 'gable',
  },
  {
    page: 'daybook',
    name: 'Library',
    sign: 'LIBRARY',
    emoji: '📚',
    blurb: 'Your journal books live here.',
    color: '#f6d7a7',
    roof: 'gable',
  },
  {
    page: 'shop',
    name: 'Petal bank',
    sign: 'BANK',
    emoji: '🌸',
    blurb: 'Spend petals on treats.',
    color: '#e8ecf2',
    roof: 'dome',
    flag: 'petalShop',
  },
  {
    page: 'dojo',
    name: 'Dojo',
    sign: 'DOJO',
    emoji: '🥋',
    blurb: 'Kicks, blocks and belts.',
    color: '#f4e1c1',
    roof: 'pagoda',
    flag: 'dojo',
  },
  {
    page: 'exercises',
    name: 'Gym',
    sign: 'GYM',
    emoji: '💪',
    blurb: 'Moves for every body.',
    color: '#cfe3f7',
    roof: 'flat',
    flag: 'exerciseGuides',
  },
  {
    page: 'diet',
    name: 'Café',
    sign: 'CAFÉ',
    emoji: '☕',
    blurb: 'Meals, water and how food feels.',
    color: '#fde2e4',
    roof: 'awning',
    flag: 'dietTracker',
  },
  {
    page: 'growth',
    name: 'Greenhouse',
    sign: 'GROW',
    emoji: '🌱',
    blurb: 'Your living seedling.',
    color: '#d8f3dc',
    roof: 'glass',
    flag: 'rpgSkillTree',
  },
  {
    page: 'games',
    name: 'Arcade',
    sign: 'ARCADE',
    emoji: '🕹️',
    blurb: 'Ten brain games.',
    color: '#e4d9ff',
    roof: 'flat',
    flag: 'brainGames',
  },
  {
    page: 'meditate',
    name: 'Temple',
    sign: 'CALM',
    emoji: '🧘',
    blurb: 'Sit, breathe, soften.',
    color: '#fff1d0',
    roof: 'pagoda',
    flag: 'meditation',
  },
  {
    page: 'sleep',
    name: 'Observatory',
    sign: 'SLEEP',
    emoji: '🌙',
    blurb: 'Nights, dreams and dawns.',
    color: '#dfe7fd',
    roof: 'dome',
    flag: 'sleepTracker',
  },
  {
    page: 'gratitude',
    name: 'Post office',
    sign: 'THANKS',
    emoji: '💌',
    blurb: 'Letters to your gratitude jar.',
    color: '#ffe5d9',
    roof: 'gable',
    flag: 'gratitude',
  },
  {
    page: 'focus',
    name: 'Workshop',
    sign: 'FOCUS',
    emoji: '⏱️',
    blurb: 'Grow a scene while you work.',
    color: '#e9f5db',
    roof: 'flat',
  },
]

const W = 300
const reduced = () =>
  !!prefersReducedMotion()

const visitedRecently = () => new Set<string>(readRecentPages())

function roofPath(
  roof: Roof,
  x: number,
  w: number,
  top: number,
  color: string,
) {
  const mid = x + w / 2
  switch (roof) {
    case 'gable':
      return (
        <path
          d={`M${x - 12} ${top} L${mid} ${top - 52} L${x + w + 12} ${top} Z`}
          fill="#56657a"
        />
      )
    case 'dome':
      return (
        <>
          <path
            d={`M${x + 20} ${top} A${w / 2 - 20} ${w / 2 - 30} 0 0 1 ${x + w - 20} ${top} Z`}
            fill="#6c8ebf"
          />
          <path
            d={`M${mid} ${top - (w / 2 - 30)} v-18`}
            stroke="#444"
            strokeWidth="3"
          />
          <path
            d={`M${mid} ${top - (w / 2 - 30) - 18} l16 5 l-16 5`}
            fill="#e2553f"
          />
        </>
      )
    case 'pagoda':
      return (
        <>
          <path
            d={`M${x - 22} ${top} Q${mid} ${top - 30} ${x + w + 22} ${top} L${x + w - 10} ${top - 16} Q${mid} ${top - 44} ${x + 10} ${top - 16} Z`}
            fill="#b23a2e"
          />
          <path
            d={`M${x + 18} ${top - 30} Q${mid} ${top - 62} ${x + w - 18} ${top - 30} L${x + w - 34} ${top - 44} Q${mid} ${top - 70} ${x + 34} ${top - 44} Z`}
            fill="#c94a3b"
          />
        </>
      )
    case 'awning':
      return (
        <>
          <rect
            x={x - 6}
            y={top - 14}
            width={w + 12}
            height="14"
            fill="#6d4c41"
          />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M${x + (i * w) / 8} ${top + 40} h${w / 8} v-18 q-${w / 16} 12 -${w / 8} 0 Z`}
              fill={i % 2 ? '#fff' : '#e57373'}
            />
          ))}
        </>
      )
    case 'glass':
      return (
        <path
          d={`M${x} ${top} L${mid} ${top - 60} L${x + w} ${top} Z`}
          fill="#b7e4c7"
          stroke="#52b788"
          strokeWidth="3"
          opacity="0.9"
        />
      )
    default:
      return (
        <rect
          x={x - 8}
          y={top - 12}
          width={w + 16}
          height="12"
          fill={color === '#e4d9ff' ? '#8f7ae5' : '#5c6b7a'}
        />
      )
  }
}

function House({ b, i, lit }: { b: Building; i: number; lit: boolean }) {
  const x = i * W + 50
  const w = 200
  const top = 170
  return (
    <g className="st-house" data-page={b.page}>
      <ellipse
        cx={x + w / 2}
        cy="372"
        rx={w / 2 + 30}
        ry="10"
        fill="#0000001a"
      />
      {roofPath(b.roof, x, w, top, b.color)}
      <rect
        x={x}
        y={top}
        width={w}
        height={200}
        fill={b.color}
        stroke="#0002"
      />
      <rect
        x={x + w / 2 - 34}
        y={top + 14}
        width="68"
        height="30"
        rx="10"
        fill="#ffd54f"
        stroke="#c79a00"
        strokeWidth="2"
      />
      <text x={x + w / 2} y={top + 35} textAnchor="middle" className="st-sign">
        {b.sign}
      </text>
      {[0, 1, 2].map((c) =>
        [0, 1].map((r) => (
          <rect
            key={`${c}${r}`}
            className={lit ? 'st-win lit' : 'st-win'}
            x={x + 20 + c * 60}
            y={top + 62 + r * 50}
            width="40"
            height="34"
            rx="6"
          />
        )),
      )}
      <path
        d={`M${x + w / 2 - 22} ${top + 200} v-52 a22 22 0 0 1 44 0 v52 Z`}
        fill="#7b5a3c"
      />
      <circle cx={x + w / 2 + 12} cy={top + 174} r="3" fill="#ffd54f" />
      <text x={x + w / 2} y={top - 70} textAnchor="middle" fontSize="30">
        {b.emoji}
      </text>
    </g>
  )
}

/** A round sprout buddy with little legs. */
function Buddy() {
  return (
    <g className="st-buddy">
      <g className="st-legs">
        <rect
          className="st-leg l"
          x="-12"
          y="18"
          width="8"
          height="18"
          rx="4"
          fill="#3d6b35"
        />
        <rect
          className="st-leg r"
          x="4"
          y="18"
          width="8"
          height="18"
          rx="4"
          fill="#3d6b35"
        />
      </g>
      <g className="st-body">
        <ellipse
          cx="0"
          cy="0"
          rx="26"
          ry="24"
          fill="#8bd46e"
          stroke="#3d6b35"
          strokeWidth="3"
        />
        <path
          d="M0 -24 q-4 -18 -18 -22 q10 14 18 22 q4 -18 18 -22 q-10 14 -18 22"
          fill="#6cc04a"
          stroke="#3d6b35"
          strokeWidth="2"
        />
        <circle cx="-9" cy="-2" r="4" fill="#222" />
        <circle cx="9" cy="-2" r="4" fill="#222" />
        <circle cx="-7.5" cy="-3.5" r="1.4" fill="#fff" />
        <circle cx="10.5" cy="-3.5" r="1.4" fill="#fff" />
        <path
          d="M-5 8 q5 5 10 0"
          stroke="#222"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="-16" cy="6" rx="4" ry="2.5" fill="#f48fb1" opacity="0.7" />
        <ellipse cx="16" cy="6" rx="4" ry="2.5" fill="#f48fb1" opacity="0.7" />
      </g>
    </g>
  )
}

export function StreetPage({ flags }: { flags: FeatureFlags }) {
  const list = useMemo(
    () =>
      buildings.filter(
        (b) => !b.flag || !subOn('bloomStreet', 'onlyOn') || flags[b.flag],
      ),
    [flags],
  )
  // Where you were on the street last time.
  const [at, setAt] = useState(() => {
    try { return Math.max(0, Math.min(list.length - 1, Number(localStorage.getItem('bloom-street-at')) || 0)) } catch { return 0 }
  })
  const startAt = useRef(at)
  useEffect(() => {
    try { localStorage.setItem('bloom-street-at', String(at)) } catch { /* optional */ }
  }, [at])
  const [lit] = useState(visitedRecently)
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<SVGGElement>(null)
  const buddy = useRef<SVGGElement>(null)
  const clouds = useRef<SVGGElement>(null)
  const width = list.length * W + 100

  const scrollTo = useCallback(
    (i: number) => {
      const vp = viewport.current
      if (!vp || !track.current) return
      const vw = vp.clientWidth
      const scale = vp.clientHeight / 420
      const target = Math.min(
        0,
        Math.max(vw / scale - width, vw / scale / 2 - (i * W + 150)),
      )
      gsap.to(track.current, {
        x: target,
        duration: reduced() ? 0 : 0.9,
        ease: 'power3.inOut',
      })
    },
    [width],
  )

  const walk = useCallback((to: number) => {
    const b = buddy.current
    if (!b) return
    const from = Number(b.dataset.at ?? 0)
    b.dataset.at = String(to)
    const x = to * W + 150
    if (reduced() || !subOn('bloomStreet', 'walker')) {
      gsap.set(b, { x, y: 380 })
      return
    }
    const legs = b.querySelectorAll('.st-leg')
    const steps = gsap.to(legs, {
      rotate: (k) => (k ? -25 : 25),
      transformOrigin: '50% 0%',
      yoyo: true,
      repeat: -1,
      duration: 0.18,
    })
    gsap.set(b.querySelector('.st-body'), { scaleX: to < from ? -1 : 1 })
    gsap.to(b, {
      x,
      duration: Math.min(2.2, 0.5 + Math.abs(to - from) * 0.35),
      ease: 'power1.inOut',
      onUpdate: () =>
        void gsap.set(b, { y: 380 + Math.abs(Math.sin(Date.now() / 90)) * -6 }),
      onComplete: () => {
        steps.kill()
        gsap.set(legs, { rotate: 0 })
        gsap.set(b, { y: 380 })
        gsap.fromTo(
          b.querySelector('.st-body'),
          { scaleY: 0.85 },
          { scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' },
        )
      },
    })
  }, [])

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(list.length - 1, i))
      setAt(n)
      walk(n)
      scrollTo(n)
    },
    [list.length, walk, scrollTo],
  )

  useLayoutEffect(() => {
    if (buddy.current) {
      gsap.set(buddy.current, { x: startAt.current * W + 150, y: 380 })
      buddy.current.dataset.at = String(startAt.current)
    }
    scrollTo(startAt.current)
    const ctx = gsap.context(() => {
      if (!reduced() && clouds.current && subOn('bloomStreet', 'sky'))
        gsap.utils
          .toArray<SVGGElement>(clouds.current.children)
          .forEach((c, k) =>
            gsap.to(c, {
              x: `+=${120 + k * 40}`,
              duration: 30 + k * 8,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            }),
          )
    })
    return () => ctx.revert()
  }, [scrollTo])

  useEffect(() => {
    if (!track.current || !viewport.current || !subOn('bloomStreet', 'drag'))
      return
    const [d] = Draggable.create(track.current, {
      type: 'x',
      onDragEnd() {
        const scale = viewport.current!.clientHeight / 420
        const center = -this.x + viewport.current!.clientWidth / scale / 2
        go(Math.round((center - 150) / W))
      },
    })
    return () => void d.kill()
  }, [go])

  useEffect(() => {
    if (!subOn('bloomStreet', 'keys')) return
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (e.key === 'ArrowRight') go(at + 1)
      if (e.key === 'ArrowLeft') go(at - 1)
      if (e.key === 'Home') go(0)
      if (e.key === 'End') go(list.length - 1)
      if (e.key === 'Enter') window.location.hash = list[at].page
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [at, go, list])

  usePageActions(
    !subOn('bloomStreet', 'menu')
      ? []
      : [
          {
            id: 'street-enter',
            label: `Go into the ${list[at]?.name ?? ''}`,
            icon: '🚪',
            run: () => (window.location.hash = list[at].page),
          },
          {
            id: 'street-next',
            label: 'Walk to the next building',
            icon: '➡️',
            run: () => go(at + 1),
          },
          {
            id: 'street-home',
            label: 'Back to the town hall',
            icon: '🏛️',
            run: () => go(0),
          },
        ],
  )

  const current = list[at]
  return (
    <section className="st-page bloom-stack" aria-label="Bloom Street">
      <div ref={viewport} className="st-viewport">
        <svg
          className="st-svg"
          viewBox={`0 0 ${width} 420`}
          preserveAspectRatio="xMinYMid slice"
          role="img"
          aria-label={`Bloom Street, at the ${current?.name}`}
        >
          <defs>
            <linearGradient id="st-sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#5ec3ea" />
              <stop offset="1" stopColor="#bfe9f7" />
            </linearGradient>
          </defs>
          <rect width={width} height="420" fill="url(#st-sky)" />
          <g ref={track}>
            <g ref={clouds}>
              {Array.from({ length: Math.ceil(width / 500) }, (_, k) => (
                <g
                  key={k}
                  transform={`translate(${k * 500 + 60} ${40 + (k % 2) * 30})`}
                  fill="#fff"
                  opacity="0.95"
                >
                  <ellipse cx="40" cy="20" rx="40" ry="20" />
                  <ellipse cx="80" cy="14" rx="34" ry="22" />
                  <ellipse cx="110" cy="24" rx="30" ry="16" />
                </g>
              ))}
            </g>
            <path
              d={`M0 330 Q${width / 4} 300 ${width / 2} 325 T${width} 320 V420 H0Z`}
              fill="#8fd18a"
            />
            <rect y="370" width={width} height="50" fill="#e8dcc5" />
            {Array.from({ length: Math.ceil(width / 60) }, (_, k) => (
              <rect
                key={k}
                x={k * 60 + 10}
                y="396"
                width="26"
                height="4"
                rx="2"
                fill="#cdbd9d"
              />
            ))}
            {list.map((b, i) => (
              <g
                key={b.page}
                onClick={() => go(i)}
                style={{ cursor: 'pointer' }}
              >
                <House
                  b={b}
                  i={i}
                  lit={subOn('bloomStreet', 'lights') && lit.has(b.page)}
                />
                {subOn('bloomStreet', 'lamps') && (
                  <g transform={`translate(${i * W + 20} 250)`}>
                    <rect x="-3" y="0" width="6" height="120" fill="#4e342e" />
                    <rect
                      x="-10"
                      y="-20"
                      width="20"
                      height="24"
                      rx="4"
                      fill="#fff59d"
                      stroke="#4e342e"
                      strokeWidth="3"
                    />
                  </g>
                )}
              </g>
            ))}
            {current && subOn('bloomStreet', 'bubble') && (
              <g
                className="st-bubble"
                transform={`translate(${at * W + 150} 58)`}
              >
                <ellipse cx="0" cy="0" rx="62" ry="24" fill="#fff" />
                <circle cx="-30" cy="30" r="6" fill="#fff" />
                <text textAnchor="middle" y="7" className="st-bubble-text">
                  {current.sign}
                </text>
              </g>
            )}
            <g ref={buddy}>
              <Buddy />
            </g>
          </g>
        </svg>
      </div>
      <div className="st-panel">
        <button
          type="button"
          className="studio-btn"
          aria-label="Previous building"
          onClick={() => go(at - 1)}
          disabled={at === 0}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="st-info">
          <strong>
            {current?.emoji} {current?.name}
          </strong>
          <span>{current?.blurb}</span>
        </div>
        <a
          className="studio-btn primary"
          href={`#${current?.page}`}
          data-cursor-stick
        >
          <DoorOpen size={16} /> Go in
        </a>
        <button
          type="button"
          className="studio-btn"
          aria-label="Next building"
          onClick={() => go(at + 1)}
          disabled={at === list.length - 1}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <DropdownSelect
        className="studio-input st-jump"
        aria-label="Jump to a building"
        value={at}
        onChange={(e) => go(Number(e.target.value))}
      >
        {list.map((b, i) => (
          <option key={b.page} value={i}>
            {b.name}
          </option>
        ))}
      </DropdownSelect>
      {subOn('bloomStreet', 'dots') && (
        <div className="st-dots" role="tablist" aria-label="Buildings">
          {list.map((b, i) => (
            <button
              key={b.page}
              type="button"
              role="tab"
              aria-selected={i === at}
              aria-label={b.name}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
