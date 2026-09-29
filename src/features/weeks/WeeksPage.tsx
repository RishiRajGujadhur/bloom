import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import chroma from 'chroma-js'
import { scaleOrdinal } from 'd3-scale'
import { addWeeks, differenceInCalendarWeeks, differenceInDays, format, isValid, parseISO } from 'date-fns'
import { z } from 'zod'
import { readStore, writeStore } from '../../components/studio/Studio'
import './weeks.css'

/**
 * Life in Weeks — your life as a grid of weeks (one row per year). Lived weeks
 * fill in, the current week pulses, chapters colour whole stretches and
 * milestones glow. On open the grid ripples outward from "now" (GSAP grid
 * stagger) and a kinetic headline counts the Sundays you have left.
 */
const KEY = 'bloom-weeks-v1'
const chapterSchema = z.object({ id: z.string(), name: z.string().min(1).max(40), from: z.string(), to: z.string() })
const milestoneSchema = z.object({ id: z.string(), name: z.string().min(1).max(40), date: z.string(), emoji: z.string().max(4) })
const storeSchema = z.object({
  birth: z.string().default('1995-06-15'),
  years: z.number().int().min(40).max(110).default(85),
  chapters: z.array(chapterSchema).default([]),
  milestones: z.array(milestoneSchema).default([]),
})
type Store = z.infer<typeof storeSchema>
const load = (): Store => {
  const r = storeSchema.safeParse(readStore(KEY, {}))
  return r.success ? r.data : storeSchema.parse({})
}
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const COLS = 52
const CELL = 9
const GAP = 2

function Counter({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    if (reduced()) {
      ref.current.textContent = value.toLocaleString()
      return
    }
    const o = { v: 0 }
    const tw = gsap.to(o, { v: value, duration: 1.6, ease: 'power3.out', onUpdate: () => { if (ref.current) ref.current.textContent = Math.round(o.v).toLocaleString() } })
    return () => void tw.kill()
  }, [value])
  return <div className="lw-stat"><strong ref={ref} aria-label={String(value)} /><small>{label}</small></div>
}

export function WeeksPage() {
  const [store, setStore] = useState<Store>(load)
  const save = (f: (s: Store) => Store) =>
    setStore((s) => {
      const n = storeSchema.parse(f(s))
      writeStore(KEY, n)
      return n
    })
  const [hover, setHover] = useState<number | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const birth = parseISO(store.birth)
  const valid = isValid(birth)
  const today = new Date()
  const total = store.years * COLS
  const lived = valid ? Math.max(0, Math.min(total, differenceInCalendarWeeks(today, birth))) : 0
  const left = total - lived
  const palette = useMemo(() => scaleOrdinal<string, string>().range(chroma.scale(['#ff8a5a', '#8f7ae5', '#1cb0f6', '#58cc02', '#ffc800']).mode('lch').colors(6)), [])
  const weekOf = (iso: string) => (valid ? differenceInCalendarWeeks(parseISO(iso), birth) : -1)
  const chapterAt = useMemo(() => {
    const map = new Map<number, { name: string; color: string }>()
    for (const c of store.chapters) {
      const a = weekOf(c.from)
      const b = weekOf(c.to)
      for (let w = Math.max(0, a); w <= Math.min(total - 1, b); w++) map.set(w, { name: c.name, color: palette(c.id) })
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.chapters, store.birth, total, palette])
  const milestoneAt = useMemo(() => new Map(store.milestones.map((m) => [weekOf(m.date), m])), [store.milestones, store.birth]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ripple the grid outward from the current week, then pulse "now".
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const cells = svg.current.querySelectorAll('.lw-cell')
    const ctx = gsap.context(() => {
      gsap.fromTo(cells, { scale: 0, transformOrigin: '50% 50%', opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', stagger: { amount: 1.4, grid: [store.years, COLS], from: lived } })
      gsap.to('.lw-now', { scale: 1.9, transformOrigin: '50% 50%', duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.4 })
    }, svg)
    return () => ctx.revert()
  }, [store.years, store.birth, lived])
  // Kinetic headline: letters rise in.
  useLayoutEffect(() => {
    if (!title.current || reduced()) return
    gsap.fromTo(title.current.querySelectorAll('.lw-w'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power4.out' })
  }, [left])

  const sundays = left
  const summers = Math.max(0, store.years - (valid ? differenceInDays(today, birth) / 365.25 : 0))
  const moons = Math.round((left * 7) / 29.53)
  const hoverInfo = hover !== null && valid ? { from: addWeeks(birth, hover), age: Math.floor(hover / COLS), chapter: chapterAt.get(hover), milestone: milestoneAt.get(hover) } : null
  const headline = `${sundays.toLocaleString()} Sundays left`

  return (
    <div className="lw-page">
      <section className="lw-left">
        <p className="lw-eyebrow">Life in weeks</p>
        <h2 ref={title} className="lw-title" aria-label={headline}>
          {headline.split(' ').map((w, i) => <span key={i} className="lw-mask"><span className="lw-w">{w}</span></span>)}
        </h2>
        <p className="lw-sub">Each square is one week. Not to worry you — to remind you which weeks are yours to shape.</p>
        <div className="lw-stats">
          <Counter value={lived} label="weeks lived" />
          <Counter value={Math.round(summers)} label="summers ahead" />
          <Counter value={moons} label="full moons ahead" />
        </div>
        <form className="lw-form" onSubmit={(e) => e.preventDefault()}>
          <label>Born <input type="date" className="studio-input" value={store.birth} max={format(today, 'yyyy-MM-dd')} onChange={(e) => e.target.value && save((s) => ({ ...s, birth: e.target.value }))} /></label>
          <label>Plan for <input type="number" className="studio-input" min={40} max={110} value={store.years} onChange={(e) => save((s) => ({ ...s, years: Math.min(110, Math.max(40, Number(e.target.value) || 85)) }))} /> years</label>
        </form>
        <details className="lw-add">
          <summary>Chapters & milestones</summary>
          <form className="lw-form" onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            const kind = String(f.get('kind'))
            const name = String(f.get('name') || '').trim()
            const from = String(f.get('from') || '')
            const to = String(f.get('to') || from)
            if (!name || !from) return
            if (kind === 'chapter') save((s) => ({ ...s, chapters: [...s.chapters, { id: crypto.randomUUID(), name, from, to }] }))
            else save((s) => ({ ...s, milestones: [...s.milestones, { id: crypto.randomUUID(), name, date: from, emoji: String(f.get('emoji') || '⭐') }] }))
            e.currentTarget.reset()
          }}>
            <select name="kind" className="studio-input" aria-label="Type"><option value="chapter">Chapter</option><option value="milestone">Milestone</option></select>
            <input name="name" className="studio-input" placeholder="University, First job, Paris…" aria-label="Name" />
            <input name="from" type="date" className="studio-input" aria-label="From" />
            <input name="to" type="date" className="studio-input" aria-label="To (chapters)" />
            <input name="emoji" className="studio-input lw-emoji" placeholder="⭐" aria-label="Emoji (milestones)" maxLength={4} />
            <button type="submit" className="lw-cta">Add</button>
          </form>
          <div className="lw-tags">
            {store.chapters.map((c) => <button key={c.id} type="button" style={{ ['--c' as string]: palette(c.id) }} onClick={() => save((s) => ({ ...s, chapters: s.chapters.filter((x) => x.id !== c.id) }))} title="Remove">{c.name} ×</button>)}
            {store.milestones.map((m) => <button key={m.id} type="button" onClick={() => save((s) => ({ ...s, milestones: s.milestones.filter((x) => x.id !== m.id) }))} title="Remove">{m.emoji} {m.name} ×</button>)}
          </div>
        </details>
      </section>
      <section className="lw-right">
        <svg ref={svg} className="lw-grid" viewBox={`0 0 ${COLS * (CELL + GAP)} ${store.years * (CELL + GAP)}`} role="img" aria-label={`${lived} of ${total} weeks lived`} onMouseLeave={() => setHover(null)} data-matrix-native>
          {Array.from({ length: total }, (_, w) => {
            const x = (w % COLS) * (CELL + GAP)
            const y = Math.floor(w / COLS) * (CELL + GAP)
            const ch = chapterAt.get(w)
            const ms = milestoneAt.get(w)
            const past = w < lived
            const fill = ms ? '#ffc800' : ch ? (past ? ch.color : chroma(ch.color).alpha(0.35).css()) : past ? 'var(--lw-past)' : 'var(--lw-future)'
            return <rect key={w} className={`lw-cell ${w === lived ? 'lw-now' : ''}`} x={x} y={y} width={CELL} height={CELL} rx={ms ? 4.5 : 2} fill={w === lived ? '#ff4b4b' : fill} onMouseEnter={() => setHover(w)} />
          })}
        </svg>
        <p className="lw-tip" aria-live="polite">
          {hoverInfo ? <>Week of <strong>{format(hoverInfo.from, 'd MMM yyyy')}</strong> · age {hoverInfo.age}{hoverInfo.chapter ? ` · ${hoverInfo.chapter.name}` : ''}{hoverInfo.milestone ? ` · ${hoverInfo.milestone.emoji} ${hoverInfo.milestone.name}` : ''}</> : <>Hover a week · <span className="lw-key now" /> this week · <span className="lw-key past" /> lived · <span className="lw-key future" /> ahead</>}
        </p>
      </section>
    </div>
  )
}
