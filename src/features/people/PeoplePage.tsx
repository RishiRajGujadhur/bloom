import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import chroma from 'chroma-js'
import Fuse from 'fuse.js'
import { differenceInCalendarDays, format } from 'date-fns'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { daysSince, health, nextBirthday, rhythms, suggestions, type Person } from './peopleModel'
import './people.css'

/**
 * People Garden — the people who matter as plants in an SVG garden. Plants
 * droop and brown as time passes beyond how often you want to be in touch;
 * “We talked” waters them (GSAP drops) and they spring back up. Birthdays come
 * from a yearly rrule and can be exported to your calendar (ics).
 */
const KEY = 'bloom-people-v1'
const today0 = () => format(new Date(), 'yyyy-MM-dd')
const leafColor = chroma.scale(['#8a6a3c', '#c9a227', '#58cc02']).mode('lab')
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Plant({ p, x, y, selected, onPick }: { p: Person; x: number; y: number; selected: boolean; onPick: () => void }) {
  const h = health(p)
  const droop = (1 - h) * 55
  const color = leafColor(h).hex()
  return (
    // Position lives on a plain outer group: global [role=button] styles may set a CSS transform, which would override it.
    <g transform={`translate(${x} ${y})`}>
    <g className={`pg-plant ${selected ? 'sel' : ''}`} onClick={onPick} role="button" aria-label={`${p.name}, ${Math.round(h * 100)}% blooming`} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onPick()}>
      {/* GSAP sways this inner group; React owns the outer group's position. */}
      <g className="pg-sway">
        {/* An invisible hit area: groups only receive clicks on painted shapes. */}
        <rect x="-44" y="-100" width="88" height="136" fill="transparent" />
      <ellipse cx="0" cy="4" rx="34" ry="8" className="pg-pot-shadow" />
      <path d="M-22 -8 L22 -8 L16 6 L-16 6 Z" className="pg-pot" />
      <g className="pg-stem-wrap" transform={`rotate(${droop} 0 -8)`}>
        <g className="pg-stem" data-id={p.id}>
        <path d={`M0 -8 C 0 -30, ${droop / 6} -46, 0 -64`} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M0 -30 C -18 -34, -24 -44, -22 -50 C -12 -48, -4 -40, 0 -30 Z" fill={color} />
        <path d="M0 -40 C 18 -44, 24 -54, 22 -60 C 12 -58, 4 -50, 0 -40 Z" fill={color} />
        <g transform="translate(0 -70)">
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-8" rx="6" ry="10" transform={`rotate(${a})`} fill={chroma.mix('#ff9ec4', '#8a6a3c', 1 - h).hex()} opacity={0.35 + h * 0.65} />)}
          <text y="6" textAnchor="middle" className="pg-face">{p.emoji}</text>
        </g>
        </g>
      </g>
      <text y="26" textAnchor="middle" className="pg-name">{p.name}</text>
      <g className="pg-drops" data-drops={p.id}>{[-10, 0, 10].map((dx) => <path key={dx} d={`M${dx} -120 q 4 6 0 9 q -4 -3 0 -9 z`} fill="#4fb3d9" opacity="0" />)}</g>
      </g>
    </g>
    </g>
  )
}

export function PeoplePage() {
  const [people, setPeople] = useState<Person[]>(() => readStore<Person[]>(KEY, []))
  const save = (f: (p: Person[]) => Person[]) => setPeople((x) => { const n = f(x); writeStore(KEY, n); return n })
  const [sel, setSel] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const svg = useRef<SVGSVGElement>(null)
  const fuse = useMemo(() => new Fuse(people, { keys: ['name', 'notes'], threshold: 0.35 }), [people])
  const shown = query ? fuse.search(query).map((r) => r.item) : people
  const person = people.find((p) => p.id === sel) ?? null
  const cols = Math.max(4, Math.min(6, Math.ceil(Math.sqrt(shown.length * 2))))
  const rows = Math.max(1, Math.ceil(shown.length / cols))
  const W = cols * 120
  const H = rows * 150 + 30
  const sugg = suggestions(people).slice(0, 4)
  const birthdays = people.map((p) => ({ p, d: nextBirthday(p) })).filter((x) => x.d).sort((a, b) => a.d!.getTime() - b.d!.getTime()).slice(0, 4)

  // Plants sway gently.
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const ctx = gsap.context(() => {
      gsap.to('.pg-sway', { rotation: () => gsap.utils.random(-2.5, 2.5), transformOrigin: '50% 100%', duration: () => gsap.utils.random(2.2, 3.4), yoyo: true, repeat: -1, ease: 'sine.inOut' })
    }, svg)
    return () => ctx.revert()
  }, [shown.length])

  const water = (id: string) => {
    save((ps) => ps.map((p) => (p.id === id ? { ...p, last: today0() } : p)))
    const drops = svg.current?.querySelectorAll(`[data-drops="${id}"] path`)
    const stem = svg.current?.querySelector(`.pg-stem[data-id="${id}"]`)
    if (drops && !reduced()) gsap.fromTo(drops, { y: 0, opacity: 1 }, { y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power1.in' })
    if (stem && !reduced()) gsap.fromTo(stem, { scale: 0.85 }, { scale: 1, duration: 0.8, delay: 0.5, ease: 'elastic.out(1.2, 0.4)' })
    burst(undefined, 'stars')
  }
  const exportBirthdays = async () => {
    const { createEvents } = await import('ics')
    const events = people.filter((p) => p.birthday).map((p) => {
      const [y, m, d] = p.birthday!.split('-').map(Number)
      return { title: `🎂 ${p.name}’s birthday`, start: [Math.max(y, 1971), m, d] as [number, number, number], duration: { days: 1 }, recurrenceRule: 'FREQ=YEARLY' }
    })
    const { value } = createEvents(events)
    if (!value) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([value], { type: 'text/calendar' }))
    a.download = 'bloom-birthdays.ics'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="pg-page">
      <section className="pg-garden-wrap">
        <header className="pg-head">
          <div>
            <p className="pg-eyebrow">People garden · {people.length} {people.length === 1 ? 'person' : 'people'}</p>
            <h2>Tend the people who matter</h2>
          </div>
          <input className="studio-input pg-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find someone…" aria-label="Find someone" />
        </header>
        {people.length ? (
          <svg ref={svg} className="pg-garden" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Your garden" data-matrix-native>
            <defs><linearGradient id="pg-soil" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b98556" /><stop offset="1" stopColor="#7a5230" /></linearGradient></defs>
            {Array.from({ length: rows }, (_, r) => <rect key={r} x="0" y={r * 150 + 126} width={W} height="16" rx="8" fill="url(#pg-soil)" opacity="0.35" />)}
            {shown.map((p, i) => <Plant key={p.id} p={p} x={(i % cols) * 120 + 60} y={Math.floor(i / cols) * 150 + 128} selected={sel === p.id} onPick={() => setSel(p.id)} />)}
          </svg>
        ) : (
          <div className="pg-empty">
            <p>Your garden is empty. Plant someone you’d like to stay close to →</p>
          </div>
        )}
      </section>
      <aside className="pg-side">
        {person ? (
          <div className="pg-card">
            <h3>{person.emoji} {person.name}</h3>
            <p>{daysSince(person) === 0 ? 'You talked today 💚' : `Last talked ${daysSince(person)} days ago`} · {Math.round(health(person) * 100)}% blooming</p>
            <button type="button" className="pg-cta" onClick={() => water(person.id)}>💧 We talked today</button>
            <label>Keep in touch
              <select className="studio-input" value={person.every} onChange={(e) => save((ps) => ps.map((p) => (p.id === person.id ? { ...p, every: Number(e.target.value) } : p)))}>
                {rhythms.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}
              </select>
            </label>
            <label>Birthday <input type="date" className="studio-input" value={person.birthday ?? ''} onChange={(e) => save((ps) => ps.map((p) => (p.id === person.id ? { ...p, birthday: e.target.value || undefined } : p)))} /></label>
            <textarea className="studio-input" rows={3} placeholder="Things to remember: kids’ names, what they’re excited about…" value={person.notes ?? ''} onChange={(e) => save((ps) => ps.map((p) => (p.id === person.id ? { ...p, notes: e.target.value } : p)))} />
            <button type="button" className="pg-ghost" onClick={() => { save((ps) => ps.filter((p) => p.id !== person.id)); setSel(null) }}>Remove from garden</button>
          </div>
        ) : (
          <form className="pg-card" onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            const name = String(f.get('name') || '').trim()
            if (!name) return
            save((ps) => [...ps, { id: crypto.randomUUID(), name, emoji: String(f.get('emoji') || '🙂'), every: Number(f.get('every')), last: today0(), birthday: String(f.get('birthday') || '') || undefined }])
            e.currentTarget.reset()
          }}>
            <h3>🌱 Plant someone</h3>
            <div className="pg-row"><input name="emoji" className="studio-input pg-emoji" placeholder="🙂" maxLength={4} aria-label="Emoji" /><input name="name" className="studio-input" placeholder="Name" aria-label="Name" /></div>
            <select name="every" className="studio-input" defaultValue={30} aria-label="How often">{rhythms.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}</select>
            <label>Birthday (optional) <input name="birthday" type="date" className="studio-input" /></label>
            <button type="submit" className="pg-cta">Plant</button>
          </form>
        )}
        {sugg.length > 0 && (
          <div className="pg-card">
            <h3>Reach out today</h3>
            {sugg.map(({ p, bdayIn }) => <button key={p.id} type="button" className="pg-sugg" onClick={() => setSel(p.id)}>{p.emoji} {p.name}<small>{bdayIn <= 7 ? (bdayIn === 0 ? '🎂 birthday today!' : `🎂 in ${bdayIn} days`) : `${daysSince(p)} days — overdue`}</small></button>)}
          </div>
        )}
        {birthdays.length > 0 && (
          <div className="pg-card">
            <h3>Birthdays</h3>
            {birthdays.map(({ p, d }) => <p key={p.id} className="pg-bday">{p.emoji} {p.name} <small>{format(d!, 'd MMM')} · {differenceInCalendarDays(d!, new Date())} days</small></p>)}
            <button type="button" className="pg-ghost" onClick={() => void exportBirthdays()}>📅 Add to my calendar (.ics)</button>
          </div>
        )}
      </aside>
    </div>
  )
}
