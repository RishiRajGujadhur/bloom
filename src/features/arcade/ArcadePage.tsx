import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GAMES } from './registry'
import { reducedMotion } from './shell'
import './arcade.css'

const RECENT_KEY = 'bloom-arcade-recent'
const plays = () => { try { return Number(localStorage.getItem('bloom-arcade-plays')) || 0 } catch { return 0 } }
const recentIds = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] } }

/** The Arcade: a hub of short, click-driven games. `#arcade/<id>` opens one. */
export function ArcadePage() {
  const fromHash = () => { const id = location.hash.split('/')[1]; return GAMES.some((g) => g.id === id) ? id : null }
  const [open, setOpen] = useState<string | null>(fromHash)
  const grid = useRef<HTMLDivElement>(null)
  const [q, setQ] = useState('')
  const [tech, setTech] = useState('all')
  const techs = ['all', 'Three.js', 'Babylon.js', 'PlayCanvas', 'p5.js', 'matter-js', 'SVG']
  useEffect(() => {
    const on = () => setOpen(fromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (id: string | null) => {
    history.replaceState(null, '', id ? `#arcade/${id}` : '#arcade')
    setOpen(id)
    if (id) try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...recentIds().filter((x) => x !== id)].slice(0, 6))); localStorage.setItem('bloom-arcade-plays', String(plays() + 1)) } catch { /* optional */ }
  }
  useLayoutEffect(() => {
    if (open || !grid.current || reducedMotion()) return
    const t = gsap.fromTo(grid.current.children, { y: 24, opacity: 0, rotateX: -25 }, { y: 0, opacity: 1, rotateX: 0, stagger: 0.04, duration: 0.5, ease: 'power3.out' })
    return () => { t.kill() }
  }, [open, tech])
  const game = GAMES.find((g) => g.id === open)
  if (game) return (
    <section className="arcade" style={{ '--ar-hue': game.hue } as React.CSSProperties}>
      <button type="button" className="ar-back" onClick={() => go(null)}>← Arcade</button>
      <Suspense fallback={<p role="status">Loading…</p>}><game.Game /></Suspense>
    </section>
  )
  const best = (id: string) => { try { return Number(localStorage.getItem(`bloom-arcade-best-${id}`) ?? 0) } catch { return 0 } }
  return (
    <section className="arcade">
      <header className="ar-head"><h2>Arcade</h2><p>{GAMES.length} games · one tap to play{plays() ? ` · ${plays()} played so far` : ''}</p><button type="button" className="ar-random" onClick={() => go(GAMES[Math.floor(Math.random() * GAMES.length)].id)}>🎲 Random game</button></header>
      {recentIds().length > 0 && (
        <div className="ar-recent" aria-label="Recently played">
          <span>Recently played</span>
          {recentIds().map((id) => GAMES.find((g) => g.id === id)).filter((g) => !!g).map((g) => (
            <button key={g!.id} type="button" onClick={() => go(g!.id)}>{g!.title}</button>
          ))}
        </div>
      )}
      <div className="ar-filters">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a game…" aria-label="Find a game" />
        <div role="radiogroup" aria-label="Filter by engine">
          {techs.map((t) => <button key={t} type="button" role="radio" aria-checked={tech === t} className={tech === t ? 'on' : ''} onClick={() => setTech(t)}>{t === 'all' ? 'All' : t}</button>)}
        </div>
      </div>
      <div className="ar-grid" ref={grid}>
        {GAMES.filter((g) => (tech === 'all' || g.tech.includes(tech)) && (!q.trim() || `${g.title} ${g.blurb}`.toLowerCase().includes(q.trim().toLowerCase()))).map((g) => (
          <button key={g.id} type="button" className="ar-card" style={{ '--ar-hue': g.hue } as React.CSSProperties} onClick={() => go(g.id)}>
            <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: g.art }} />
            <span className="ar-n">#{g.n}</span>
            <b>{g.title}</b>
            <small>{g.blurb}</small>
            <em>{g.tech}{best(g.id) ? ` · best ${best(g.id)}` : ''}</em>
          </button>
        ))}
      </div>
    </section>
  )
}
