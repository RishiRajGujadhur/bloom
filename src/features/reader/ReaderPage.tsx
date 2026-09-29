import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
// The package's main entry pulls in Node streams; the lib file is browser-safe.
import readingTime from 'reading-time/lib/reading-time.js'
import { Line } from 'react-chartjs-2'
import { CategoryScale, Chart, LineElement, LinearScale, PointElement, Filler, Tooltip } from 'chart.js'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { useChartColors } from '../../components/ui/chartTheme'
import { msFor, questions, texts, tokenize } from './readerModel'
import './reader.css'

Chart.register(CategoryScale, LineElement, LinearScale, PointElement, Filler, Tooltip)

/**
 * Speed Reader — RSVP: one word at a time, anchored on its focal letter (red,
 * centred) so your eyes never move. GSAP gives each word a quick kinetic
 * entrance; a progress arc sweeps as you read; afterwards a short quiz checks
 * you took it in, and a chart tracks your effective speed.
 */
const KEY = 'bloom-reader-v1'
type Store = { wpm: number; runs: { at: number; wpm: number; score: number }[] }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function ReaderPage() {
  const [store, setStore] = useState<Store>(() => readStore(KEY, { wpm: 300, runs: [] }))
  const save = (f: (s: Store) => Store) => setStore((s) => { const n = f(s); writeStore(KEY, n); return n })
  const [textId, setTextId] = useState(texts[0].id)
  const [custom, setCustom] = useState('')
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [phase, setPhase] = useState<'ready' | 'reading' | 'quiz' | 'done'>('ready')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const word = useRef<HTMLDivElement>(null)
  const arc = useRef<SVGCircleElement>(null)
  const colors = useChartColors(['#8f7ae5'])
  const body = textId === 'custom' ? custom : texts.find((t) => t.id === textId)!.body
  const tokens = useMemo(() => tokenize(body), [body])
  const qs = useMemo(() => questions(body, 3, textId), [body, textId])
  const est = readingTime(body)

  useEffect(() => {
    if (!playing) return
    if (i >= tokens.length) {
      setPlaying(false)
      setPhase('quiz')
      return
    }
    const t = window.setTimeout(() => setI((n) => n + 1), msFor(tokens[i], store.wpm))
    return () => window.clearTimeout(t)
  }, [playing, i, tokens, store.wpm])
  useLayoutEffect(() => {
    if (!word.current || reduced() || !playing) return
    gsap.fromTo(word.current, { opacity: 0.25, scale: 0.94, filter: 'blur(2px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: Math.min(0.12, msFor(tokens[i] ?? tokens[0], store.wpm) / 2500), ease: 'power2.out' })
    arc.current?.setAttribute('stroke-dashoffset', String(283 * (1 - i / Math.max(1, tokens.length))))
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (e.code === 'Space' && phase !== 'quiz') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  const toggle = () => {
    if (phase === 'ready' || phase === 'done') { setI(0); setAnswers({}); setPhase('reading'); setPlaying(true); return }
    setPlaying((p) => !p)
  }
  const tok = tokens[Math.min(i, tokens.length - 1)]
  const pre = tok ? tok.word.slice(0, tok.orp) : ''
  const focal = tok ? tok.word[tok.orp] ?? '' : ''
  const post = tok ? tok.word.slice(tok.orp + 1) : ''
  const score = qs.filter((q, k) => answers[k] === q.answer).length
  const allAnswered = qs.length > 0 && Object.keys(answers).length === qs.length
  useEffect(() => {
    if (!allAnswered || phase !== 'quiz') return
    const comprehension = score / qs.length
    const effective = Math.round(store.wpm * comprehension)
    save((s) => ({ ...s, runs: [...s.runs, { at: Date.now(), wpm: effective, score: comprehension }].slice(-20) }))
    if (comprehension === 1) burst(undefined, 'stars')
    setPhase('done')
  }, [allAnswered]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rd-page">
      <header className="rd-head">
        <div>
          <p className="rd-eyebrow">Speed reader · {est.words} words · {Math.round(est.minutes * 60)} s at normal pace</p>
          <h2>{textId === 'custom' ? 'Your text' : texts.find((t) => t.id === textId)!.title}</h2>
        </div>
        <div className="rd-row">
          {texts.map((t) => <button key={t.id} type="button" className={`rd-chip ${textId === t.id ? 'on' : ''}`} onClick={() => { setTextId(t.id); setPhase('ready'); setI(0); setPlaying(false) }}>{t.title}</button>)}
          <button type="button" className={`rd-chip ${textId === 'custom' ? 'on' : ''}`} onClick={() => { setTextId('custom'); setPhase('ready'); setI(0); setPlaying(false) }}>Paste your own</button>
        </div>
      </header>
      <section className="rd-stage">
        <svg className="rd-arc" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" className="rd-arc-track" /><circle ref={arc} cx="50" cy="50" r="45" className="rd-arc-fill" strokeDasharray="283" strokeDashoffset="283" /></svg>
        {phase === 'quiz' || phase === 'done' ? (
          <div className="rd-quiz">
            {qs.map((q, k) => (
              <div key={k} className="rd-q">
                <strong>{k + 1}. {q.q}</strong>
                <div className="rd-row">
                  {q.options.map((o) => <button key={o} type="button" disabled={answers[k] !== undefined} className={`rd-opt ${answers[k] !== undefined && o === q.answer ? 'right' : ''} ${answers[k] === o && o !== q.answer ? 'wrong' : ''}`} onClick={() => setAnswers((a) => ({ ...a, [k]: o }))}>{o}</button>)}
                </div>
              </div>
            ))}
            {phase === 'done' && <p className="rd-result">{score}/{qs.length} correct · effective speed <strong>{Math.round(store.wpm * (score / qs.length))} wpm</strong></p>}
          </div>
        ) : textId === 'custom' && phase === 'ready' ? (
          <textarea className="studio-input rd-paste" rows={6} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Paste an article, email or chapter here…" aria-label="Your text" />
        ) : (
          <div className="rd-window" aria-live="off">
            <span className="rd-guide top" /><span className="rd-guide bottom" />
            <div ref={word} className="rd-word" aria-label={tok?.word}>
              <span className="rd-pre">{phase === 'ready' ? '' : pre}</span>
              <span className="rd-focal">{phase === 'ready' ? '▶' : focal}</span>
              <span className="rd-post">{phase === 'ready' ? '' : post}</span>
            </div>
          </div>
        )}
      </section>
      <footer className="rd-foot">
        <label className="rd-speed">
          <span>{store.wpm} wpm</span>
          <input type="range" min={150} max={900} step={25} value={store.wpm} onChange={(e) => save((s) => ({ ...s, wpm: Number(e.target.value) }))} aria-label="Words per minute" />
        </label>
        <button type="button" className="rd-cta" disabled={textId === 'custom' && !custom.trim()} onClick={toggle}>{phase === 'reading' ? (playing ? '❚❚ Pause' : '▶ Resume') : phase === 'done' ? '↺ Read again' : '▶ Start reading'}</button>
        <span className="rd-progress">{Math.min(i, tokens.length)}/{tokens.length}</span>
        <div className="rd-chart" data-matrix-native>
          {store.runs.length > 1 ? (
            <Line data={{ labels: store.runs.map((_, k) => String(k + 1)), datasets: [{ data: store.runs.map((r) => r.wpm), borderColor: colors[0], backgroundColor: `${colors[0]}33`, fill: true, tension: 0.35, pointRadius: 2 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { beginAtZero: true } } }} />
          ) : <small>Effective speed (wpm × comprehension) appears here after two reads.</small>}
        </div>
      </footer>
    </div>
  )
}
