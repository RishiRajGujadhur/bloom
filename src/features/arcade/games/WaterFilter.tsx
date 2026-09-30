import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Water Filter: you're camping and the stream is murky. Tap materials to
 * layer them into a cut-down bottle (they stack from the bottom up), then
 * pour. Watch the drops work through each layer. Big stuff should be caught
 * first, fine grit next, and the finest last. Four streams, each murkier.
 */
type Mat = 'cloth' | 'charcoal' | 'sand' | 'gravel' | 'grass'
const MATS: { id: Mat; label: string; color: string; catches: number; best: number }[] = [
  // best = ideal position counting from the bottom (0 = bottom).
  { id: 'cloth', label: 'Cotton cloth', color: '#f1f5f9', catches: 0.25, best: 0 },
  { id: 'charcoal', label: 'Charcoal', color: '#1f2937', catches: 0.35, best: 1 },
  { id: 'sand', label: 'Fine sand', color: '#e9c46a', catches: 0.3, best: 2 },
  { id: 'gravel', label: 'Gravel', color: '#9ca3af', catches: 0.25, best: 3 },
  { id: 'grass', label: 'Grass', color: '#65a30d', catches: 0.05, best: -1 },
]
const STREAMS = [{ name: 'Muddy creek', dirt: 0.7 }, { name: 'Leafy pond', dirt: 0.8 }, { name: 'Silty river', dirt: 0.9 }, { name: 'Puddle', dirt: 1 }]
const W = 760, H = 500
const BX = 330, BW = 120, BOTTOM = 420, LAYER = 44

export default function WaterFilter() {
  const [best, submit] = useBest('filter')
  const [stack, setStack] = useState<Mat[]>([])
  const [si, setSi] = useState(0)
  const [phase, setPhase] = useState<'build' | 'pour' | 'done'>('build')
  const [clarity, setClarity] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const drops = useRef<SVGGElement>(null)
  const st = useRef({ score: 0, results: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, results: [] }; setScore(0); setSi(0); setStack([]); setPhase('build'); setClarity(null) }, [round])

  const add = (m: Mat) => { if (phase === 'build' && stack.length < 5) setStack([...stack, m]) }
  const pour = () => {
    if (phase !== 'build' || !stack.length) return
    setPhase('pour')
    // How much dirt gets through: each layer catches a share, more if it's in its ideal spot.
    let dirt = STREAMS[si].dirt
    stack.forEach((m, i) => {
      const def = MATS.find((x) => x.id === m)!
      const inPlace = def.best === i
      const bonus = def.best < 0 ? 0 : inPlace ? 1.5 : Math.max(0.3, 1 - Math.abs(def.best - i) * 0.35)
      dirt *= 1 - Math.min(0.85, def.catches * bonus)
    })
    // Missing charcoal leaves taste and colour.
    if (!stack.includes('charcoal')) dirt = Math.max(dirt, 0.25)
    const c = Math.round((1 - dirt) * 100)
    const g = drops.current
    const finish = () => {
      setClarity(c); setPhase('done')
      const s = st.current
      s.score += c; s.results.push(`${STREAMS[si].name}: ${c}% clear`)
      setScore(s.score)
    }
    if (!g || reducedMotion()) { finish(); return }
    g.replaceChildren()
    const tl = gsap.timeline({ onComplete: finish })
    for (let i = 0; i < 26; i++) {
      const d = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      d.setAttribute('cx', String(BX + 20 + Math.random() * (BW - 40))); d.setAttribute('cy', '90'); d.setAttribute('r', '5')
      const dirty0 = STREAMS[si].dirt
      d.setAttribute('fill', `rgb(${120 + (1 - dirty0) * 100}, ${90 + (1 - dirty0) * 130}, ${60 + (1 - dirty0) * 190})`)
      g.appendChild(d)
      const endY = BOTTOM + 40
      tl.to(d, { attr: { cy: endY }, duration: 1.6, ease: 'power1.in' }, i * 0.05)
      tl.to(d, { attr: { fill: `rgb(${120 + c * 1.2}, ${150 + c}, ${200 + c * 0.5})` }, duration: 1.2 }, i * 0.05 + 0.3)
      tl.to(d, { opacity: 0, duration: 0.2 }, i * 0.05 + 1.6)
    }
  }
  const next = () => {
    if (si >= STREAMS.length - 1) {
      const s = st.current
      const record = submitRef.current(s.score)
      setResult({ headline: 'Safe to boil and drink', lines: [...s.results, `Score ${s.score}`], record })
      return
    }
    setSi(si + 1); setStack([]); setPhase('build'); setClarity(null)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const stream = STREAMS[si]
  const muddy = `rgb(${120}, ${95}, ${60})`
  return (
    <GameShell title="Water Filter" score={score} best={best} result={result} onRestart={restart}
      hint={`${stream.name} · tap materials to layer them bottom-up, then pour · ${phase === 'done' ? `${clarity}% clear` : `${stack.length}/5 layers`}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bottle water filter">
        <rect width={W} height={H} fill="#ecfdf5" />
        <path d={`M0 ${H - 30} q ${W / 3} -25 ${W} 10 V ${H} H0 Z`} fill="#86efac" />
        {/* Stream jug. */}
        <g transform="translate(120 70)">
          <path d="M0 0 h80 v110 a20 20 0 0 1 -20 20 h-40 a20 20 0 0 1 -20 -20 z" fill="#fff" stroke="#94a3b8" strokeWidth={3} />
          <rect x={4} y={40} width={72} height={86} rx={14} fill={muddy} opacity={0.5 + stream.dirt * 0.4} />
          <text x={40} y={-10} textAnchor="middle" fontSize={12} fill="#334155">{stream.name}</text>
        </g>
        {/* Bottle filter, cut upside-down. */}
        <path d={`M${BX} 110 L${BX + BW} 110 L${BX + BW} ${BOTTOM} Q ${BX + BW / 2} ${BOTTOM + 30} ${BX} ${BOTTOM} Z`} fill="#e0f2fe" stroke="#7dd3fc" strokeWidth={4} opacity={0.8} />
        {stack.map((m, i) => {
          const def = MATS.find((x) => x.id === m)!
          const y = BOTTOM - (i + 1) * LAYER
          return (
            <g key={i}>
              <rect x={BX + 4} y={y} width={BW - 8} height={LAYER} fill={def.color} stroke="#0002" />
              {m === 'gravel' && Array.from({ length: 10 }, (_, k) => <circle key={k} cx={BX + 14 + (k % 5) * 22} cy={y + 12 + Math.floor(k / 5) * 18} r={7} fill="#6b7280" />)}
              {m === 'sand' && Array.from({ length: 30 }, (_, k) => <circle key={k} cx={BX + 10 + (k * 37) % (BW - 20)} cy={y + 6 + ((k * 13) % (LAYER - 10))} r={1.5} fill="#b45309" />)}
              {m === 'grass' && Array.from({ length: 12 }, (_, k) => <line key={k} x1={BX + 10 + k * 9} y1={y + LAYER} x2={BX + 14 + k * 9} y2={y + 6} stroke="#3f6212" strokeWidth={2} />)}
              <text x={BX + BW + 12} y={y + LAYER / 2 + 4} fontSize={12} fill="#334155">{def.label}</text>
            </g>
          )
        })}
        <g ref={drops} />
        {/* Cup below. */}
        <g transform={`translate(${BX + 10} ${BOTTOM + 30})`}>
          <path d="M0 0 h100 l-10 44 h-80 z" fill="#fff" stroke="#94a3b8" strokeWidth={3} />
          {clarity !== null && <path d="M4 10 h92 l-8 30 h-76 z" fill={`rgb(${120 + clarity * 1.2}, ${150 + clarity}, ${200 + clarity * 0.5})`} opacity={0.9} />}
        </g>
        {clarity !== null && <text x={BX + 60} y={80} textAnchor="middle" fontSize={22} fontWeight={800} fill={clarity > 80 ? '#059669' : clarity > 50 ? '#d97706' : '#b91c1c'}>{clarity}% clear</text>}
      </svg>
      <div className="cf-tray">
        {MATS.map((m) => <button key={m.id} type="button" disabled={phase !== 'build'} onClick={() => add(m.id)} style={{ borderLeft: `8px solid ${m.color}` }}>{m.label}</button>)}
        {phase === 'build' && <button type="button" disabled={!stack.length} onClick={() => setStack(stack.slice(0, -1))}>↶ Remove top</button>}
        {phase === 'build' && <button type="button" className="cf-match" disabled={!stack.length} onClick={pour}>💧 Pour</button>}
        {phase === 'done' && <button type="button" className="cf-match" onClick={next}>Next stream →</button>}
      </div>
    </GameShell>
  )
}
