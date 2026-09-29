import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { cellKey, decisionSchema, parseScore, results, strongest, type Decision } from './decideModel'
import './decide.css'

const Coin = lazy(() => import('./Coin').then((m) => ({ default: m.Coin })))

/**
 * Decision Lab — a weighted decision matrix (weights as dots, scores as tap
 * targets or typed maths), live SVG result bars that race each other (GSAP),
 * a 3D gut-check coin (three.js / react-three-fiber) and the 10/10/10 regret
 * test. The coin isn’t the decision — how you feel when it lands is.
 */
const KEY = 'bloom-decide-v1'
const load = (): Decision => decisionSchema.safeParse(readStore(KEY, {})).data ?? decisionSchema.parse({})
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function DecidePage() {
  const [d, setD] = useState<Decision>(load)
  const save = (f: (x: Decision) => Decision) => setD((x) => { const n = decisionSchema.parse(f(x)); writeStore(KEY, n); return n })
  const [flipKey, setFlipKey] = useState(0)
  const [flip, setFlip] = useState<{ result: 'heads' | 'tails'; landed: boolean } | null>(null)
  const [feel, setFeel] = useState<'relief' | 'sink' | null>(null)
  const bars = useRef<SVGSVGElement>(null)
  const res = results(d)
  const [top, second] = res
  const scoreKey = JSON.stringify(res.map((r) => r.pct))

  useLayoutEffect(() => {
    if (!bars.current) return
    bars.current.querySelectorAll<SVGRectElement>('.dc-bar-fill').forEach((el) => {
      const w = Number(el.dataset.w)
      if (reduced()) el.setAttribute('width', String(w))
      else gsap.to(el, { attr: { width: w }, duration: 0.8, ease: 'elastic.out(1, 0.7)' })
    })
  }, [scoreKey])

  const setScore = (o: string, c: string, v: number) => save((x) => ({ ...x, scores: { ...x.scores, [cellKey(o, c)]: v } }))
  const doFlip = () => {
    setFeel(null)
    setFlip({ result: Math.random() < 0.5 ? 'heads' : 'tails', landed: false })
    setFlipKey((k) => k + 1)
  }
  const landedName = flip ? (flip.result === 'heads' ? top?.name : second?.name) : null

  return (
    <div className="dc-page">
      <section className="dc-left">
        <p className="dc-eyebrow">Decision lab</p>
        <input className="dc-question" value={d.question} onChange={(e) => save((x) => ({ ...x, question: e.target.value }))} aria-label="Your question" />
        <div className="dc-matrix" role="table" aria-label="Decision matrix">
          <div className="dc-row head" role="row">
            <span role="columnheader">Matters · weight</span>
            {d.options.map((o) => (
              <span key={o.id} role="columnheader" className="dc-opt-name">
                <input value={o.name} onChange={(e) => save((x) => ({ ...x, options: x.options.map((y) => (y.id === o.id ? { ...y, name: e.target.value || '?' } : y)) }))} aria-label="Option name" />
                {d.options.length > 2 && <button type="button" onClick={() => save((x) => ({ ...x, options: x.options.filter((y) => y.id !== o.id) }))} aria-label={`Remove ${o.name}`}>×</button>}
              </span>
            ))}
          </div>
          {d.criteria.map((c) => (
            <div key={c.id} className="dc-row" role="row">
              <span role="rowheader" className="dc-crit">
                <input value={c.name} onChange={(e) => save((x) => ({ ...x, criteria: x.criteria.map((y) => (y.id === c.id ? { ...y, name: e.target.value || '?' } : y)) }))} aria-label="What matters" />
                <span className="dc-weight" aria-label={`Weight ${c.weight}`}>
                  {[1, 2, 3, 4, 5].map((w) => <button key={w} type="button" className={w <= c.weight ? 'on' : ''} onClick={() => save((x) => ({ ...x, criteria: x.criteria.map((y) => (y.id === c.id ? { ...y, weight: w } : y)) }))} aria-label={`Weight ${w}`} />)}
                </span>
              </span>
              {d.options.map((o) => {
                const v = d.scores[cellKey(o.id, c.id)] ?? 0
                return (
                  <span key={o.id} role="cell" className="dc-cell">
                    {[1, 2, 3, 4, 5].map((s) => <button key={s} type="button" className={s <= v ? 'on' : ''} onClick={() => setScore(o.id, c.id, s === v ? 0 : s)} aria-label={`${o.name}, ${c.name}: ${s}`} />)}
                    <input className="dc-typed" defaultValue="" placeholder={String(v)} aria-label={`Type a score for ${o.name}, ${c.name}`} onKeyDown={(e) => { if (e.key === 'Enter') { const p = parseScore(e.currentTarget.value); if (p !== null) setScore(o.id, c.id, p); e.currentTarget.value = '' } }} />
                  </span>
                )
              })}
            </div>
          ))}
        </div>
        <div className="dc-actions">
          <button type="button" className="dc-ghost" onClick={() => save((x) => ({ ...x, criteria: [...x.criteria, { id: crypto.randomUUID(), name: 'Something else', weight: 3 }] }))}>+ What matters</button>
          {d.options.length < 4 && <button type="button" className="dc-ghost" onClick={() => save((x) => ({ ...x, options: [...x.options, { id: crypto.randomUUID(), name: `Option ${String.fromCharCode(65 + x.options.length)}` }] }))}>+ Option</button>}
        </div>
      </section>
      <section className="dc-right">
        <svg ref={bars} className="dc-bars" viewBox={`0 0 420 ${res.length * 64}`} role="img" aria-label={res.map((r) => `${r.name} ${r.pct}%`).join(', ')}>
          {res.map((r, i) => (
            <g key={r.id} transform={`translate(0 ${i * 64})`}>
              <text x="0" y="18" className="dc-bar-name">{i === 0 && r.pct > 0 ? '👑 ' : ''}{r.name}</text>
              <text x="420" y="18" textAnchor="end" className="dc-bar-pct">{r.pct}%</text>
              <rect x="0" y="28" width="420" height="22" rx="11" className="dc-bar-track" />
              <rect className={`dc-bar-fill ${i === 0 ? 'lead' : ''}`} x="0" y="28" width="0" height="22" rx="11" data-w={Math.max(4, (r.pct / 100) * 420)} />
            </g>
          ))}
        </svg>
        {top && top.pct > 0 && <p className="dc-verdict"><strong>{top.name}</strong> leads{second ? ` by ${top.pct - second.pct} points` : ''} — strongest on <em>{strongest(d, top.id)}</em>.</p>}
        <div className="dc-gut">
          <div className="dc-coin-wrap" data-matrix-native>
            {flipKey > 0 ? (
              <Suspense fallback={<div className="dc-coin-fallback" />}>
                <Coin heads={top?.name ?? 'A'} tails={second?.name ?? 'B'} flipKey={flipKey} result={flip?.result ?? 'heads'} onLand={() => { setFlip((f) => (f ? { ...f, landed: true } : f)); burst(undefined, 'coins') }} />
              </Suspense>
            ) : <div className="dc-coin-fallback" aria-hidden="true"><span>?</span></div>}
          </div>
          <div className="dc-gut-text">
            <strong>Gut check</strong>
            {!flip?.landed ? <p>Flip a coin between your top two. You’re not bound by it — notice how you feel when it lands.</p> : (
              <>
                <p>It landed on <strong>{landedName}</strong>. How does that feel?</p>
                <div className="dc-actions">
                  <button type="button" className={`dc-ghost ${feel === 'relief' ? 'on' : ''}`} onClick={() => setFeel('relief')}>😌 Relieved</button>
                  <button type="button" className={`dc-ghost ${feel === 'sink' ? 'on' : ''}`} onClick={() => setFeel('sink')}>😕 A bit disappointed</button>
                </div>
                {feel && <p className="dc-insight">{feel === 'relief' ? `Your gut agrees: ${landedName}.` : `Part of you was hoping for ${landedName === top?.name ? second?.name : top?.name}. That’s useful to know.`}</p>}
              </>
            )}
            <button type="button" className="dc-cta" disabled={res.length < 2} onClick={doFlip}>Flip the coin</button>
          </div>
        </div>
        <details className="dc-101010">
          <summary>10 / 10 / 10 test</summary>
          <p>How will you feel about choosing <strong>{top?.name}</strong> in <b>10 minutes</b>, <b>10 months</b> and <b>10 years</b>? If the long view is calm, you likely have your answer.</p>
        </details>
      </section>
    </div>
  )
}
