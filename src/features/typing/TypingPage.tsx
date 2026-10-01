import { useTabTitle } from '../../utils/useTabTitle'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { distance } from 'fastest-levenshtein'
import { Line } from 'react-chartjs-2'
import { CategoryScale, Chart, LineElement, LinearScale, PointElement, Filler, Tooltip } from 'chart.js'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { useChartColors } from '../../components/ui/chartTheme'
import { customDrill, finger, fingerColors, fingerNames, lessons, loadWords, makeDrill, rowOffset, rows, stats } from './typingModel'
import './typing.css'

Chart.register(CategoryScale, LineElement, LinearScale, PointElement, Filler, Tooltip)

/**
 * Typing Dojo — touch typing with an SVG keyboard. The next key glows in its
 * finger colour and pulses (GSAP), each keypress flashes green or red, the
 * text line glides as you type, and a chart tracks WPM over your sessions.
 */
const KEY = 'bloom-typing-v1'
type Session = { at: number; wpm: number; accuracy: number; lesson: string }
type Store = { best: Record<string, number>; sessions: Session[] }
const empty: Store = { best: {}, sessions: [] }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const K = 50

function Keyboard({ next, flash }: { next: string; flash: { key: string; ok: boolean; n: number } | null }) {
  const svg = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const el = svg.current.querySelector(`[data-key="${CSS.escape(next)}"] rect`)
    if (!el) return
    const tw = gsap.fromTo(el, { strokeWidth: 2 }, { strokeWidth: 6, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    // Reset the outline when the next key changes, or the old key keeps glowing.
    return () => {
      tw.kill()
      gsap.set(el, { clearProps: 'strokeWidth' })
    }
  }, [next])
  useLayoutEffect(() => {
    if (!flash || !svg.current || reduced()) return
    const el = svg.current.querySelector(`[data-key="${CSS.escape(flash.key)}"]`)
    if (el) gsap.fromTo(el, { y: 4 }, { y: 0, duration: 0.3, ease: 'back.out(3)' })
  }, [flash])
  return (
    <svg ref={svg} className="ty-kb" viewBox={`0 0 ${15 * K} ${5.4 * K}`} role="img" aria-label={`Next key: ${next === ' ' ? 'space' : next}, ${fingerNames[finger[next] ?? 8]}`} data-matrix-native>
      {rows.map((row, r) =>
        row.map((k, i) => {
          const x = (rowOffset[r] + i) * K + 6
          const y = r * K + 6
          const f = finger[k] ?? 8
          const isNext = k === next
          const isFlash = flash?.key === k
          return (
            <g key={k} data-key={k} className="ty-key">
              <rect x={x} y={y} width={K - 6} height={K - 6} rx={9} className={`ty-cap ${isNext ? 'next' : ''} ${isFlash ? (flash!.ok ? 'ok' : 'bad') : ''}`} style={{ ['--f' as string]: fingerColors[f] }} />
              <text x={x + (K - 6) / 2} y={y + K * 0.6} textAnchor="middle">{k}</text>
              {(k === 'f' || k === 'j') && <rect x={x + 16} y={y + K - 16} width={12} height={3} rx={1.5} className="ty-bump" />}
            </g>
          )
        }),
      )}
      <g data-key=" " className="ty-key">
        <rect x={3.5 * K} y={4 * K + 6} width={7 * K} height={K - 6} rx={9} className={`ty-cap ${next === ' ' ? 'next' : ''} ${flash?.key === ' ' ? (flash.ok ? 'ok' : 'bad') : ''}`} style={{ ['--f' as string]: fingerColors[8] }} />
        <text x={7 * K} y={4 * K + K * 0.6} textAnchor="middle">space</text>
      </g>
    </svg>
  )
}

export function TypingPage() {
  const [store, setStore] = useState<Store>(() => ({ ...empty, ...readStore(KEY, empty) }))
  const save = (f: (s: Store) => Store) => setStore((s) => { const n = f(s); writeStore(KEY, n); return n })
  const [li, setLiState] = useState(() => {
    try { return Math.min(lessons.length - 1, Math.max(0, Number(localStorage.getItem('bloom-typing-lesson')) || 0)) } catch { return 0 }
  })
  const setLi = (i: number) => {
    setLiState(i)
    try { localStorage.setItem('bloom-typing-lesson', String(i)) } catch { /* optional */ }
  }
  const lesson = lessons[li]
  const [text, setText] = useState('')
  const [pos, setPos] = useState(0)
  const [errors, setErrors] = useState(0)
  const [wrongAt, setWrongAt] = useState<Set<number>>(new Set())
  const [start, setStart] = useState<number | null>(null)
  const [done, setDone] = useState<{ wpm: number; accuracy: number } | null>(null)
  const raw = useRef('')
  const [flash, setFlash] = useState<{ key: string; ok: boolean; n: number } | null>(null)
  const line = useRef<HTMLDivElement>(null)
  const colors = useChartColors(['#4fc3f7'])

  const newDrill = useCallback(async () => {
    const words = await loadWords()
    setText(makeDrill(words, lesson.keys))
    setPos(0)
    setErrors(0)
    setWrongAt(new Set())
    setStart(null)
    setDone(null)
    raw.current = ''
  }, [lesson])
  useEffect(() => void newDrill(), [newDrill])

  // Practise on your own text (pasted or typed into the box).
  const [ownOpen, setOwnOpen] = useState(false)
  const [own, setOwn] = useState('')
  const [usingOwn, setUsingOwn] = useState(false)
  const startOwn = () => {
    const drill = customDrill(own)
    if (!drill) return
    setText(drill)
    setPos(0)
    setErrors(0)
    setWrongAt(new Set())
    setStart(null)
    setDone(null)
    raw.current = ''
    setUsingOwn(true)
    setOwnOpen(false)
  }
  const onKey = useCallback((e: KeyboardEvent) => {
    if (done && e.key === 'Enter' && !(e.target as HTMLElement | null)?.closest?.('input, textarea, button')) {
      e.preventDefault()
      if (usingOwn) startOwn()
      else void newDrill()
      return
    }
    if (done || !text || e.metaKey || e.ctrlKey || e.altKey) return
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')) return
    if (e.key === 'Escape' && pos > 0) {
      // Restart the same drill from the beginning.
      setPos(0)
      setErrors(0)
      setWrongAt(new Set())
      setStart(null)
      raw.current = ''
      return
    }
    if (e.key.length !== 1) return
    e.preventDefault()
    const want = text[pos]
    raw.current += e.key.toLowerCase()
    const ok = e.key.toLowerCase() === want
    setFlash((f) => ({ key: want, ok, n: (f?.n ?? 0) + 1 }))
    if (!ok) {
      setErrors((n) => n + 1)
      setWrongAt((s) => new Set(s).add(pos))
      if (line.current && !reduced()) gsap.fromTo(line.current, { x: -6 }, { x: 0, duration: 0.35, ease: 'elastic.out(1, 0.3)' })
      return
    }
    const t0 = start ?? Date.now()
    if (start === null) setStart(t0)
    const next = pos + 1
    setPos(next)
    if (next >= text.length) {
      const s = stats(text.length, errors, Date.now() - t0)
      setDone(s)
      burst(undefined, 'stars')
      const id = usingOwn ? 'own' : lesson.id
      save((st) => ({ best: { ...st.best, [id]: Math.max(st.best[id] ?? 0, s.wpm) }, sessions: [...st.sessions, { at: Date.now(), ...s, lesson: id }].slice(-40) }))
    }
  }, [done, text, pos, start, errors, lesson.id, usingOwn]) // eslint-disable-line react-hooks/exhaustive-deps -- startOwn/newDrill read current state
  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKey])
  // Glide the line so the cursor stays near the middle.
  useLayoutEffect(() => {
    if (!line.current) return
    const cur = line.current.querySelector('.ty-ch.cur') as HTMLElement | null
    const box = line.current.parentElement!
    if (!cur) return
    const target = Math.min(0, box.clientWidth / 2 - cur.offsetLeft)
    if (reduced()) gsap.set(line.current, { x: target })
    else gsap.to(line.current, { x: target, duration: 0.25, ease: 'power2.out' })
  }, [pos, text])

  const live = start ? stats(pos, errors, Date.now() - start) : { wpm: 0, accuracy: 100 }
  useTabTitle(done ? `⌨️ ${done.wpm} WPM` : start ? `⌨️ ${live.wpm} WPM · ${Math.round((pos / Math.max(1, text.length)) * 100)}%` : '', 'Typing', 'typing')
  const next = text[pos] ?? ' '
  const recent = store.sessions.slice(-14)
  // Keystroke efficiency: Levenshtein distance between every key you pressed and the drill.
  const closeness = done ? Math.max(0, Math.round((1 - distance(raw.current, text) / Math.max(1, text.length)) * 100)) : null

  return (
    <div className="ty-page">
      <header className="ty-head">
        <div>
          <p className="ty-eyebrow">Typing Dojo · {usingOwn ? 'your own text' : `lesson ${li + 1}/${lessons.length}`}</p>
          <h2>{usingOwn ? 'Your text' : lesson.title}</h2>
          <p className="ty-tip">{usingOwn ? 'Lower-case and unshifted keys only, so you can focus on rhythm.' : lesson.tip}</p>
        </div>
        <div className="ty-stats">
          <div><strong>{done?.wpm ?? live.wpm}</strong><small>WPM</small></div>
          <div><strong>{done?.accuracy ?? live.accuracy}%</strong><small>accuracy</small></div>
          <div><strong>{store.best[usingOwn ? 'own' : lesson.id] ?? '—'}</strong><small>best</small></div>
          {store.sessions.length >= 2 && <div><strong>{Math.round(store.sessions.slice(-5).reduce((a, s) => a + s.wpm, 0) / Math.min(5, store.sessions.length))}</strong><small>avg last 5</small></div>}
          {store.sessions.length >= 2 && <div><strong>{Math.round(store.sessions.slice(-5).reduce((a, s) => a + s.accuracy, 0) / Math.min(5, store.sessions.length))}%</strong><small>accuracy, last 5</small></div>}
        </div>
      </header>
      {text && !done && pos > 0 && (
        <div className="ty-progress" aria-hidden="true" style={{ height: 3, borderRadius: 2, background: 'var(--bg-surface)', overflow: 'hidden', marginBottom: 6 }}>
          <span style={{ display: 'block', height: '100%', width: `${(pos / text.length) * 100}%`, background: 'var(--accent-color)', transition: 'width .15s' }} />
        </div>
      )}
      <div className="ty-stage" aria-live="off">
        <div ref={line} className="ty-line">
          {[...text].map((c, i) => (
            <span key={i} className={`ty-ch ${i < pos ? 'done' : ''} ${i === pos ? 'cur' : ''} ${wrongAt.has(i) ? 'miss' : ''}`}>{c === ' ' ? ' ' : c}</span>
          ))}
        </div>
      </div>
      {done ? (
        <div className="ty-done" role="status">
          <strong>{done.wpm} WPM · {done.accuracy}% accurate</strong>
          <span>{done.accuracy >= 95 ? 'Clean and steady — great form.' : 'Slow down a touch; accuracy first, speed follows.'}{closeness !== null ? ` Keystroke efficiency ${closeness}%.` : ''}</span>
          {wrongAt.size > 0 && (
            <span>
              Trickiest keys:{' '}
              {Object.entries([...wrongAt].reduce<Record<string, number>>((acc, i) => ({ ...acc, [text[i]]: (acc[text[i]] ?? 0) + 1 }), {}))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([k, n]) => `${k === ' ' ? 'space' : k} (${n})`)
                .join(', ')}
            </span>
          )}
          <button type="button" className="ty-cta" title="Again (Enter)" onClick={() => (usingOwn ? startOwn() : void newDrill())}>Again</button>
          {li + 1 < lessons.length && <button type="button" className="ty-cta ghost" onClick={() => setLi(li + 1)}>Next lesson →</button>}
        </div>
      ) : (
        <p className="ty-hint">Type the highlighted letter with your <strong style={{ color: fingerColors[finger[next] ?? 8] }}>{fingerNames[finger[next] ?? 8]}</strong>. Just start typing.</p>
      )}
      <div className="ty-bottom">
        <Keyboard next={next} flash={flash} />
        <aside className="ty-side">
          <div className="ty-lessons">
            {lessons.map((l, i) => <button key={l.id} type="button" className={`ty-pill ${i === li && !usingOwn ? 'on' : ''} ${store.best[l.id] ? 'done' : ''}`} onClick={() => { setUsingOwn(false); if (i === li) void newDrill(); else setLi(i) }} title={store.best[l.id] ? `${l.title} · best ${store.best[l.id]} WPM` : l.title}>{i + 1}{store.best[l.id] ? <sup>{store.best[l.id]}</sup> : null}</button>)}
          </div>
          <button type="button" className="ty-cta ghost ty-own-btn" aria-expanded={ownOpen} onClick={() => setOwnOpen((v) => !v)}>✍️ Practise your own text</button>
          {ownOpen && (
            <form className="ty-own" onSubmit={(e) => { e.preventDefault(); startOwn() }}>
              <textarea rows={4} aria-label="Text to practise" placeholder="Paste a paragraph, a poem, some code comments…" value={own} onChange={(e) => setOwn(e.target.value)} />
              <button type="submit" className="ty-cta" disabled={!customDrill(own)}>Type this</button>
            </form>
          )}
          {recent.length > 1 ? (
            <div className="ty-chart" data-matrix-native>
              <Line data={{ labels: recent.map((_, i) => String(i + 1)), datasets: [{ data: recent.map((s) => s.wpm), borderColor: colors[0], backgroundColor: `${colors[0]}33`, fill: true, tension: 0.35, pointRadius: 2 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
            </div>
          ) : (
            <p className="ty-hint">Finish two drills to see your WPM chart.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
