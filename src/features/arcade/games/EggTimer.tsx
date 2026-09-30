import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Egg Timer Symphony: brunch orders pour in — soft, jammy or hard-boiled.
 * Tap a pot to drop an egg in, tap the egg to lift it out. Each boiling pot
 * ticks like a metronome so you can count in your head; there are no clocks.
 * Crack it open to see how you did.
 */
type Want = 'soft' | 'jammy' | 'hard'
const TARGET: Record<Want, number> = { soft: 5, jammy: 7, hard: 10 } // seconds in this kitchen
const W = 780, H = 460
const POTS = [180, 390, 600]
const TIME = 90

export default function EggTimer() {
  const [best, submit] = useBest('eggs')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ pots: POTS.map(() => ({ egg: false, t: 0, want: 'soft' as Want })), orders: [] as Want[], t: TIME, score: 0, perfect: 0, served: 0, running: true, cracks: [] as { x: number; yolk: number; want: Want; life: number }[] })
  const potEls = useRef<(SVGGElement | null)[]>([])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  const rnd = (): Want => (['soft', 'jammy', 'hard'] as Want[])[Math.floor(Math.random() * 3)]

  useEffect(() => {
    st.current = { pots: POTS.map(() => ({ egg: false, t: 0, want: 'soft' as Want })), orders: [rnd(), rnd(), rnd()], t: TIME, score: 0, perfect: 0, served: 0, running: true, cracks: [] }
    let last = performance.now()
    let raf = 0
    let beat = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        beat += dt
        s.pots.forEach((p) => { if (p.egg) p.t += dt })
        if (beat >= 1) {
          beat = 0
          potEls.current.forEach((el, i) => { if (el && s.pots[i].egg && !reducedMotion()) gsap.fromTo(el, { y: -3 }, { y: 0, duration: 0.25, ease: 'power2.out' }) })
        }
        s.cracks.forEach((c) => { c.life -= dt })
        s.cracks = s.cracks.filter((c) => c.life > 0)
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Brunch served!', lines: [`${s.served} eggs served`, `${s.perfect} cooked perfectly`, `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const tapPot = (i: number) => {
    const s = st.current
    if (!s.running) return
    const p = s.pots[i]
    if (!p.egg) {
      if (!s.orders.length) return
      p.egg = true; p.t = 0; p.want = s.orders.shift()!
      s.orders.push(rnd())
    } else {
      const off = p.t - TARGET[p.want]
      const yolk = Math.max(0, Math.min(1, p.t / 11)) // 0 runny → 1 chalky
      const pts = Math.max(0, Math.round(30 - Math.abs(off) * 14))
      s.score += pts; s.served++
      if (Math.abs(off) < 0.6) s.perfect++
      s.cracks.push({ x: POTS[i], yolk, want: p.want, life: 1.8 })
      p.egg = false; p.t = 0
    }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const yolkColor = (y: number) => `hsl(${42 - y * 10}, ${95 - y * 45}%, ${52 + y * 18}%)`
  return (
    <GameShell title="Egg Timer Symphony" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Tap a pot to add the next order's egg, tap again to lift it out · soft ${TARGET.soft} beats, jammy ${TARGET.jammy}, hard ${TARGET.hard} · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pots of boiling eggs">
        <rect width={W} height={H} fill="#fff7ed" />
        <rect y={300} width={W} height={160} fill="#374151" />
        <g transform="translate(20 20)">
          <text fontSize={13} fontWeight={800} fill="#7c2d12">Orders</text>
          {s.orders.map((o, i) => (
            <g key={i} transform={`translate(${i * 110} 12)`}>
              <rect width={100} height={44} rx={10} fill="#fff" stroke="#fdba74" />
              <text x={10} y={29} fontSize={20}>🥚</text>
              <text x={38} y={28} fontSize={13} fontWeight={700} fill="#7c2d12">{o}</text>
            </g>
          ))}
        </g>
        {POTS.map((x, i) => {
          const p = s.pots[i]
          const beats = Math.floor(p.t)
          return (
            <g key={i} onPointerDown={() => tapPot(i)} style={{ cursor: 'pointer' }}>
              <ellipse cx={x} cy={330} rx={90} ry={16} fill="#111827" />
              <ellipse cx={x} cy={326} rx={70} ry={10} fill={p.egg ? '#f97316' : '#1f2937'} opacity={p.egg ? 0.8 : 1} />
              <g ref={(el) => { potEls.current[i] = el }}>
                <path d={`M${x - 80} 200 h160 v100 a20 20 0 0 1 -20 20 h-120 a20 20 0 0 1 -20 -20 z`} fill="#9ca3af" stroke="#4b5563" strokeWidth={3} />
                <rect x={x - 96} y={214} width={18} height={10} rx={4} fill="#4b5563" /><rect x={x + 78} y={214} width={18} height={10} rx={4} fill="#4b5563" />
                <ellipse cx={x} cy={204} rx={78} ry={10} fill="#bae6fd" />
                {p.egg && Array.from({ length: 6 }, (_, k) => (
                  <circle key={k} cx={x - 50 + k * 20} cy={204} r={4} fill="#fff" opacity={0.8}>
                    <animate attributeName="cy" values="210;196;210" dur={`${0.6 + (k % 3) * 0.2}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                {p.egg && <ellipse cx={x} cy={200} rx={16} ry={20} fill="#fef3c7" stroke="#d6b88a" />}
                {p.egg && <text x={x} y={170} textAnchor="middle" fontSize={13} fontWeight={800} fill="#7c2d12">{p.want}</text>}
                {/* Tick marks: one lights per beat, no numbers. */}
                {p.egg && Array.from({ length: 12 }, (_, k) => <circle key={`b${k}`} cx={x - 55 + k * 10} cy={250} r={3.2} fill={k < beats ? '#fde68a' : '#6b7280'} />)}
                {!p.egg && <text x={x} y={262} textAnchor="middle" fontSize={12} fill="#1f2937">tap to add egg</text>}
              </g>
            </g>
          )
        })}
        {s.cracks.map((c, i) => (
          <g key={i} transform={`translate(${c.x} 380)`} opacity={Math.min(1, c.life)}>
            <ellipse rx={46} ry={30} fill="#fff" stroke="#e5e7eb" />
            <circle r={18} fill={yolkColor(c.yolk)} />
            {c.yolk < 0.45 && <path d="M8 16 q6 14 -2 26" stroke={yolkColor(c.yolk)} strokeWidth={6} fill="none" />}
            <text y={52} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fde68a">{Math.abs(c.yolk * 11 - TARGET[c.want]) < 0.6 ? 'perfect!' : c.yolk * 11 < TARGET[c.want] ? 'too runny' : 'overdone'}</text>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
