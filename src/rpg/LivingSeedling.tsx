import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import chroma from 'chroma-js'
import type { AppData } from '../model'
import { dayKey } from '../dates'
import { readMoodLog } from '../components/ui/QuickPanel'
import { subOn } from '../features/subFeatures'

const on = (id: string) => subOn('rpgSkillTree', id)

/** What today's activity gives the seedling. Each part links to its feature. */
export function seedlingInputs(data: AppData, today = dayKey(), now = Date.now()) {
  const since = new Date(`${today}T00:00:00`).getTime()
  const week = now - 7 * 864e5
  const water = data.habits.filter((h) => h.dates.includes(today)).length
  const sun = data.rpg.focusHistory.filter((f) => f.completedAt >= since).reduce((m, f) => m + f.minutes, 0)
  const leaves = data.sessions.filter((s) => Date.parse(s.metadata.date) >= week).length
  const tasks = data.todos.filter((t) => t.done && (t.completedAt ?? 0) >= since).length
  const moods = readMoodLog().filter((e) => e.at >= since).length
  const streak = (() => {
    let n = 0
    const d = new Date(`${today}T12:00:00`)
    const active = new Set(data.habits.flatMap((h) => h.dates))
    while (active.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1) }
    return n
  })()
  return { water, sun, leaves, tasks, moods, streak }
}

/** Season by month (northern hemisphere) tints the leaves. */
export const season = (month: number) => (month < 2 || month === 11 ? 'winter' : month < 5 ? 'spring' : month < 8 ? 'summer' : 'autumn')
const leafScale = { spring: ['#b5e48c', '#52b69a'], summer: ['#76c893', '#1a759f'], autumn: ['#f9c74f', '#f3722c'], winter: ['#a3c4bc', '#577590'] } as const

export function LivingSeedling({ data }: { data: AppData }) {
  const x = seedlingInputs(data)
  const stem = Math.min(90, 20 + x.sun * 0.8 + x.tasks * 6)
  const leaves = Math.min(10, x.leaves + x.tasks)
  const blooms = Math.min(6, Math.floor(x.streak / 2))
  const thirst = x.water === 0
  const s = on('seasons') ? season(new Date().getMonth()) : 'summer'
  const colours = chroma.scale([...leafScale[s]]).mode('lch').colors(Math.max(2, leaves))
  const root = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const el = root.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tl = gsap.timeline()
    tl.from(el.querySelector('.ls-stem'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.8, ease: 'power2.out' })
      .from(el.querySelectorAll('.ls-leaf'), { scale: 0, transformOrigin: '50% 100%', stagger: 0.06, duration: 0.4, ease: 'back.out(2)' }, '-=0.3')
      .from(el.querySelectorAll('.ls-bloom'), { scale: 0, rotate: -90, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.5, ease: 'back.out(3)' }, '-=0.2')
    const sway = gsap.to(el.querySelector('.ls-plant'), { rotate: 2, transformOrigin: '50% 100%', yoyo: true, repeat: -1, duration: 2.4, ease: 'sine.inOut' })
    return () => { tl.revert(); sway.revert() }
  }, [leaves, blooms, stem])
  const top = 150 - stem
  const parts = [
    { key: 'water', label: `Water: ${x.water} habit${x.water === 1 ? '' : 's'} today`, page: 'habits', emoji: '💧' },
    { key: 'sun', label: `Sunlight: ${x.sun} focus minutes`, page: 'focus', emoji: '☀️' },
    { key: 'leaves', label: `Leaves: ${x.leaves} journal entries this week + ${x.tasks} tasks today`, page: 'journal', emoji: '🍃' },
    { key: 'blooms', label: `Blooms: ${x.streak}-day habit streak`, page: 'habits', emoji: '🌸' },
    { key: 'moods', label: `Care: ${x.moods} mood check-ins today`, page: 'mood', emoji: '💗' },
  ]
  return (
    <section className="card living-seedling">
      <h3>Your living seedling</h3>
      <p className="wb-muted">It grows from what you actually do across Bloom{on('seasons') ? ` — ${s} colours` : ''}.</p>
      <div className="ls-body">
        <svg ref={root} viewBox="0 0 160 170" role="img" aria-label={`Seedling with ${leaves} leaves and ${blooms} blooms${thirst ? ', thirsty' : ''}`}>
          {x.sun > 0 && <circle cx="132" cy="26" r={8 + Math.min(12, x.sun / 5)} fill="#ffd54f" opacity="0.85" />}
          <g className="ls-plant">
            <path className="ls-stem" d={`M80 150 C ${thirst ? 92 : 78} ${150 - stem / 2}, ${thirst ? 96 : 82} ${top + 10}, ${thirst ? 94 : 80} ${top}`} stroke="#4f772d" strokeWidth="4" fill="none" strokeLinecap="round" />
            {Array.from({ length: leaves }, (_, i) => {
              const y = 146 - ((i + 1) / (leaves + 1)) * stem
              const side = i % 2 ? 1 : -1
              return <ellipse key={i} className="ls-leaf" cx={80 + side * 12} cy={y} rx="11" ry="5" fill={colours[i % colours.length]} transform={`rotate(${side * (thirst ? 40 : -25)} ${80 + side * 12} ${y})`} />
            })}
            {Array.from({ length: blooms }, (_, i) => (
              <g key={i} className="ls-bloom" transform={`translate(${80 + (i - (blooms - 1) / 2) * 14} ${top - 6 - (i % 2) * 6})`}>
                {[0, 72, 144, 216, 288].map((d) => <ellipse key={d} rx="3" ry="6" transform={`rotate(${d}) translate(0 -5)`} fill="#f48fb1" />)}
                <circle r="2.5" fill="#fff59d" />
              </g>
            ))}
          </g>
          <path d="M44 150 h72 l-8 18 h-56z" fill="#a1887f" />
          {thirst && on('thirst') && <text x="112" y="120" fontSize="14">💧?</text>}
        </svg>
        {on('feedLinks') && (
          <ul className="ls-feed">
            {parts.map((p) => (
              <li key={p.key}>
                <a href={`#${p.page}`}>{p.emoji} {p.label}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
