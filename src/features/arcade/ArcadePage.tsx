import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GAMES } from './registry'
import { reducedMotion } from './shell'
import './arcade.css'

/** The Arcade: a hub of short, click-driven games. `#arcade/<id>` opens one. */
export function ArcadePage() {
  const fromHash = () => { const id = location.hash.split('/')[1]; return GAMES.some((g) => g.id === id) ? id : null }
  const [open, setOpen] = useState<string | null>(fromHash)
  const grid = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = () => setOpen(fromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (id: string | null) => { history.replaceState(null, '', id ? `#arcade/${id}` : '#arcade'); setOpen(id) }
  useLayoutEffect(() => {
    if (open || !grid.current || reducedMotion()) return
    const t = gsap.fromTo(grid.current.children, { y: 24, opacity: 0, rotateX: -25 }, { y: 0, opacity: 1, rotateX: 0, stagger: 0.04, duration: 0.5, ease: 'power3.out' })
    return () => { t.kill() }
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
      <header className="ar-head"><h2>Arcade</h2><p>{GAMES.length} games · one tap to play</p></header>
      <div className="ar-grid" ref={grid}>
        {GAMES.map((g) => (
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
