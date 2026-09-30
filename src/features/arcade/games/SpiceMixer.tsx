import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Spice Mixer: every dish has a flavour shape — a little salty here, a bit
 * sour there. Tap jars to shake a pinch into the pot and watch your shape grow
 * on the flavour wheel. You can't take a pinch back out, so creep up on it.
 * Serve when the two shapes match. Five dishes.
 */
type Axis = 'sweet' | 'salty' | 'sour' | 'bitter' | 'heat' | 'umami'
const AXES: Axis[] = ['sweet', 'salty', 'sour', 'bitter', 'heat', 'umami']
const JARS: { name: string; glyph: string; color: string; adds: Partial<Record<Axis, number>> }[] = [
  { name: 'Salt', glyph: '🧂', color: '#e5e7eb', adds: { salty: 0.12 } },
  { name: 'Honey', glyph: '🍯', color: '#f59e0b', adds: { sweet: 0.12 } },
  { name: 'Lemon', glyph: '🍋', color: '#fde047', adds: { sour: 0.12, sweet: 0.01 } },
  { name: 'Chilli', glyph: '🌶️', color: '#ef4444', adds: { heat: 0.14 } },
  { name: 'Soy', glyph: '🥢', color: '#78350f', adds: { umami: 0.1, salty: 0.06 } },
  { name: 'Cocoa', glyph: '🍫', color: '#451a03', adds: { bitter: 0.12, sweet: 0.02 } },
  { name: 'Tomato', glyph: '🍅', color: '#dc2626', adds: { umami: 0.08, sour: 0.04, sweet: 0.03 } },
]
const DISHES: { name: string; glyph: string; target: Record<Axis, number> }[] = [
  { name: 'Tomato soup', glyph: '🥣', target: { sweet: 0.3, salty: 0.35, sour: 0.3, bitter: 0, heat: 0.1, umami: 0.55 } },
  { name: 'Lemonade', glyph: '🥤', target: { sweet: 0.55, salty: 0, sour: 0.6, bitter: 0, heat: 0, umami: 0 } },
  { name: 'Chilli con carne', glyph: '🌯', target: { sweet: 0.1, salty: 0.4, sour: 0.1, bitter: 0.15, heat: 0.7, umami: 0.5 } },
  { name: 'Hot chocolate', glyph: '☕', target: { sweet: 0.6, salty: 0.05, sour: 0, bitter: 0.45, heat: 0, umami: 0 } },
  { name: 'Stir-fry sauce', glyph: '🥡', target: { sweet: 0.3, salty: 0.45, sour: 0.2, bitter: 0, heat: 0.3, umami: 0.6 } },
]
const W = 800, H = 480, RX = 560, RY = 230, RR = 150
const zero = (): Record<Axis, number> => ({ sweet: 0, salty: 0, sour: 0, bitter: 0, heat: 0, umami: 0 })
const pt = (a: number, v: number): [number, number] => { const ang = -Math.PI / 2 + (a / 6) * Math.PI * 2; return [RX + Math.cos(ang) * RR * v, RY + Math.sin(ang) * RR * v] }
const shape = (f: Record<Axis, number>) => AXES.map((ax, i) => pt(i, Math.min(1.1, f[ax])).join(',')).join(' ')

export default function SpiceMixer() {
  const [best, submit] = useBest('spice')
  const [di, setDi] = useState(0)
  const [mix, setMix] = useState<Record<Axis, number>>(zero)
  const [shown, setShown] = useState<Record<Axis, number>>(zero)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const pot = useRef<SVGGElement>(null)
  const st = useRef({ score: 0, lines: [] as string[], pinches: 0 })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, lines: [], pinches: 0 }; setScore(0); setDi(0); setMix(zero()); setShown(zero()) }, [round])
  // The drawn shape eases toward the real mix.
  useEffect(() => {
    const o = { ...shown }
    const tw = gsap.to(o, { ...mix, duration: reducedMotion() ? 0 : 0.5, ease: 'back.out(2)', onUpdate: () => setShown({ ...o }) })
    return () => { tw.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mix])

  const add = (j: typeof JARS[number]) => {
    const next = { ...mix }
    for (const [k, v] of Object.entries(j.adds) as [Axis, number][]) next[k] = Math.min(1.2, next[k] + v)
    setMix(next)
    st.current.pinches++
    const g = pot.current
    if (g && !reducedMotion()) {
      for (let i = 0; i < 8; i++) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        c.setAttribute('cx', String(200 + (Math.random() - 0.5) * 30)); c.setAttribute('cy', '150'); c.setAttribute('r', '4'); c.setAttribute('fill', j.color)
        g.appendChild(c)
        gsap.to(c, { attr: { cy: 300, cx: 200 + (Math.random() - 0.5) * 80 }, opacity: 0, duration: 0.6 + Math.random() * 0.3, ease: 'power2.in', onComplete: () => c.remove() })
      }
    }
  }
  const serve = () => {
    const d = DISHES[di]
    const err = AXES.reduce((n, a) => n + Math.abs(d.target[a] - mix[a]), 0)
    const pts = Math.max(0, Math.round(100 - err * 70))
    const s = st.current
    s.score += pts; s.lines.push(`${d.glyph} ${d.name}: ${pts > 80 ? 'chef’s kiss' : pts > 50 ? 'tasty' : 'hmm…'}`)
    setScore(s.score)
    if (di + 1 >= DISHES.length) {
      const record = submitRef.current(s.score)
      setResult({ headline: 'Dinner party success', lines: [...s.lines, `${s.pinches} pinches in total`, `Score ${s.score}`], record })
    } else { setDi(di + 1); setMix(zero()) }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const d = DISHES[di]
  return (
    <GameShell title="Spice Mixer" score={score} best={best} result={result} onRestart={restart}
      hint={`${d.glyph} ${d.name} (${di + 1}/${DISHES.length}) · tap jars to add a pinch · match the dashed shape, then serve`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pot and flavour wheel">
        <rect width={W} height={H} fill="#fff7ed" />
        {/* Pot. */}
        <g>
          <ellipse cx={200} cy={380} rx={130} ry={24} fill="#1f2937" opacity={0.25} />
          <path d="M80 250 h240 v100 a30 30 0 0 1 -30 30 h-180 a30 30 0 0 1 -30 -30 z" fill="#475569" />
          <ellipse cx={200} cy={250} rx={120} ry={22} fill={`hsl(${20 + shown.sweet * 30 - shown.heat * 20}, ${50 + shown.umami * 30}%, ${45 - shown.bitter * 20}%)`} />
          {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={130 + i * 28} cy={248} r={4} fill="#fff" opacity={0.5}><animate attributeName="cy" values="252;240;252" dur={`${1 + i * 0.2}s`} repeatCount="indefinite" /></circle>)}
          <text x={200} y={330} textAnchor="middle" fontSize={48}>{d.glyph}</text>
        </g>
        <g ref={pot} />
        {/* Flavour wheel. */}
        {[0.25, 0.5, 0.75, 1].map((r) => <polygon key={r} points={AXES.map((_, i) => pt(i, r).join(',')).join(' ')} fill="none" stroke="#fed7aa" />)}
        {AXES.map((a, i) => { const [x, y] = pt(i, 1.16); return <text key={a} x={x} y={y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="#9a3412">{a}</text> })}
        <polygon points={shape(d.target)} fill="#fde68a" fillOpacity={0.35} stroke="#d97706" strokeWidth={3} strokeDasharray="8 6" />
        <polygon points={shape(shown)} fill="#ef4444" fillOpacity={0.35} stroke="#dc2626" strokeWidth={3} />
      </svg>
      <div className="cf-tray">
        {JARS.map((j) => <button key={j.name} type="button" onClick={() => add(j)}>{j.glyph} {j.name}</button>)}
        <button type="button" className="cf-match" onClick={serve}>🍽 Serve</button>
      </div>
    </GameShell>
  )
}
