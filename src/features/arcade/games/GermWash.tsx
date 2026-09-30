import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Germ Wash: wiggly germs camp out on two soapy hands. Press and scrub over
 * them to foam them away before the 20-second song ends. They love the
 * sneaky spots: fingertips, thumbs, between the fingers and round the wrists.
 * Three rounds, each a little grubbier.
 */
const W = 760, H = 480
const SONG = 20
type Germ = { id: number; x: number; y: number; hp: number; hue: number; spot: string }

// Hand geometry (right hand; the left is mirrored at x = W - x).
const FINGERS = [
  { x: 520, y: 130, w: 30, h: 110 }, { x: 556, y: 110, w: 30, h: 128 }, { x: 592, y: 118, w: 30, h: 122 }, { x: 628, y: 146, w: 28, h: 100 },
]
const SPOTS: { spot: string; pts: [number, number][] }[] = [
  { spot: 'fingertips', pts: FINGERS.map((f) => [f.x + f.w / 2, f.y + 12]) },
  { spot: 'between fingers', pts: [[553, 238], [589, 236], [624, 240]] },
  { spot: 'thumb', pts: [[480, 290], [470, 262]] },
  { spot: 'palm', pts: [[570, 300], [600, 320], [545, 330]] },
  { spot: 'wrist', pts: [[560, 400], [600, 405]] },
]

export default function GermWash() {
  const [best, submit] = useBest('germs')
  const [germs, setGerms] = useState<Germ[]>([])
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(SONG)
  const [level, setLevel] = useState(1)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ germs: [] as Germ[], score: 0, level: 1, t: SONG, down: false, running: true, cleared: 0, missed: {} as Record<string, number> })
  const svg = useRef<SVGSVGElement>(null)
  const foam = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const seed = (level: number) => {
    const list: Germ[] = []
    let id = 1
    const n = 8 + level * 5
    for (let i = 0; i < n; i++) {
      const sp = SPOTS[i % SPOTS.length]
      const [px, py] = sp.pts[Math.floor(Math.random() * sp.pts.length)]
      const mirror = Math.random() < 0.5
      list.push({ id: id++, x: (mirror ? W - px : px) + (Math.random() - 0.5) * 16, y: py + (Math.random() - 0.5) * 16, hp: 1, hue: 80 + Math.random() * 140, spot: sp.spot })
    }
    return list
  }

  useEffect(() => {
    st.current = { germs: seed(1), score: 0, level: 1, t: SONG, down: false, running: true, cleared: 0, missed: {} }
    setGerms(st.current.germs); setScore(0); setLevel(1); setTime(SONG)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        setTime(Math.max(0, Math.ceil(s.t)))
        const left = s.germs.filter((g) => g.hp > 0)
        if (!left.length || s.t <= 0) {
          left.forEach((g) => { s.missed[g.spot] = (s.missed[g.spot] ?? 0) + 1 })
          if (!left.length) s.score += Math.ceil(s.t) * 3
          if (s.level >= 3) {
            s.running = false
            const worst = Object.entries(s.missed).sort((a, b) => b[1] - a[1])[0]
            const record = submitRef.current(s.score)
            setResult({ headline: 'Squeaky clean!', lines: [`${s.cleared} germs foamed away`, worst ? `Most missed: ${worst[0]}` : 'Nothing missed at all', `Score ${s.score}`], record })
          } else {
            s.level++
            s.t = SONG
            s.germs = seed(s.level)
            setLevel(s.level)
            setGerms(s.germs)
          }
          setScore(s.score)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const scrub = (e: React.PointerEvent) => {
    const s = st.current
    if (!s.down || !s.running) return
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    let changed = false
    for (const g of s.germs) {
      if (g.hp <= 0) continue
      if (Math.hypot(g.x - p.x, g.y - p.y) < 30) {
        g.hp -= 0.12
        changed = true
        if (g.hp <= 0) { s.cleared++; s.score += 10 }
      }
    }
    if (changed) { setGerms([...s.germs]); setScore(s.score) }
    // Foam bubbles trail the scrub.
    const f = foam.current
    if (f && Math.random() < 0.6) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.setAttribute('cx', String(p.x + (Math.random() - 0.5) * 20)); c.setAttribute('cy', String(p.y + (Math.random() - 0.5) * 20))
      c.setAttribute('r', String(4 + Math.random() * 8)); c.setAttribute('fill', '#ffffff'); c.setAttribute('stroke', '#bde3ff'); c.setAttribute('opacity', '0.9')
      f.appendChild(c)
      if (reducedMotion()) window.setTimeout(() => c.remove(), 500)
      else gsap.to(c, { attr: { r: 14 }, opacity: 0, y: -20, duration: 0.9, ease: 'power1.out', onComplete: () => c.remove() })
    }
  }

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const hand = (mirror: boolean) => (
    <g transform={mirror ? `translate(${W} 0) scale(-1 1)` : undefined}>
      <rect x={530} y={360} width={110} height={90} rx={30} fill="#f3c9a8" />
      <ellipse cx={578} cy={300} rx={80} ry={86} fill="#f7d4b6" />
      {FINGERS.map((f, i) => <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.w / 2} fill="#f7d4b6" stroke="#e8b996" />)}
      {FINGERS.map((f, i) => <ellipse key={`n${i}`} cx={f.x + f.w / 2} cy={f.y + 14} rx={9} ry={7} fill="#fbe7da" />)}
      <path d="M512 300 Q 450 290 452 250 Q 456 222 480 236 Q 500 262 530 270 Z" fill="#f7d4b6" stroke="#e8b996" />
    </g>
  )
  return (
    <GameShell title="Germ Wash" score={score} best={best} result={result} onRestart={restart}
      hint={`Round ${level}/3 · press and scrub over the germs · ${time}s left in the song`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Soapy hands"
        onPointerDown={(e) => { st.current.down = true; scrub(e) }} onPointerMove={scrub} onPointerUp={() => { st.current.down = false }} onPointerLeave={() => { st.current.down = false }}
        style={{ cursor: 'grab' }}>
        <rect width={W} height={H} fill="#dff3fb" />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={(i * 131) % W} cy={(i * 71) % H} r={10 + (i % 4) * 6} fill="#ffffff" opacity={0.5} />)}
        {hand(false)}
        {hand(true)}
        {germs.filter((g) => g.hp > 0).map((g) => (
          <g key={g.id} transform={`translate(${g.x} ${g.y}) scale(${0.5 + g.hp * 0.5})`}>
            <circle r={13} fill={`hsl(${g.hue} 70% 45%)`} opacity={0.85}>
              <animate attributeName="r" values="12;14;12" dur={`${0.8 + (g.id % 5) * 0.15}s`} repeatCount="indefinite" />
            </circle>
            {Array.from({ length: 6 }, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos(i) * 19} y2={Math.sin(i) * 19} stroke={`hsl(${g.hue} 70% 35%)`} strokeWidth={2.5} strokeLinecap="round" />)}
            <circle cx={-4} cy={-3} r={3} fill="#fff" /><circle cx={4} cy={-3} r={3} fill="#fff" />
            <circle cx={-4} cy={-3} r={1.4} fill="#000" /><circle cx={4} cy={-3} r={1.4} fill="#000" />
          </g>
        ))}
        <g ref={foam} pointerEvents="none" />
        <g transform="translate(290 24)">
          <rect width={180} height={12} rx={6} fill="#ffffff" />
          <rect width={(time / SONG) * 180} height={12} rx={6} fill="#56b6f7" />
          <text x={90} y={32} textAnchor="middle" fontSize={13} fill="#245">♪ happy birthday ♪ ×2</text>
        </g>
      </svg>
    </GameShell>
  )
}
