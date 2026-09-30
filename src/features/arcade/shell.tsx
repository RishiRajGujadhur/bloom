import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'

/** Best score per game, kept on this device. */
export function useBest(id: string) {
  const key = `bloom-arcade-best-${id}`
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem(key) ?? 0) } catch { return 0 } })
  const submit = (score: number) => {
    if (score <= best) return false
    setBest(score)
    try { localStorage.setItem(key, String(score)) } catch { /* optional */ }
    return true
  }
  return [best, submit] as const
}

export const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Frame around a game: live score, best, restart, and an animated result card. */
export function GameShell({ title, score, best, hint, result, onRestart, children }: {
  title: string
  score: number
  best: number
  hint?: string
  result: { headline: string; lines: string[]; record: boolean } | null
  onRestart: () => void
  children: ReactNode
}) {
  const card = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!result || !card.current || reducedMotion()) return
    const t = gsap.timeline()
    t.fromTo(card.current, { scale: 0.7, opacity: 0, rotate: -4 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.5, ease: 'back.out(1.8)' })
    t.fromTo(card.current.querySelectorAll('li, .ar-record'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.3 }, '-=0.2')
    return () => { t.kill() }
  }, [result])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'r' && !(e.target instanceof HTMLInputElement)) onRestart() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onRestart])
  return (
    <div className="ar-shell">
      <div className="ar-hud">
        <strong>{title}</strong>
        <span className="ar-score" aria-live="polite">{score}</span>
        <span className="ar-best">Best {best}</span>
        <button type="button" onClick={onRestart} title="Restart (R)">↻ Restart</button>
      </div>
      {hint && <p className="ar-hint">{hint}</p>}
      <div className="ar-stage" data-matrix-native>
        {children}
        {result && (
          <div className="ar-result" ref={card} role="dialog" aria-label="Result">
            <h3>{result.headline}</h3>
            <ul>{result.lines.map((l) => <li key={l}>{l}</li>)}</ul>
            {result.record && <p className="ar-record">★ New best</p>}
            <button type="button" className="primary" onClick={onRestart}>Play again</button>
          </div>
        )}
      </div>
    </div>
  )
}
