import { prefersReducedMotion } from '../../utils/motion'
import { setQuiz } from '../../companion/quizContext'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import {
  analogyItem,
  emotionNames,
  eqDomains,
  eqStatements,
  faceItem,
  faces,
  indexBand,
  iqTest,
  leaderboard,
  matrixItem,
  personalBests,
  reasoningIndex,
  scenarios,
  scoreEq,
  seriesItem,
  type Cell,
  type EqDomain,
  type EqResult,
  type Emotion,
  type IqItem,
  type Run,
} from './assessModel'
import { games, type Result } from './gamesModel'
import './assess.css'

type Finish = (score: number, accuracy: number) => void
const reduced = () => !!prefersReducedMotion()
export const ASSESS_KEY = 'bloom-assess-v1'
export type AssessStore = { iq: { at: number; score: number; correct: number; total: number; seconds: number }[]; eq: ({ at: number } & EqResult)[] }
export const readAssess = (): AssessStore => ({ iq: [], eq: [], ...readStore<Partial<AssessStore>>(ASSESS_KEY, {}) })

/* ---------------- shared SVG pieces ---------------- */
const fills = ['none', '#8f7ae555', '#8f7ae5']
export function CellSvg({ cell, size = 64 }: { cell: Cell | null; size?: number }) {
  if (!cell) return <svg className="as-cell q" width={size} height={size} viewBox="0 0 60 60" aria-label="Missing piece"><text x="30" y="40" textAnchor="middle">?</text></svg>
  const pos = cell.count === 1 ? [[30, 30]] : cell.count === 2 ? [[18, 30], [42, 30]] : [[30, 16], [17, 42], [43, 42]]
  const r = cell.count === 1 ? 14 : 9
  return (
    <svg className="as-cell" width={size} height={size} viewBox="0 0 60 60" aria-label={`${cell.count} ${cell.shape}${cell.count > 1 ? 's' : ''}`}>
      {pos.map(([x, y], i) => {
        const common = { fill: fills[cell.fill], stroke: '#5b47c7', strokeWidth: 2.5, transform: `rotate(${cell.rot} ${x} ${y})` }
        if (cell.shape === 'circle') return <circle key={i} cx={x} cy={y} r={r} {...common} />
        if (cell.shape === 'square') return <rect key={i} x={x - r} y={y - r} width={r * 2} height={r * 2} {...common} />
        if (cell.shape === 'triangle') return <polygon key={i} points={`${x},${y - r} ${x + r},${y + r} ${x - r},${y + r}`} {...common} />
        return <polygon key={i} points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} {...common} />
      })}
    </svg>
  )
}

/** An SVG face whose features morph between emotions with GSAP. */
export function Face({ emotion, size = 150 }: { emotion: Emotion; size?: number }) {
  const svg = useRef<SVGSVGElement>(null)
  const f = faces[emotion]
  useLayoutEffect(() => {
    const el = svg.current
    if (!el) return
    const d = reduced() ? 0 : 0.5
    const mouth = `M42 ${88 - f.mouth / 2} Q60 ${88 + f.mouth} 78 ${88 - f.mouth / 2}`
    const tl = gsap.timeline({ defaults: { duration: d, ease: 'power2.out' } })
    tl.to(el.querySelector('.fb-l'), { attr: { transform: `translate(0 ${-f.brow}) rotate(${f.browTilt} 44 46)` } }, 0)
      .to(el.querySelector('.fb-r'), { attr: { transform: `translate(0 ${-f.brow}) rotate(${-f.browTilt} 76 46)` } }, 0)
      .to(el.querySelectorAll('.fe'), { attr: { ry: 6 * f.eye } }, 0)
      .to(el.querySelector('.fm'), { attr: { d: mouth } }, 0)
      .to(el.querySelector('.fo'), { attr: { ry: f.open, rx: f.open ? 8 : 0 } }, 0)
    return () => void tl.progress(1)
  }, [emotion, f])
  return (
    <svg ref={svg} className="as-face" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="A face showing an emotion">
      <circle cx="60" cy="60" r="52" fill="#ffd9a8" stroke="#c98e5a" strokeWidth="3" />
      <path className="fb-l" d="M34 46 H54" stroke="#5d4037" strokeWidth="4" strokeLinecap="round" />
      <path className="fb-r" d="M66 46 H86" stroke="#5d4037" strokeWidth="4" strokeLinecap="round" />
      <ellipse className="fe" cx="44" cy="60" rx="5" ry="5" fill="#2b2b2b" />
      <ellipse className="fe" cx="76" cy="60" rx="5" ry="5" fill="#2b2b2b" />
      <path className="fm" d="M42 88 Q60 88 78 88" stroke="#7a3b2e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse className="fo" cx="60" cy="90" rx="0" ry="0" fill="#7a3b2e" />
      <ellipse cx="32" cy="76" rx="7" ry="4" fill="#f48fb1" opacity="0.5" />
      <ellipse cx="88" cy="76" rx="7" ry="4" fill="#f48fb1" opacity="0.5" />
    </svg>
  )
}

function ItemView({ item, onAnswer }: { item: IqItem; onAnswer: (i: number) => void }) {
  if (item.kind === 'matrix')
    return (
      <div className="as-item">
        <p className="bg-prompt">Which piece completes the pattern?</p>
        <div className="as-grid">{item.grid.map((c, i) => <CellSvg key={i} cell={c} />)}</div>
        <div className="as-options">
          {item.options.map((c, i) => (
            <button key={i} type="button" className="as-opt" onClick={() => onAnswer(i)} data-hint={`Option ${i + 1}`}>
              <CellSvg cell={c} size={54} />
            </button>
          ))}
        </div>
      </div>
    )
  if (item.kind === 'series')
    return (
      <div className="as-item">
        <p className="bg-prompt">What comes next?</p>
        <div className="as-series">{item.terms.map((t, i) => <span key={i}>{t}</span>)}<span className="q">?</span></div>
        <div className="as-options">
          {item.options.map((o, i) => (
            <button key={i} type="button" className="as-opt text" onClick={() => onAnswer(i)}>{o}</button>
          ))}
        </div>
      </div>
    )
  return (
    <div className="as-item">
      <p className="bg-prompt">{item.stem}</p>
      <div className="as-options">
        {item.options.map((o, i) => (
          <button key={i} type="button" className="as-opt text" onClick={() => onAnswer(i)}>{o}</button>
        ))}
      </div>
    </div>
  )
}
const answerOf = (item: IqItem) => (item.kind === 'series' ? item.options.indexOf(item.answer) : item.answer)

/* ---------------- IQ assessment ---------------- */
export function IqAssessment({ onDone }: { onDone: (score: number) => void }) {
  const [items] = useState(() => iqTest())
  const [i, setI] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [start] = useState(Date.now)
  const stage = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (stage.current && !reduced()) gsap.fromTo(stage.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 })
  }, [i])
  // Bloom's chat can hint at the question on screen.
  useEffect(() => {
    const it = items[i]
    if (!it) return
    if (it.kind === 'series') setQuiz({ source: 'Reasoning test', question: `What comes next: ${it.terms.join(', ')}, ?`, answer: String(it.answer), options: it.options.map(String), explain: `Look for the pattern: ${it.rule}.` })
    else if (it.kind === 'analogy') setQuiz({ source: 'Reasoning test', question: it.stem, answer: it.options[it.answer], options: it.options, explain: 'Find how the first pair is related, then apply the same link.' })
    else setQuiz({ source: 'Reasoning test', question: 'Which tile completes the grid?', answer: `option ${it.answer + 1}`, explain: `The rule: ${it.rule}.` })
  }, [i, items])
  useEffect(() => () => setQuiz(null), [])
  const answer = (k: number) => {
    const c = correct + Number(k === answerOf(items[i]))
    if (i + 1 >= items.length) {
      const seconds = Math.round((Date.now() - start) / 1000)
      const score = reasoningIndex(c, items.length, seconds)
      const s = readAssess()
      writeStore(ASSESS_KEY, { ...s, iq: [...s.iq, { at: Date.now(), score, correct: c, total: items.length, seconds }] })
      onDone(score)
      return
    }
    setCorrect(c)
    setI(i + 1)
  }
  return (
    <div className="as-run bloom-stack">
      <div className="as-progress" aria-label={`Question ${i + 1} of ${items.length}`}><i style={{ width: `${(i / items.length) * 100}%` }} /></div>
      <div ref={stage}><ItemView item={items[i]} onAnswer={answer} /></div>
    </div>
  )
}

/* ---------------- EQ assessment ---------------- */
export function EqAssessment({ onDone }: { onDone: (r: EqResult) => void }) {
  const faceItems = useMemo(() => Array.from({ length: 6 }, () => faceItem()), [])
  const sjt = useMemo(() => [...scenarios].sort(() => Math.random() - 0.5).slice(0, 5), [])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [faceOk, setFaceOk] = useState(0)
  const [sjtOk, setSjtOk] = useState<{ domain: EqDomain; ok: boolean }[]>([])
  const total = eqStatements.length + faceItems.length + sjt.length
  const finish = (ok: typeof sjtOk) => {
    const r = scoreEq(answers, faceOk, faceItems.length, ok)
    const s = readAssess()
    writeStore(ASSESS_KEY, { ...s, eq: [...s.eq, { at: Date.now(), ...r }] })
    onDone(r)
  }
  let body
  if (step < eqStatements.length) {
    const st = eqStatements[step]
    body = (
      <div className="as-item">
        <p className="bg-prompt">{st.text}</p>
        <div className="as-likert" role="group" aria-label="How much do you agree?">
          {['Not at all', 'A little', 'Somewhat', 'Mostly', 'Completely'].map((l, k) => (
            <button key={l} type="button" className="as-opt text" onClick={() => { setAnswers([...answers, k + 1]); setStep(step + 1) }}>{l}</button>
          ))}
        </div>
      </div>
    )
  } else if (step < eqStatements.length + faceItems.length) {
    const f = faceItems[step - eqStatements.length]
    body = (
      <div className="as-item">
        <p className="bg-prompt">What is this person feeling?</p>
        <Face emotion={f.emotion} />
        <div className="as-options">
          {f.options.map((o, k) => (
            <button key={o} type="button" className="as-opt text" onClick={() => { if (k === f.answer) setFaceOk(faceOk + 1); setStep(step + 1) }}>{o}</button>
          ))}
        </div>
      </div>
    )
  } else {
    const sc = sjt[step - eqStatements.length - faceItems.length]
    body = (
      <div className="as-item">
        <p className="bg-prompt">{sc.text} What would you do?</p>
        <div className="as-options col">
          {sc.options.map((o, k) => (
            <button key={o} type="button" className="as-opt text" onClick={() => {
              const next = [...sjtOk, { domain: sc.domain, ok: k === sc.best }]
              setSjtOk(next)
              if (step + 1 >= total) finish(next)
              else setStep(step + 1)
            }}>{o}</button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="as-run bloom-stack">
      <div className="as-progress" aria-label={`Step ${step + 1} of ${total}`}><i style={{ width: `${(step / total) * 100}%` }} /></div>
      {body}
    </div>
  )
}

/** Animated radar of EQ domains. */
export function EqRadar({ r }: { r: EqResult }) {
  const shape = useRef<SVGPolygonElement>(null)
  const keys = Object.keys(eqDomains) as EqDomain[]
  const pt = (k: number, v: number) => {
    const a = (k / keys.length) * Math.PI * 2 - Math.PI / 2
    return [110 + Math.cos(a) * v * 0.8, 105 + Math.sin(a) * v * 0.8]
  }
  const points = keys.map((d, k) => pt(k, r.domains[d]).join(',')).join(' ')
  useLayoutEffect(() => {
    if (!shape.current || reduced()) return
    const tw = gsap.from(shape.current, { scale: 0, transformOrigin: '110px 105px', duration: 0.9, ease: 'elastic.out(1, 0.5)' })
    return () => void tw.progress(1)
  }, [points])
  return (
    <svg className="as-radar" viewBox="0 0 220 220" role="img" aria-label={`EQ ${r.overall}`}>
      {[0.33, 0.66, 1].map((f) => <polygon key={f} points={keys.map((_, k) => pt(k, 100 * f).join(',')).join(' ')} className="as-radar-grid" />)}
      <polygon ref={shape} points={points} className="as-radar-shape" />
      {keys.map((d, k) => {
        const [x, y] = pt(k, 128)
        return <text key={d} x={x} y={y} textAnchor="middle">{eqDomains[d]} {r.domains[d]}</text>
      })}
    </svg>
  )
}

/** Gauge for the reasoning index; the needle swings in with GSAP. */
export function IqGauge({ score }: { score: number }) {
  const needle = useRef<SVGLineElement>(null)
  useLayoutEffect(() => {
    if (!needle.current) return
    const angle = ((score - 55) / 90) * 180 - 90
    const tw = gsap.fromTo(needle.current, { rotate: -90 }, { rotate: angle, svgOrigin: '100 100', duration: reduced() ? 0 : 1.4, ease: 'elastic.out(1, 0.4)' })
    return () => void tw.progress(1)
  }, [score])
  return (
    <svg className="as-gauge" viewBox="0 0 200 120" role="img" aria-label={`Reasoning index ${score}`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e8e2ff" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#as-g)" strokeWidth="16" strokeLinecap="round" strokeDasharray="252" strokeDashoffset={252 - ((score - 55) / 90) * 252} />
      <defs>
        <linearGradient id="as-g"><stop offset="0" stopColor="#9fdcc8" /><stop offset="1" stopColor="#8f7ae5" /></linearGradient>
      </defs>
      <line ref={needle} x1="100" y1="100" x2="100" y2="32" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill="#2b2b2b" />
      <text x="100" y="80" textAnchor="middle" className="as-gauge-num">{score}</text>
    </svg>
  )
}

/* ---------------- training games ---------------- */
export function MatrixGame({ level, finish, blip }: { level: number; finish: Finish; blip: (ok: boolean) => void }) {
  const rounds = 8
  const [n, setN] = useState(0)
  const [right, setRight] = useState(0)
  const item = useMemo(() => (n % 3 === 2 ? seriesItem(level) : matrixItem(level)), [n, level])
  return (
    <div className="bg-play bg-col">
      <p className="bg-prompt">Puzzle {n + 1}/{rounds}</p>
      <ItemView item={item} onAnswer={(k) => {
        const ok = k === answerOf(item)
        blip(ok)
        const r = right + Number(ok)
        if (n + 1 >= rounds) finish(r * 15, r / rounds)
        else { setRight(r); setN(n + 1) }
      }} />
    </div>
  )
}

export function AnalogyGame({ finish, blip }: { level: number; finish: Finish; blip: (ok: boolean) => void }) {
  const [left, setLeft] = useState(60)
  const [n, setN] = useState(0)
  const [right, setRight] = useState(0)
  const [item, setItem] = useState(() => (Math.random() < 0.5 ? analogyItem() : seriesItem(3)))
  useEffect(() => {
    const t = setTimeout(() => (left <= 0 ? finish(right * 10, n ? right / n : 0) : setLeft(left - 1)), 1000)
    return () => clearTimeout(t)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="bg-play bg-col">
      <p className="bg-prompt">{left}s · {right} right</p>
      <ItemView item={item} onAnswer={(k) => {
        const ok = k === answerOf(item)
        blip(ok)
        setN(n + 1)
        if (ok) setRight(right + 1)
        setItem(Math.random() < 0.5 ? analogyItem() : seriesItem(3 + Math.floor(n / 3)))
      }} />
    </div>
  )
}

export function FaceReader({ level, finish, blip }: { level: number; finish: Finish; blip: (ok: boolean) => void }) {
  const rounds = 10
  const [n, setN] = useState(0)
  const [right, setRight] = useState(0)
  const item = useMemo(() => faceItem(Math.random, Math.min(emotionNames.length, 3 + Math.floor(level / 2))), [n, level]) // eslint-disable-line react-hooks/exhaustive-deps -- n picks a new face
  return (
    <div className="bg-play bg-col as-center">
      <p className="bg-prompt">Face {n + 1}/{rounds} — what are they feeling?</p>
      <Face emotion={item.emotion} />
      <div className="as-options">
        {item.options.map((o, k) => (
          <button key={o} type="button" className="as-opt text" onClick={() => {
            const ok = k === item.answer
            blip(ok)
            const r = right + Number(ok)
            if (n + 1 >= rounds) finish(r * 10, r / rounds)
            else { setRight(r); setN(n + 1) }
          }}>{o}</button>
        ))}
      </div>
    </div>
  )
}

export function KindReply({ finish, blip }: { level: number; finish: Finish; blip: (ok: boolean) => void }) {
  const order = useMemo(() => [...scenarios].sort(() => Math.random() - 0.5).slice(0, 6), [])
  const [n, setN] = useState(0)
  const [right, setRight] = useState(0)
  const [why, setWhy] = useState<{ ok: boolean; text: string } | null>(null)
  const sc = order[n]
  return (
    <div className="bg-play bg-col">
      <p className="bg-prompt">{sc.text}</p>
      {why ? (
        <div className={`as-why ${why.ok ? 'ok' : ''}`}>
          <strong>{why.ok ? 'Kind and wise 💚' : 'Another way to see it'}</strong>
          <p>{why.text}</p>
          <button type="button" className="studio-btn primary" onClick={() => {
            setWhy(null)
            if (n + 1 >= order.length) finish(right * 15, right / order.length)
            else setN(n + 1)
          }}>Next</button>
        </div>
      ) : (
        <div className="as-options col">
          {sc.options.map((o, k) => (
            <button key={o} type="button" className="as-opt text" onClick={() => {
              const ok = k === sc.best
              blip(ok)
              if (ok) setRight(right + 1)
              setWhy({ ok, text: sc.why })
            }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- assessments tab ---------------- */
export function AssessTab() {
  const [mode, setMode] = useState<'home' | 'iq' | 'eq'>('home')
  const [store, setStore] = useState(readAssess)
  const stage = useRef<HTMLDivElement>(null)
  const lastIq = store.iq.at(-1)
  const lastEq = store.eq.at(-1)
  if (mode === 'iq') return <IqAssessment onDone={() => { setStore(readAssess()); setMode('home'); burst(stage.current, 'stars') }} />
  if (mode === 'eq') return <EqAssessment onDone={() => { setStore(readAssess()); setMode('home'); burst(stage.current, 'stars') }} />
  return (
    <div ref={stage} className="as-home">
      <section className="studio-card as-card">
        <h3>🧠 Reasoning (IQ-style)</h3>
        <p className="wb-muted">15 puzzles: pattern matrices, number series and analogies. About 8 minutes.</p>
        {lastIq ? (
          <>
            <IqGauge score={lastIq.score} />
            <p><strong>{indexBand(lastIq.score)}</strong> · {lastIq.correct}/{lastIq.total} in {Math.round(lastIq.seconds / 60)} min{store.iq.length > 1 ? ` · best ${Math.max(...store.iq.map((x) => x.score))}` : ''}</p>
          </>
        ) : null}
        <button type="button" className="studio-btn primary" onClick={() => setMode('iq')}>{lastIq ? 'Take it again' : 'Start'}</button>
      </section>
      <section className="studio-card as-card">
        <h3>💗 Emotional intelligence (EQ)</h3>
        <p className="wb-muted">20 quick statements, 6 faces to read and 5 real-life situations. About 6 minutes.</p>
        {lastEq ? (
          <>
            <EqRadar r={lastEq} />
            <p><strong>EQ {lastEq.overall}/100</strong>{store.eq.length > 1 ? ` · was ${store.eq.at(-2)!.overall}` : ''}</p>
          </>
        ) : null}
        <button type="button" className="studio-btn primary" onClick={() => setMode('eq')}>{lastEq ? 'Take it again' : 'Start'}</button>
      </section>
      <p className="quick-note as-note">For reflection and practice — not a clinical or standardised IQ/EQ test. Train with Matrix puzzles, Quick analogies, Face reader and Kind reply.</p>
    </div>
  )
}

/* ---------------- personal leaderboard ---------------- */
export function Leaderboard({ results }: { results: Result[] }) {
  const [range, setRange] = useState<'week' | 'all'>('all')
  const board = useRef<HTMLOListElement>(null)
  const assess = readAssess()
  const name = (g: string) => games.find((x) => x.id === g)?.name ?? g
  const runs: Run[] = [
    ...results.map((r) => ({ at: r.at, game: r.game, score: r.score, label: name(r.game) })),
    ...assess.iq.map((r) => ({ at: r.at, game: 'iq', score: r.score, label: 'Reasoning index' })),
    ...assess.eq.map((r) => ({ at: r.at, game: 'eq', score: r.overall, label: 'EQ' })),
  ]
  const top = leaderboard(runs, range === 'week' ? Date.now() - 7 * 864e5 : 0)
  const bests = personalBests(runs)
  useLayoutEffect(() => {
    if (!board.current || reduced()) return
    const tw = gsap.from(board.current.children, { x: -30, opacity: 0, stagger: 0.05, duration: 0.35, ease: 'power2.out' })
    return () => void tw.progress(1)
  }, [range, top.length])
  const medal = ['🥇', '🥈', '🥉']
  return (
    <div className="lb-wrap">
      <div className="studio-card">
        <div className="lb-head">
          <h3>Your top runs</h3>
          <div className="studio-chip-row" role="group" aria-label="Range">
            <button type="button" className="studio-chip" aria-pressed={range === 'week'} onClick={() => setRange('week')}>This week</button>
            <button type="button" className="studio-chip" aria-pressed={range === 'all'} onClick={() => setRange('all')}>All time</button>
          </div>
        </div>
        {top.length ? (
          <ol ref={board} className="lb-list">
            {top.map((r, i) => (
              <li key={`${r.game}-${r.at}`} data-hint={new Date(r.at).toLocaleString()}>
                <span className="lb-rank">{medal[i] ?? i + 1}</span>
                <span className="lb-name">{r.label}</span>
                <strong>{r.score}</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p className="studio-empty">Play a game or take an assessment to start your board.</p>
        )}
      </div>
      <div className="studio-card">
        <h3>Personal bests</h3>
        <ul className="lb-bests">
          {bests.map((b) => {
            const delta = b.last.score - b.best.score
            return (
              <li key={b.game} data-hint={`${b.runs} runs`}>
                <span>{b.best.label}</span>
                <strong>{b.best.score}</strong>
                <small className={delta === 0 ? 'up' : 'down'}>{delta === 0 ? '★ latest is your best' : `last ${b.last.score}`}</small>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
