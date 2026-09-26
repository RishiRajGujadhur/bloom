import {
  Children,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight, Leaf, Pause, Play } from 'lucide-react'
import heroLandscape from '../assets/bloom/hero-landscape.webp'
import type { NavKey } from './layout/Sidebar'
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
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
}: {
  title: string
  page: NavKey
  children: ReactNode
  /** Call-to-action buttons; the overview uses them to make the heading a hero. */
  actions?: ReactNode
}) {
  const hero = page === 'overview'
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem('bloom-motion') === 'paused'
    } catch {
      return false
    }
  })
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
  return (
    <div className={`bloom-heading feature-heading${hero ? ' is-hero' : ''}`}>
      {hero && (
        <img className="bloom-hero-art" src={heroLandscape} alt="" aria-hidden="true" />
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
            d={`M 240 ${165 + i * 16} C 400 ${-120 + i * 20}, 560 ${260 + i * 16}, 820 ${-40 + i * 18}`}
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
      <div className="bloom-sculpture" aria-hidden="true">
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
        <button
          className="bloom-motion-toggle"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
          aria-label={
            paused ? 'Resume decorative motion' : 'Pause decorative motion'
          }
          title={
            paused ? 'Resume decorative motion' : 'Pause decorative motion'
          }
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>
    </div>
  )
}
