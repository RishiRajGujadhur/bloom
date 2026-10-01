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
  const [favs, setFavs] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('bloom-arcade-favs') ?? '[]') } catch { return [] } })
  const toggleFav = (id: string) => setFavs((list) => {
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    try { localStorage.setItem('bloom-arcade-favs', JSON.stringify(next)) } catch { /* optional */ }
    return next
  })
  const [favOnly, setFavOnly] = useState(false)
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
  // Esc leaves a game for the hub (in full screen, the browser uses Esc to exit full screen first).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.fullscreenElement || (e.target as HTMLElement | null)?.closest?.('input, textarea')) return
      history.replaceState(null, '', '#arcade')
      setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
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
          <button type="button" className="ar-recent-clear" aria-label="Clear recently played" onClick={() => { try { localStorage.removeItem(RECENT_KEY) } catch { /* optional */ } setFavs((f) => [...f]) /* re-render without the row */ }}>✕</button>
        </div>
      )}
      <div className="ar-filters">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || !q.trim()) return
            const hit = GAMES.find((g) => (tech === 'all' || g.tech.includes(tech)) && `${g.title} ${g.blurb}`.toLowerCase().includes(q.trim().toLowerCase()))
            if (hit) go(hit.id)
          }}
          placeholder="Find a game… (Enter to play)"
          aria-label="Find a game"
        />
        <div role="radiogroup" aria-label="Filter by engine">
          {techs.map((t) => <button key={t} type="button" role="radio" aria-checked={tech === t} className={tech === t ? 'on' : ''} onClick={() => setTech(t)}>{t === 'all' ? 'All' : t}</button>)}
        </div>
        {favs.length > 0 && (
          <button type="button" aria-pressed={favOnly} className={favOnly ? 'on' : ''} onClick={() => setFavOnly((v) => !v)}>
            ★ Favourites
          </button>
        )}
      </div>
      <div className="ar-grid" ref={grid}>
        {GAMES.filter((g) => (tech === 'all' || g.tech.includes(tech)) && (!favOnly || favs.includes(g.id)) &&(!q.trim() || `${g.title} ${g.blurb}`.toLowerCase().includes(q.trim().toLowerCase())))
          .sort((a, b) => Number(favs.includes(b.id)) - Number(favs.includes(a.id)))
          .map((g) => (
          <div key={g.id} className="ar-wrap">
            <button type="button" className="ar-card" style={{ '--ar-hue': g.hue } as React.CSSProperties} onClick={() => go(g.id)}>
              <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: g.art }} />
              <span className="ar-n">#{g.n}</span>
              <b>{g.title}</b>
              <small>{g.blurb}</small>
              <em>{g.tech}{best(g.id) ? ` · best ${best(g.id)}` : ''}</em>
            </button>
            <button type="button" className="ar-fav" aria-pressed={favs.includes(g.id)} aria-label={favs.includes(g.id) ? `Unfavourite ${g.title}` : `Favourite ${g.title}`} onClick={() => toggleFav(g.id)}>
              {favs.includes(g.id) ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
