import { prefersReducedMotion } from '../../utils/motion'
import { Children, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { readStore, writeStore } from '../studio/Studio'
import { subOn } from '../../features/subFeatures'
import { emblems } from './PageEmblem'
import './flow.css'

const reduced = prefersReducedMotion
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
  const [edges, setEdges] = useState({ start: true, end: true, scrollable: false })
  useEffect(() => {
    const node = row.current
    if (!node) return
    const update = () => setEdges({ start: node.scrollLeft <= 2, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2, scrollable: node.scrollWidth > node.clientWidth + 2 })
    update()
    node.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(node)
    return () => { node.removeEventListener('scroll', update); observer?.disconnect() }
  }, [page, links?.length])
  const move = (direction: number) => row.current?.scrollBy({ left: direction * row.current.clientWidth * .75, behavior: reduced() ? 'auto' : 'smooth' })
  useLayoutEffect(() => {
    if (!row.current || reduced()) return
    const tw = gsap.from(row.current.children, { x: -12, opacity: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out', delay: 0.4 })
    return () => void tw.progress(1)
  }, [page])
  if (!links || !subOn('pointerFx', 'linkRail', { ignoreParent: true })) return null
  return (
    <div className="link-rail-shell">
      {edges.scrollable && <button type="button" className="link-rail-arrow" aria-label="Previous related feature" disabled={edges.start} onClick={() => move(-1)}><ChevronLeft size={16} /></button>}
      <nav ref={row} className="link-rail" aria-label="Works well with" tabIndex={0} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1) } }}>
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
      {edges.scrollable && <button type="button" className="link-rail-arrow" aria-label="Next related feature" disabled={edges.end} onClick={() => move(1)}><ChevronRight size={16} /></button>}
    </div>
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

/** Settings → Custom CSS: a <style> tag kept in sync with the saved snippet. */
export function applyCustomCss() {
  let css = ''
  try {
    css = localStorage.getItem('bloom-custom-css') ?? ''
  } catch {
    /* none */
  }
  let tag = document.getElementById('bloom-custom-css') as HTMLStyleElement | null
  if (!css) return tag?.remove()
  if (!tag) {
    tag = document.createElement('style')
    tag.id = 'bloom-custom-css'
    document.head.appendChild(tag)
  }
  tag.textContent = css
}

/** Settings → "Follow system light/dark" (off by default). */
const SYSTEM_THEME_KEY = 'bloom-follow-system-theme'
export const followSystemTheme = () => {
  try {
    return localStorage.getItem(SYSTEM_THEME_KEY) === '1'
  } catch {
    return false
  }
}
export function setFollowSystemTheme(on: boolean) {
  try {
    localStorage.setItem(SYSTEM_THEME_KEY, on ? '1' : '0')
  } catch {
    /* optional */
  }
  window.dispatchEvent(new Event('bloom:follow-system-theme'))
}

/** Settings → "Page banner" (on by default): the title bar with the page's icon. */
const BANNER_KEY = 'bloom-page-banner'
export const pageBanner = () => {
  try {
    return localStorage.getItem(BANNER_KEY) !== '0'
  } catch {
    return true
  }
}
export function applyPageBanner() {
  document.documentElement.toggleAttribute('data-no-banner', !pageBanner())
}
export function setPageBanner(on: boolean) {
  try {
    localStorage.setItem(BANNER_KEY, on ? '1' : '0')
  } catch {
    /* optional */
  }
  applyPageBanner()
}

/**
 * Show a few at a time: the first `initial` items, then "Show N more" steps
 * and a "Show all". New items slide in with GSAP. Cuts scrolling on long
 * lists and grids without hiding anything for good.
 */
export function ShowMore({ children, initial = 6, step, className, label = 'more', as = 'div' }: { children: ReactNode; initial?: number; step?: number; className?: string; label?: string; as?: 'div' | 'ul' | 'ol' }) {
  const Tag = as
  const items = Children.toArray(children)
  // Remember how far you expanded this list (per page and list) for this visit.
  const memoKey = `bloom-showmore:${typeof location !== 'undefined' ? location.hash.split('/')[0] : ''}:${className ?? ''}:${label}`
  const [count, setCountState] = useState(() => {
    try {
      return Math.max(initial, Number(sessionStorage.getItem(memoKey)) || 0)
    } catch {
      return initial
    }
  })
  const setCount = (n: number) => {
    setCountState(n)
    try {
      sessionStorage.setItem(memoKey, String(n))
    } catch {
      /* optional */
    }
  }
  const box = useRef<HTMLDivElement>(null)
  const prev = useRef(count)
  useLayoutEffect(() => {
    const el = box.current
    if (!el || count <= prev.current || reduced()) {
      prev.current = count
      return
    }
    const fresh = [...el.children].slice(prev.current, count)
    prev.current = count
    const tw = gsap.from(fresh, { opacity: 0, y: 16, stagger: 0.04, duration: 0.35, ease: 'power2.out' })
    return () => void tw.progress(1)
  }, [count])
  const shown = items.slice(0, count)
  const rest = items.length - shown.length
  const by = step ?? initial
  return (
    <>
      <Tag ref={box as React.RefObject<never>} className={className}>
        {shown}
      </Tag>
      {(rest > 0 || count > initial) && (
        <div className="show-more">
          {rest > 0 && (
            <button type="button" className="show-more-btn" onClick={() => setCount(count + by)}>
              Show {Math.min(by, rest)} {label}
            </button>
          )}
          {rest > by && (
            <button type="button" className="show-more-btn ghost" onClick={() => setCount(items.length)}>
              Show all {items.length}
            </button>
          )}
          {count > initial && rest === 0 && (
            <button type="button" className="show-more-btn ghost" onClick={() => setCount(initial)}>
              Show less
            </button>
          )}
        </div>
      )}
    </>
  )
}

export { setHeadSlot, useHeadSlot } from './headSlot'
