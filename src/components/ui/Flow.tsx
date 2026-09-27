import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-react'
import { readStore, writeStore } from '../studio/Studio'
import { subOn } from '../../features/subFeatures'
import { emblems } from './PageEmblem'
import { BloomFace } from './BloomFace'
import './flow.css'

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const narrow = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 720px)').matches

/**
 * How features feed each other. Each link says *why* it helps, and shows on
 * the page as one compact row, so moving between features takes one tap.
 */
export const featureLinks: Record<string, { page: string; why: string }[]> = {
  overview: [{ page: 'todos', why: 'Plan the day' }, { page: 'focus', why: 'Do the next thing' }, { page: 'mood', why: 'Check in' }],
  todos: [{ page: 'focus', why: 'Focus on one' }, { page: 'calendar', why: 'Block the time' }, { page: 'roadmap', why: 'Tie to a goal' }],
  focus: [{ page: 'todos', why: 'Pick a task' }, { page: 'sounds', why: 'Focus sounds' }, { page: 'growth', why: 'Sun for your seedling' }],
  calendar: [{ page: 'todos', why: 'Tasks due' }, { page: 'routines', why: 'Routines' }, { page: 'focus', why: 'Start a block' }],
  habits: [{ page: 'growth', why: 'Waters your seedling' }, { page: 'routines', why: 'Stack into routines' }, { page: 'urges', why: 'Break a bad one' }],
  routines: [{ page: 'habits', why: 'Habits inside' }, { page: 'calendar', why: 'Schedule it' }, { page: 'daylight', why: 'Time with the sun' }],
  urges: [{ page: 'breathe', why: 'Breathe it out' }, { page: 'habits', why: 'Replace with a habit' }, { page: 'release', why: 'Burn the thought' }],
  challenges: [{ page: 'todos', why: 'Becomes tasks' }, { page: 'growth', why: 'Earn growth' }, { page: 'habits', why: 'Build a habit' }],
  growth: [{ page: 'habits', why: 'Water' }, { page: 'focus', why: 'Sun' }, { page: 'journal', why: 'Leaves' }],
  daybook: [{ page: 'epiphanies', why: 'Save insights' }, { page: 'mood', why: 'Tag your mood' }, { page: 'journal', why: 'Guided chat' }],
  journal: [{ page: 'daybook', why: 'Longer pages' }, { page: 'mood', why: 'Mood trend' }, { page: 'epiphanies', why: 'Keep insights' }],
  epiphanies: [{ page: 'daybook', why: 'Where insights come from' }, { page: 'cards', why: 'Study as cards' }, { page: 'palace', why: 'Memory palace' }],
  mood: [{ page: 'breathe', why: 'Calm down' }, { page: 'gratitude', why: 'Lift up' }, { page: 'sleep', why: 'Sleep affects mood' }],
  gratitude: [{ page: 'mood', why: 'See the lift' }, { page: 'daybook', why: 'Write more' }, { page: 'affirm', why: 'Kind words' }],
  sleep: [{ page: 'daylight', why: 'Light & caffeine' }, { page: 'meditate', why: 'Wind down' }, { page: 'mood', why: 'How it feels' }],
  breathe: [{ page: 'meditate', why: 'Go deeper' }, { page: 'mood', why: 'Check again' }, { page: 'urges', why: 'Ride an urge' }],
  breathwork: [{ page: 'breathe', why: 'Gentler breathing' }, { page: 'focus', why: 'Then focus' }, { page: 'mood', why: 'Log the lift' }],
  meditate: [{ page: 'breathe', why: 'Breath first' }, { page: 'sleep', why: 'Sleep sessions' }, { page: 'mala', why: 'Count mantras' }],
  exercises: [{ page: 'dojo', why: 'Martial arts' }, { page: 'workouts', why: 'Log sets' }, { page: 'stretch', why: 'Cool down' }],
  dojo: [{ page: 'exercises', why: 'Strength moves' }, { page: 'intervals', why: 'Rounds timer' }, { page: 'taichi', why: 'Soft arts' }],
  workouts: [{ page: 'exercises', why: 'Learn the move' }, { page: 'body', why: 'Track progress' }, { page: 'diet', why: 'Fuel' }],
  intervals: [{ page: 'workouts', why: 'Log it' }, { page: 'run', why: 'Run intervals' }, { page: 'dojo', why: 'Fight rounds' }],
  run: [{ page: 'intervals', why: 'Speed work' }, { page: 'stretch', why: 'Stretch after' }, { page: 'places', why: 'Where you ran' }],
  stretch: [{ page: 'yoga', why: 'Longer flows' }, { page: 'posture', why: 'Posture guard' }, { page: 'exercises', why: 'Strength' }],
  yoga: [{ page: 'breathe', why: 'Breath' }, { page: 'stretch', why: 'Mobility' }, { page: 'meditate', why: 'Sit after' }],
  diet: [{ page: 'fasting', why: 'Eating window' }, { page: 'workouts', why: 'Training' }, { page: 'mood', why: 'Food & mood' }],
  fasting: [{ page: 'diet', why: 'Break the fast' }, { page: 'sleep', why: 'Sleep window' }, { page: 'daylight', why: 'Day rhythm' }],
  games: [{ page: 'cards', why: 'Flashcards' }, { page: 'palace', why: 'Memory palace' }, { page: 'focus', why: 'Focus after' }],
  shop: [{ page: 'world', why: 'Place decor' }, { page: 'habits', why: 'Earn petals' }, { page: 'street', why: 'Walk the town' }],
  world: [{ page: 'shop', why: 'Buy decor' }, { page: 'growth', why: 'Your seedling' }, { page: 'street', why: 'Bloom Street' }],
  daylight: [{ page: 'sleep', why: 'Better nights' }, { page: 'eyes', why: 'Screen breaks' }, { page: 'routines', why: 'Morning routine' }],
  eyes: [{ page: 'screen', why: 'Screen time' }, { page: 'posture', why: 'Posture' }, { page: 'daylight', why: 'Go outside' }],
  affirm: [{ page: 'mood', why: 'Mood' }, { page: 'gratitude', why: 'Gratitude' }, { page: 'mirror', why: 'Mirror talk' }],
  release: [{ page: 'urges', why: 'Urges' }, { page: 'daybook', why: 'Write it out' }, { page: 'breathe', why: 'Breathe' }],
  street: [{ page: 'overview', why: 'Home' }, { page: 'shop', why: 'Bank' }, { page: 'daybook', why: 'Library' }],
}

const title = (page: string) => page.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** One row of linked features with animated SVG connectors. */
export function LinkRail({ page, names, enabled = () => true }: { page: string; names?: Record<string, string>; enabled?: (p: string) => boolean }) {
  const links = featureLinks[page]?.filter((l) => enabled(l.page))
  const row = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!row.current || reduced()) return
    const tw = gsap.from(row.current.children, { x: -12, opacity: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out', delay: 0.4 })
    return () => void tw.progress(1)
  }, [page])
  if (!links || !subOn('pointerFx', 'linkRail', { ignoreParent: true })) return null
  return (
    <nav ref={row} className="link-rail" aria-label="Works well with">
      <button type="button" className="link-chip ask-bloom" style={{ ['--c' as string]: '#e0703f' }} onClick={() => window.dispatchEvent(new CustomEvent('bloom:guide', { detail: { dock: true } }))} data-hint="Open Bloom’s guide beside this page">
        <BloomFace size={26} follow={false} label="" waveOnMount={false} />
        <span>Ask Bloom</span>
      </button>
      <span className="link-rail-label">Works with</span>
      {links.map((l) => {
        const e = emblems[l.page]
        return (
          <a key={l.page} href={`#${l.page}`} className="link-chip" style={{ ['--c' as string]: e?.color ?? '#e0703f' }} data-hint={l.why} data-cursor-text={l.why}>
            {e && <e.Icon size={14} aria-hidden="true" />}
            <span>{names?.[l.page] ?? title(l.page)}</span>
            <svg className="link-arrow" viewBox="0 0 16 8" aria-hidden="true">
              <path d="M0 4 H13 M10 1 L14 4 L10 7" />
            </svg>
          </a>
        )
      })}
    </nav>
  )
}

/**
 * Fold: a section that collapses to one summary line. On phones it starts
 * folded, so pages open short; the choice is remembered per section.
 */
export function Fold({ id, title: heading, summary, children }: { id: string; title: string; summary?: ReactNode; children: ReactNode }) {
  const key = 'bloom-folds-v1'
  const [open, setOpen] = useState(() => readStore<Record<string, boolean>>(key, {})[id] ?? !narrow())
  const body = useRef<HTMLDivElement>(null)
  const toggle = () => {
    const next = !open
    setOpen(next)
    writeStore(key, { ...readStore<Record<string, boolean>>(key, {}), [id]: next })
  }
  useLayoutEffect(() => {
    if (!open || !body.current || reduced()) return
    const tw = gsap.fromTo(body.current, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'height' })
    return () => void tw.progress(1)
  }, [open])
  return (
    <section className="fold" data-open={open}>
      <button type="button" className="fold-head" aria-expanded={open} onClick={toggle} data-hint={open ? 'Fold away' : 'Open'}>
        <strong>{heading}</strong>
        {summary && <span className="fold-summary">{summary}</span>}
        <ChevronDown size={16} className="fold-chev" aria-hidden="true" />
      </button>
      {open && (
        <div ref={body} className="fold-body">
          {children}
        </div>
      )}
    </section>
  )
}

/**
 * Hover hints: anything with `data-hint` (or an icon-only button with an
 * aria-label) shows a small label that follows the pointer. Works with any
 * pointer style; skipped on touch screens.
 */
export function HoverHints() {
  const chip = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  useEffect(() => {
    const el = chip.current
    if (!el || !window.matchMedia?.('(hover: hover)').matches || !subOn('pointerFx', 'hoverHints', { ignoreParent: true })) return
    const x = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' })
    const y = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' })
    const labelOf = (t: HTMLElement | null) => {
      const hinted = t?.closest<HTMLElement>('[data-hint]')
      if (hinted) return hinted.dataset.hint ?? ''
      const iconOnly = t?.closest<HTMLElement>('button[aria-label], a[aria-label]')
      return iconOnly && !iconOnly.textContent?.trim() ? (iconOnly.getAttribute('aria-label') ?? '') : ''
    }
    const move = (e: PointerEvent) => {
      x(e.clientX + 16)
      y(e.clientY + 18)
    }
    const over = (e: PointerEvent) => {
      const label = labelOf(e.target as HTMLElement)
      setText(label)
      gsap.to(el, { autoAlpha: label ? 1 : 0, scale: label ? 1 : 0.8, duration: 0.15 })
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
    }
  }, [])
  return (
    <div ref={chip} className="hover-hint" role="presentation" aria-hidden="true">
      {text}
    </div>
  )
}

/** Settings → "Compact page titles" (on by default). */
const TITLES_KEY = 'bloom-compact-titles'
export const compactTitles = () => {
  try {
    return localStorage.getItem(TITLES_KEY) !== '0'
  } catch {
    return true
  }
}
export function applyCompactTitles() {
  document.documentElement.toggleAttribute('data-compact-titles', compactTitles())
}
export function setCompactTitles(on: boolean) {
  try {
    localStorage.setItem(TITLES_KEY, on ? '1' : '0')
  } catch {
    /* optional */
  }
  applyCompactTitles()
}
