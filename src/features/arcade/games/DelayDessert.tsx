import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Delay Dessert: a cake keeps stacking up new layers, each one tastier than
 * the last. Tap the plate to serve it and bank the points, or wait for a
 * taller cake. Somewhere behind the counter a cat is creeping closer, and if
 * it gets there first, the cake is gone. Eight cakes per game.
 */
const W = 720, H = 480
const CAKES = 8
const LAYER_COLORS = ['#f7d1dc', '#fbe3a6', '#c9e8d1', '#d6c8f5', '#ffc6a8', '#b8e0f7', '#f5b8c8', '#fff0b3', '#cde7b0', '#f2c1e8']
const value = (layers: number) => Math.round(Math.pow(layers, 1.6) * 3)

export default function DelayDessert() {
  const [best, submit] = useBest('dessert')
  const [layers, setLayers] = useState(1)
  const [cat, setCat] = useState(0) // 0..1, 1 = at the cake
  const [cake, setCake] = useState(1)
  const [score, setScore] = useState(0)
  const [log, setLog] = useState<('eaten' | 'stolen')[]>([])
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ layers: 1, cat: 0, catSpeed: 0.1, grow: 0, cake: 1, score: 0, busy: false, running: true, eaten: 0, stolen: 0, biggest: 0 })
  const stack = useRef<SVGGElement>(null)
  const catEl = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const next = useCallback(() => {
    const s = st.current
    if (s.cake >= CAKES) {
      s.running = false
      const record = submitRef.current(s.score)
      setResult({ headline: 'Dessert’s over', lines: [`${s.eaten} cakes enjoyed`, `${s.stolen} taken by the cat`, `Tallest served: ${s.biggest} layers`, `Score ${s.score}`], record })
      return
    }
    s.cake++
    s.layers = 1
    s.cat = 0
    s.grow = 0
    // Each cat is a little different: some dawdle, some dash.
    s.catSpeed = 0.06 + Math.random() * 0.12
    s.busy = false
    setCake(s.cake); setLayers(1); setCat(0)
  }, [])

  useEffect(() => {
    st.current = { layers: 1, cat: 0, catSpeed: 0.08 + Math.random() * 0.08, grow: 0, cake: 1, score: 0, busy: false, running: true, eaten: 0, stolen: 0, biggest: 0 }
    setLayers(1); setCat(0); setCake(1); setScore(0); setLog([])
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running && !s.busy) {
        s.grow += dt
        if (s.grow > 1.1 && s.layers < 10) { s.grow = 0; s.layers++; setLayers(s.layers) }
        // The cat creeps in fits and starts.
        const creep = (Math.sin(now / 350) + 1.2) * s.catSpeed * dt
        s.cat = Math.min(1, s.cat + creep)
        setCat(s.cat)
        if (s.cat >= 1) {
          s.busy = true
          s.stolen++
          setLog((l) => [...l, 'stolen'])
          const g = stack.current
          if (g && !reducedMotion()) gsap.to(g, { x: 260, rotation: 20, opacity: 0, duration: 0.6, ease: 'power2.in', onComplete: () => { gsap.set(g, { x: 0, rotation: 0, opacity: 1 }); next() } })
          else next()
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, next])

  useEffect(() => {
    const g = stack.current?.lastElementChild
    if (g && !reducedMotion()) gsap.fromTo(g, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'bounce.out' })
  }, [layers])

  const serve = () => {
    const s = st.current
    if (!s.running || s.busy) return
    s.busy = true
    const v = value(s.layers)
    s.score += v; s.eaten++; s.biggest = Math.max(s.biggest, s.layers)
    setScore(s.score)
    setLog((l) => [...l, 'eaten'])
    const g = stack.current
    if (g && !reducedMotion()) gsap.to(g, { scale: 0.2, y: -120, opacity: 0, duration: 0.5, ease: 'back.in(1.6)', svgOrigin: '360 380', onComplete: () => { gsap.set(g, { scale: 1, y: 0, opacity: 1 }); next() } })
    else next()
  }

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const catX = 40 + cat * 250
  return (
    <GameShell title="Delay Dessert" score={score} best={best} result={result} onRestart={restart}
      hint={`Cake ${Math.min(cake, CAKES)}/${CAKES} · tap the plate to serve · this cake is worth ${value(layers)} now · the cat is ${cat < 0.5 ? 'far off' : cat < 0.8 ? 'getting close' : 'RIGHT THERE'}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cake on a counter">
        <rect width={W} height={H} fill="#fff6ec" />
        <rect y={380} width={W} height={100} fill="#d9a877" />
        <rect y={372} width={W} height={12} fill="#b98553" />
        {Array.from({ length: 6 }, (_, i) => <rect key={i} x={i * 130 + 20} y={40} width={90} height={120} rx={8} fill="#f3e3d0" stroke="#e6cfb4" />)}
        <g ref={catEl} transform={`translate(${catX} 340)`}>
          <ellipse cx={0} cy={20} rx={46} ry={22} fill="#555" />
          <circle cx={40} cy={0} r={20} fill="#555" />
          <path d="M28 -14 l6 -16 l8 14 M46 -14 l8 -14 l2 16" fill="#555" />
          <circle cx={46} cy={-2} r={3} fill={cat > 0.75 ? '#ffd23f' : '#9fe870'} />
          <path d={`M-44 18 q-30 ${-20 + Math.sin(cat * 30) * 12} -20 -40`} stroke="#555" strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
        <g onPointerDown={serve} style={{ cursor: 'pointer' }}>
          <ellipse cx={360} cy={378} rx={130} ry={16} fill="#fff" stroke="#e4d6c4" strokeWidth={3} />
          <g ref={stack}>
            {Array.from({ length: layers }, (_, i) => (
              <g key={i}>
                <rect x={360 - 90 + i * 3} y={352 - i * 26} width={180 - i * 6} height={26} rx={8} fill={LAYER_COLORS[i % LAYER_COLORS.length]} stroke="#0001" />
                <path d={`M${360 - 90 + i * 3} ${354 - i * 26} q15 12 30 0 t30 0 t30 0 t30 0 t30 0 t30 0`} fill="#fffaf2" opacity={0.9} />
              </g>
            ))}
            <circle cx={360} cy={372 - layers * 26} r={10} fill="#e23b3b" />
          </g>
          <text x={360} y={420} textAnchor="middle" fontSize={15} fontWeight={800} fill="#7a4b24">serve · {value(layers)} pts</text>
        </g>
        <g transform="translate(520 30)">
          {Array.from({ length: CAKES }, (_, i) => <text key={i} x={i * 24} y={0} fontSize={18} opacity={i < log.length ? 1 : 0.25}>{log[i] === 'stolen' ? '🐈' : log[i] === 'eaten' ? '🍰' : '·'}</text>)}
        </g>
      </svg>
    </GameShell>
  )
}
