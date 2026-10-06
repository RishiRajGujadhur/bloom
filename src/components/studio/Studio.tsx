import { prefersReducedMotion } from '../../utils/motion'
import { StudioNameContext } from './StudioScene'
import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import './studio.css'
import { setHeadSlot } from '../ui/headSlot'
import './shared.css'
import './galaxy.css'
import { GalaxyGlyph } from './GalaxyGlyph'
import { frameThrottle } from '../../utils/frameThrottle'
import { textOnColor } from '../../utils/textContrast'
import { usePageMode } from '../ui/PageMode'

/**
 * The shared page shell for Bloom's studios (exercise, sounds, meditation…):
 *   - fits the viewport, so pages barely scroll
 *   - an animated scene lives behind everything
 *   - tabs slide between panels with GSAP (arrow keys work too)
 */
export type StudioTab = { id: string; label: string; icon?: ReactNode; render: () => ReactNode }

const reduced = () => typeof window !== 'undefined' && prefersReducedMotion()

export function Studio({
  name,
  accent,
  scene,
  tabs,
  aside,
  initial,
  tab: controlled,
  onTab,
}: {
  name: string
  accent: string
  scene?: ReactNode
  tabs: StudioTab[]
  /** Small summary shown at the right of the tab bar (a stat, a toggle). */
  aside?: ReactNode
  initial?: string
  /** Controlled mode: the parent chooses the tab. */
  tab?: string
  onTab?: (id: string) => void
}) {
  const { mode } = usePageMode()
  const visible = mode === 'basic' ? tabs.filter(Boolean).slice(0, 1) : tabs.filter(Boolean)
  // Each page remembers its last tab (QoL #20).
  const tabKey = `bloom-tab-${name}`
  const remembered = (() => { try { return localStorage.getItem(tabKey) } catch { return null } })()
  // Deep links: #page/tab opens that tab (and the URL follows the tab you pick).
  const linked = typeof location !== 'undefined' ? location.hash.split('/')[1] : undefined
  const fromLink = linked && visible.some((t) => t.id === linked) ? linked : undefined
  const start = fromLink ?? (initial && visible.some((t) => t.id === initial) ? initial : remembered && visible.some((t) => t.id === remembered) ? remembered : visible[0]?.id)
  const [inner, setInner] = useState(start)
  const active = controlled && visible.some((t) => t.id === controlled) ? controlled : inner
  const setActive = (id: string) => {
    setInner(id)
    onTab?.(id)
    try { localStorage.setItem(tabKey, id) } catch { /* optional */ }
    try { history.replaceState(null, '', `${location.hash.split('/')[0] || '#'}/${id}`) } catch { /* optional */ }
  }
  // Controlled pages: restore the linked or remembered tab once on mount.
  useEffect(() => {
    const want = fromLink ?? (!initial ? remembered : null)
    if (onTab && want && want !== controlled && visible.some((t) => t.id === want)) onTab(want)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Number keys 1–9 switch tabs when you're not typing (QoL #57).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A page that claimed the key (e.g. a quiz answering with 1–4) takes priority.
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, dialog, [contenteditable="true"]')) return
      const n = Number(e.key)
      if (n >= 1 && n <= 9 && visible[n - 1]) { e.preventDefault(); setActive(visible[n - 1].id) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const panel = useRef<HTMLDivElement>(null)
  const tabStrip = useRef<HTMLDivElement>(null)
  const dir = useRef(1)
  const index = Math.max(0, visible.findIndex((t) => t.id === active))
  const tab = visible[index]

  useEffect(() => {
    const strip = tabStrip.current
    const selected = strip?.children[index] as HTMLElement | undefined
    if (!strip || !selected) return
    const left = selected.offsetLeft - (strip.clientWidth - selected.clientWidth) / 2
    strip.scrollTo({ left, behavior: reduced() ? 'instant' : 'smooth' })
  }, [active, index])

  useLayoutEffect(() => {
    if (!panel.current || reduced()) return
    const t = gsap.fromTo(panel.current, { x: 36 * dir.current, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42, ease: 'power3.out' })
    return () => void t.progress(1).kill()
  }, [active])

  const go = (i: number) => {
    const next = visible[(i + visible.length) % visible.length]
    if (!next) return
    dir.current = i >= index ? 1 : -1
    setActive(next.id)
  }

  return (
    <div className="studio" style={{ '--studio': accent, '--studio-text': textOnColor(accent) } as CSSProperties} data-studio={name}>
      {scene && (
        <div className="studio-scene" aria-hidden="true">
          <StudioNameContext.Provider value={name}>{scene}</StudioNameContext.Provider>
        </div>
      )}
      <div className="studio-bar">
        {visible.length > 1 && (
          <div className="studio-tab-nav">
          <button type="button" className="studio-tab-arrow" aria-label={`Previous section: ${visible[(index - 1 + visible.length) % visible.length].label}`} title="Previous section" onClick={() => go(index - 1)}><ChevronLeft size={18} aria-hidden="true" /></button>
          <div ref={tabStrip} className="studio-tabs" role="tablist" aria-label={`${name} sections`}>
            {visible.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                id={`studio-${name}-${t.id}`}
                aria-selected={t.id === tab?.id}
                aria-controls={`studio-${name}-panel`}
                tabIndex={t.id === tab?.id ? 0 : -1}
                onClick={(e) => {
                  go(i)
                  const icon = e.currentTarget.querySelector(document.documentElement.dataset.theme === 'galaxy' ? '.studio-galaxy-icon svg' : '.studio-original-icon svg')
                  if (icon && !reduced()) gsap.fromTo(icon, { rotate: -25, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.4)' })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') go(i + 1)
                  if (e.key === 'ArrowLeft') go(i - 1)
                }}
              >
                <span className="studio-original-icon">{t.icon}</span>
                <span className="studio-galaxy-icon"><GalaxyGlyph label={t.label} id={t.id} /></span>
                <span>{t.label}</span>
              </button>
            ))}
            <span className="studio-tab-ink" style={{ ['--i' as string]: index, ['--n' as string]: visible.length } as CSSProperties} aria-hidden="true" />
          </div>
          <button type="button" className="studio-tab-arrow" aria-label={`Next section: ${visible[(index + 1) % visible.length].label}`} title="Next section" onClick={() => go(index + 1)}><ChevronRight size={18} aria-hidden="true" /></button>
          </div>
        )}
        <div className="studio-head-slot" ref={(el) => setHeadSlot(el)} />
        {aside && <div className="studio-aside">{aside}</div>}
      </div>
      <div ref={panel} className="studio-panel" role="tabpanel" id={`studio-${name}-panel`} aria-labelledby={tab ? `studio-${name}-${tab.id}` : undefined}>
        {tab?.render()}
      </div>
    </div>
  )
}

/** A labelled range with the value shown big — Bloom's default number input. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  format,
  compact,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  format?: (v: number) => string
  compact?: boolean
}) {
  const pct = ((value - min) / Math.max(1e-9, max - min)) * 100
  return (
    <label className="bloom-slider" data-compact={compact}>
      <span className="bloom-slider-head">
        <span>{label}</span>
        <strong key={value} className="bloom-slider-value">
          {format ? format(value) : value}
          {unit && <small>{unit}</small>}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ ['--fill' as string]: `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

/** Big number tile. */
/** 12345.6 -> "12,345.6" in the reader's locale. */
const fmtNum = (v: number, dec: number) => v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })

export function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  const el = useRef<HTMLElement>(null)
  const last = useRef<number | null>(null)
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : null
  // Numbers count up (or down) to their new value with a little bump; GSAP owns that text.
  useLayoutEffect(() => {
    if (n === null || !el.current) return
    const from = last.current ?? 0
    last.current = n
    const dec = String(n).includes('.') ? 1 : 0
    if (reduced() || from === n) {
      el.current.textContent = fmtNum(n, dec)
      return
    }
    const o = { v: from }
    const tw = gsap.to(o, { v: n, duration: 0.9, ease: 'power3.out', onUpdate: () => { if (el.current) el.current.textContent = fmtNum(o.v, dec) } })
    gsap.fromTo(el.current, { scale: 1.18 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
    return () => void tw.progress(1).kill()
  }, [n])
  return (
    <div className="studio-stat" title={hint}>
      {n === null ? <strong>{value}</strong> : <strong ref={el} aria-label={String(n)} />}
      <small>{label}</small>
    </div>
  )
}

/** Horizontal, snap-scrolling card rail: the "slider" layout for lists. */
/** A sideways list with slider arrows (and Show all), like the card rails. */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const [all, setAll] = useState(false)
  const count = Children.count(children)
  useEffect(() => {
    const node = track.current
    if (!node) return
    const update = frameThrottle(() => {
      const start = node.scrollLeft < 2
      const end = node.scrollLeft + node.clientWidth >= node.scrollWidth - 2
      setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end })
    })
    update()
    node.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(node)
    return () => {
      node.removeEventListener('scroll', update)
      update.cancel()
      ro?.disconnect()
    }
  }, [count, all])
  const move = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: reduced() ? 'auto' : 'smooth' })
  const scrollable = !(edges.start && edges.end)
  return (
    <div className="studio-rail-wrap">
      {(scrollable || all) && (
        <div className="studio-rail-arrows">
          <button type="button" onClick={() => setAll(!all)} aria-expanded={all}>
            {all ? 'Show slider' : `Show all ${count}`}
          </button>
          {!all && (
            <>
              <button type="button" aria-label={`Previous ${label}`} disabled={edges.start} onClick={() => move(-1)}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" aria-label={`Next ${label}`} disabled={edges.end} onClick={() => move(1)}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      )}
      <div
        ref={track}
        className={`studio-rail${all ? ' is-all' : ''}`}
        role="list"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'ArrowRight') move(1)
          if (e.key === 'ArrowLeft') move(-1)
        }}
      >
        {Children.map(children, (child) => isValidElement<{ role?: string }>(child) && child.props.role === 'listitem' ? child : <div role="listitem">{child}</div>)}
      </div>
    </div>
  )
}

/** Segmented choice (radio group) with a sliding highlight. */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  const { mode } = usePageMode()
  if (mode === 'basic' && options.length > 3) return <label className="basic-choice">{label}<select value={value} onChange={event => onChange(event.target.value as T)}>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
  return (
    <div className="studio-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Local persistence helper used by the studios. */
export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    // Only merge plain objects over the defaults; arrays (and other values) are
    // returned as saved — spreading an array into an object would break it.
    if (Array.isArray(fallback) || Array.isArray(parsed)) return (Array.isArray(parsed) ? parsed : fallback) as T
    if (parsed && typeof parsed === 'object' && fallback && typeof fallback === 'object') return { ...fallback, ...(parsed as object) } as T
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}
export function writeStore<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* This visit keeps working. */
  }
}

/** Soft floating orbs + a flowing line: the default living backdrop. */
export { StudioScene } from './StudioScene'

export const ACTIVITY_KEY = 'bloom-activity-v1'
/** Any studio session (a workout, a meditation…) counts as a day you showed up. */
export function logActivity(kind: string, detail: Record<string, unknown> = {}) {
  try {
    const list = JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? '[]') as unknown[]
    list.push({ at: Date.now(), kind, ...detail })
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(-3000)))
  } catch {
    /* best effort */
  }
}
