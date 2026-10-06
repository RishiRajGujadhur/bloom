import { prefersReducedMotion } from '../utils/motion'
import { sceneFor } from '../styles/houdini'
import {
  Children,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react'
import heroLandscape from '../assets/bloom/hero-landscape.webp'
import heroLandscapeSmall from '../assets/bloom/hero-landscape-small.webp'
import type { NavKey } from './layout/Sidebar'
import { PageEmblem } from './ui/PageEmblem'
import { createPortal } from 'react-dom'
import { compactTitles, useHeadSlot } from './ui/Flow'
import './bloom-experience.css'

export function CardRail({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const trackId = useId()
  const [edges, setEdges] = useState({ start: true, end: false })
  const [expanded, setExpanded] = useState(false)
  const items = Children.toArray(children)
  useEffect(() => {
    const node = track.current
    if (!node) return
    const update = () =>
      setEdges({
        start: node.scrollLeft < 2,
        end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2,
      })
    update()
    node.addEventListener('scroll', update, { passive: true })
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(node)
    return () => {
      node.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [expanded, items.length])
  const move = (direction: number) => {
    const node = track.current
    if (!node) return
    node.scrollBy({
      left: direction * node.clientWidth * 0.85,
      behavior:
        document.documentElement.dataset.bloomMotion === 'paused' ||
        prefersReducedMotion()
          ? 'auto'
          : 'smooth',
    })
  }
  return (
    <section
      className="bloom-rail"
      aria-label={label}
      aria-roledescription="carousel"
    >
      <div className="bloom-rail-toolbar">
        <span>
          {label} <small>{items.length}</small>
        </span>
        <div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={trackId}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show slider' : 'Show all'}
          </button>
          {!expanded && (
            <>
              <button
                type="button"
                aria-label={`Previous ${label}`}
                aria-controls={trackId}
                disabled={edges.start}
                onClick={() => move(-1)}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                aria-label={`Next ${label}`}
                aria-controls={trackId}
                disabled={edges.end}
                onClick={() => move(1)}
              >
                <ChevronRight size={17} />
              </button>
            </>
          )}
        </div>
      </div>
      <div
        id={trackId}
        ref={track}
        className={`bloom-rail-track${expanded ? ' is-expanded' : ''}`}
        tabIndex={expanded ? undefined : 0}
        aria-label={`${label}, swipe or use arrow keys`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || expanded) return
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault()
            move(event.key === 'ArrowRight' ? 1 : -1)
          }
        }}
      >
        {children}
      </div>
    </section>
  )
}

export function Disclosure({
  title,
  children,
  open = false,
}: {
  title: string
  children: ReactNode
  open?: boolean
}) {
  return (
    <details className="bloom-disclosure" open={open || undefined}>
      <summary>
        {title}
        <ChevronRight size={17} aria-hidden="true" />
      </summary>
      <div className="bloom-disclosure-body">{children}</div>
    </details>
  )
}

const captions: Record<NavKey, string> = {
  overview: 'Small steps create a brighter tomorrow.',
  habits: 'Small rituals, lasting roots.',
  focus: 'One thing at a time. Give it room.',
  challenges: 'Discover your next small adventure.',
  growth: 'Every small step leaves a trace.',
  collectibles: 'Little discoveries along the way.',
  journal: 'Let your thoughts find their shape.',
  daybook: 'Make a little space for your story.',
  planning: 'Less noise. More intention.',
  todos: 'Make space for what matters.',
  calendar: 'Find a rhythm that feels like you.',
  'vision-board': 'Give your possibilities a place to grow.',
  urges: 'A pause is a powerful beginning.',
  world: 'Every small step builds your little world.',
  breathe: 'Slow down, one breath at a time.',
  sleep: 'Rest is part of the work.',
  posture: 'Sit tall, level up.',
  epiphanies: 'Your wisdom, remembered.',
  diet: 'Eat with attention.',
  monk: 'Write it. Let it go.',
  voice: 'Think out loud.',
  energy: 'Debug your week.',
  lab: 'What moves together.',
  taichi: 'Root down. Breathe low.',
  'arcade': "Pick a game. Play a minute.",
  'code-city': "Ship code, not yourself.",
  'briefing': "Your day, on air.",
  'readiness': "Know when to push and when to rest.",
  'people': "Relationships grow where attention goes.",
  'decide': "Clear heads make kinder choices.",
  'reader': "Eyes still, mind moving.",
  'cpr': "Hands that can save a life.",
  'globe': "The world, one country at a time.",
  'sign': "A few letters can open a whole conversation.",
  'tuner': "Close is good. In tune is magic.",
  'piano': "Music is a language you can learn.",
  'typing': "Eyes up, fingers home.",
  'sky': "Look up — something beautiful is there.",
  'weeks': "Every square is a week you can shape.",
  'chess': "Every grandmaster was once a beginner.",
  'code': "Write real JavaScript, one small step at a time.",
  'joys': "Small things, done with delight.",
  'english': "A little English every day.",
  'money': "Know where it goes.",
  'street': "Take a walk through your town.",
  'pointer': "Make the pointer yours.",
  'dojo': "Discipline, one technique at a time.",
  'affirm': "Words to grow into.",
  'daylight': "Live with the light.",
  'eyes': "Give your eyes a horizon.",
  'screen': "Use tech, don’t let it use you.",
  'routines': "Small steps, same time, every time.",
  'roadmap': "See the road, take the next step.",
  'games': "Play your mind awake.",
  'cards': "Remember what matters.",
  'mindmaps': "Untangle your thoughts.",
  'mirror': "What your words say about you.",
  'ink': "Some thoughts need a pen.",
  'mala': "One bead, one breath.",
  'breathwork': "Breathe big. Then be still.",
  'meditate': "Sit. Breathe. Arrive.",
  'mixer': "Build your own weather.",
  'sounds': "Music made for your mind.",
  'fasting': "Rest for your digestion, too.",
  'scan': "Know what’s inside.",
  'body': "Trends, not single days.",
  'run': "One step, then the next.",
  'stretch': "Loosen what the day tightened.",
  'yoga': "Breathe, then move.",
  'intervals': "Work hard, rest well.",
  'workouts': "Stronger than last week.",
  'exercises': "Move well, not just more.",
  'release': 'Write it, then let it burn.',
  'focus-room': 'One task. Soft strings. Deep work.',
  'explore': 'Ask your own questions.',
  'yearbook': 'Your year, bound.',
  'palace': 'Walk through your year.',
  'journey': 'Every day is a step on the path.',
  'places': 'Where you feel your best.',
  shop: 'Treat your world.',
  mood: 'Two taps. No judgement.',
  gratitude: 'Collect the good things.',
  settings: 'Make this space your own.',
}

export function BloomHeading({
  title,
  page,
  children,
  actions,
  lead,
}: {
  title: string
  page: NavKey
  children: ReactNode
  /** Call-to-action buttons; the overview uses them to make the heading a hero. */
  actions?: ReactNode
  /** Shown on the left of the same bar (e.g. the Works-with links). */
  lead?: ReactNode
}) {
  const hero = page === 'overview'
  // Decorative motion always loops (the pause button was removed).
  const paused = false
  useEffect(() => {
    document.documentElement.dataset.bloomMotion = paused ? 'paused' : 'running'
    try {
      localStorage.setItem('bloom-motion', paused ? 'paused' : 'running')
    } catch {
      /* Optional preference. */
    }
    return () => {
      delete document.documentElement.dataset.bloomMotion
    }
  }, [paused])
  const slot = useHeadSlot()
  const inSlot = !hero && !!slot && compactTitles()
  // Every page gets its own generative scene (Houdini paint worklet), with a seeded SVG fallback.
  const sc = sceneFor(page)
  const rs = (k: number) => ((sc.seed * (k + 3) * 7919) % 1000) / 1000
  const bar = (
    <div className={`bloom-heading feature-heading${hero ? ' is-hero' : ''}${lead ? ' has-lead' : ''}${inSlot ? ' in-slot' : ''}`} data-scene={sc.kind} style={{ '--scene-kind': sc.kind, '--scene-seed': String(sc.seed) } as CSSProperties}>
      {lead && <div className="bloom-heading-lead">{lead}</div>}
      {hero && (
        <img className="bloom-hero-art" src={heroLandscape} srcSet={`${heroLandscapeSmall} 480w, ${heroLandscape} 760w`} sizes="(max-width: 720px) 100vw, (max-width: 1500px) 62vw, 780px" width={760} height={220} decoding="async" fetchPriority="high" alt="" aria-hidden="true" />
      )}
      <svg
        className="bloom-contours"
        viewBox="0 0 800 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M ${200 + rs(0) * 120} ${150 + i * 16 + rs(1) * 30} C ${340 + rs(2) * 140} ${-140 + i * 20 + rs(3) * 80}, ${520 + rs(4) * 120} ${220 + i * 16 + rs(5) * 80}, 820 ${-60 + i * 18 + rs(6) * 60}`}
          />
        ))}
      </svg>
      <div className="bloom-heading-copy" key={page}>
        <span className="bloom-kicker">
          {hero ? 'WELCOME BACK' : 'YOUR SPACE TO BLOOM'}
          {hero && <Leaf size={16} aria-hidden="true" />}
        </span>
        <h1 id="page-heading" tabIndex={-1}>
          {title.split(' ').map((word, i) => (
            <span
              className="bloom-word"
              key={`${i}-${word}`}
              style={{ '--word': i } as CSSProperties}
            >
              {word}{' '}
            </span>
          ))}
        </h1>
        <p>{captions[page]}</p>
        {actions && <div className="bloom-hero-actions">{actions}</div>}
      </div>
      {!hero && <PageEmblem page={page} label={title} />}
      <div className="bloom-sculpture" aria-hidden="true" hidden={!hero}>
        <div className="bloom-orbit" />
        <div className="bloom-flower">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ '--petal': i } as CSSProperties} />
          ))}
          <b />
        </div>
        <span className="bloom-spark spark-one">✦</span>
        <span className="bloom-spark spark-two">✧</span>
      </div>
      <div className="bloom-heading-actions">
        {children}
      </div>
    </div>
  )
  return inSlot && slot ? createPortal(bar, slot) : bar
}

