import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import gsap from 'gsap'
import './studio.css'

/**
 * The shared page shell for Bloom's studios (exercise, sounds, meditation…):
 *   - fits the viewport, so pages barely scroll
 *   - an animated scene lives behind everything
 *   - tabs slide between panels with GSAP (arrow keys work too)
 */
export type StudioTab = { id: string; label: string; icon?: ReactNode; render: () => ReactNode }

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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
  const visible = tabs.filter(Boolean)
  const [inner, setInner] = useState(initial && visible.some((t) => t.id === initial) ? initial : visible[0]?.id)
  const active = controlled && visible.some((t) => t.id === controlled) ? controlled : inner
  const setActive = (id: string) => {
    setInner(id)
    onTab?.(id)
  }
  const panel = useRef<HTMLDivElement>(null)
  const dir = useRef(1)
  const index = Math.max(0, visible.findIndex((t) => t.id === active))
  const tab = visible[index]

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
    <div className="studio" style={{ ['--studio' as string]: accent } as CSSProperties} data-studio={name}>
      {scene && (
        <div className="studio-scene" aria-hidden="true">
          {scene}
        </div>
      )}
      <div className="studio-bar">
        {visible.length > 1 && (
          <div className="studio-tabs" role="tablist" aria-label={`${name} sections`}>
            {visible.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                id={`studio-${name}-${t.id}`}
                aria-selected={t.id === tab?.id}
                aria-controls={`studio-${name}-panel`}
                tabIndex={t.id === tab?.id ? 0 : -1}
                onClick={() => go(i)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') go(i + 1)
                  if (e.key === 'ArrowLeft') go(i - 1)
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
            <span className="studio-tab-ink" style={{ ['--i' as string]: index, ['--n' as string]: visible.length } as CSSProperties} aria-hidden="true" />
          </div>
        )}
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
        <strong>
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
export function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  return (
    <div className="studio-stat" title={hint}>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  )
}

/** Horizontal, snap-scrolling card rail: the "slider" layout for lists. */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="studio-rail" role="list" aria-label={label}>
      {children}
    </div>
  )
}

/** Segmented choice (radio group) with a sliding highlight. */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
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
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback
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
