import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Leak Hunter: pipes in an old house keep springing leaks. Turn the valve
 * that feeds the leaky pipe (click a valve wheel), then click the leak to
 * patch it. Patch with the water still on and you get soaked. The main
 * stopcock shuts everything — handy, but the whole house grumbles while it's
 * off. Reopen valves once you're done.
 */
type Branch = 'kitchen' | 'bath' | 'heat'
const W = 820, H = 500
const MAIN = { x: 90, y: 440 }
const BRANCHES: { id: Branch; label: string; valve: [number, number]; path: string; fixtures: { name: string; glyph: string; x: number; y: number }[] }[] = [
  { id: 'kitchen', label: 'Kitchen', valve: [230, 380], path: 'M130 440 H230 V380 H320 V330 H560', fixtures: [{ name: 'sink', glyph: '🚰', x: 420, y: 330 }, { name: 'washer', glyph: '🧺', x: 560, y: 330 }] },
  { id: 'bath', label: 'Bathroom', valve: [230, 250], path: 'M160 440 V250 H330 V160 H700', fixtures: [{ name: 'basin', glyph: '🧼', x: 450, y: 160 }, { name: 'bath', glyph: '🛁', x: 580, y: 160 }, { name: 'toilet', glyph: '🚽', x: 700, y: 160 }] },
  { id: 'heat', label: 'Heating', valve: [620, 440], path: 'M130 440 H760 V260', fixtures: [{ name: 'radiator', glyph: '♨️', x: 720, y: 440 }, { name: 'upstairs radiator', glyph: '♨️', x: 760, y: 280 }] },
]
const TIME = 80
type Leak = { id: number; branch: Branch; x: number; y: number; age: number; fixing: number }

export default function LeakHunter() {
  const [best, submit] = useBest('leaks')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ open: { kitchen: true, bath: true, heat: true } as Record<Branch, boolean>, main: true, leaks: [] as Leak[], damage: 0, grumble: 0, fixed: 0, soaked: 0, t: TIME, running: true, next: 2, id: 1 })
  const valveEls = useRef(new Map<string, SVGGElement>())
  const soak = useRef<SVGRectElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { open: { kitchen: true, bath: true, heat: true }, main: true, leaks: [], damage: 0, grumble: 0, fixed: 0, soaked: 0, t: TIME, running: true, next: 2, id: 1 }
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        s.next -= dt
        if (s.next <= 0 && s.leaks.length < 3) {
          const b = BRANCHES[Math.floor(Math.random() * BRANCHES.length)]
          const f = b.fixtures[Math.floor(Math.random() * b.fixtures.length)]
          s.leaks.push({ id: s.id++, branch: b.id, x: f.x - 40 + Math.random() * 30, y: f.y, age: 0, fixing: 0 })
          s.next = Math.max(2.5, 6 - (TIME - s.t) * 0.04)
        }
        const closedCount = (s.main ? 0 : 3) + (['kitchen', 'bath', 'heat'] as Branch[]).filter((b) => !s.open[b]).length
        s.grumble += closedCount * dt * 0.8
        for (const l of s.leaks) {
          const flowing = s.main && s.open[l.branch]
          if (flowing) { l.age += dt; s.damage += dt * 1.2 }
          if (l.fixing > 0) { l.fixing -= dt; if (l.fixing <= 0) { l.fixing = -1; s.fixed++ } }
        }
        s.leaks = s.leaks.filter((l) => l.fixing !== -1)
        if (s.t <= 0) {
          s.running = false
          const score = Math.max(0, Math.round(s.fixed * 25 - s.damage * 2 - s.grumble))
          const record = submitRef.current(score)
          setResult({ headline: 'Plumber’s day done', lines: [`${s.fixed} leaks patched`, `Water damage ${Math.round(s.damage)}`, `Grumbles from dry taps ${Math.round(s.grumble)}`, `${s.soaked} soakings`, `Score ${score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const spin = (key: string, closed: boolean) => {
    const el = valveEls.current.get(key)
    if (el && !reducedMotion()) gsap.to(el, { rotation: closed ? 90 : 0, duration: 0.35, ease: 'back.out(2)', svgOrigin: '0 0' })
  }
  const toggleValve = (b: Branch) => { const s = st.current; s.open[b] = !s.open[b]; spin(b, !s.open[b]) }
  const toggleMain = () => { const s = st.current; s.main = !s.main; spin('main', !s.main) }
  const patch = (l: Leak) => {
    const s = st.current
    if (l.fixing !== 0 || !s.running) return
    if (s.main && s.open[l.branch]) {
      s.soaked++; s.damage += 6
      if (soak.current && !reducedMotion()) gsap.fromTo(soak.current, { opacity: 0.5 }, { opacity: 0, duration: 0.8 })
      return
    }
    l.fixing = 1.1
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const flowing = (b: Branch) => s.main && s.open[b]
  return (
    <GameShell title="Leak Hunter" score={Math.max(0, Math.round(s.fixed * 25 - s.damage * 2 - s.grumble))} best={best} result={result} onRestart={restart}
      hint={`Close the right valve, then click the leak to patch it · reopen after · ${s.leaks.length} leaking · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="House plumbing">
        <rect width={W} height={H} fill="#f8fafc" />
        <path d="M60 470 V120 L410 30 L780 120 V470 Z" fill="#fef3c7" stroke="#d6a45a" strokeWidth={4} />
        <line x1={60} x2={780} y1={220} y2={220} stroke="#d6a45a" strokeWidth={4} />
        <text x={100} y={200} fontSize={13} fill="#92400e" fontWeight={700}>upstairs</text>
        <text x={640} y={250} fontSize={13} fill="#92400e" fontWeight={700}>downstairs</text>
        {/* Water damage puddle. */}
        <ellipse cx={420} cy={478} rx={Math.min(360, s.damage * 3)} ry={Math.min(14, s.damage * 0.2)} fill="#60a5fa" opacity={0.5} />
        {BRANCHES.map((b) => (
          <g key={b.id}>
            <path d={b.path} fill="none" stroke="#94a3b8" strokeWidth={14} strokeLinejoin="round" />
            <path d={b.path} fill="none" stroke={flowing(b.id) ? '#3b82f6' : '#cbd5e1'} strokeWidth={6} strokeLinejoin="round" strokeDasharray={flowing(b.id) ? '10 8' : undefined}>
              {flowing(b.id) && <animate attributeName="stroke-dashoffset" from="36" to="0" dur="0.8s" repeatCount="indefinite" />}
            </path>
            {b.fixtures.map((f) => <text key={f.name} x={f.x} y={f.y - 16} textAnchor="middle" fontSize={26}>{f.glyph}</text>)}
            <g transform={`translate(${b.valve[0]} ${b.valve[1]})`} onPointerDown={() => toggleValve(b.id)} style={{ cursor: 'pointer' }}>
              <circle r={22} fill="#fff" stroke={s.open[b.id] ? '#16a34a' : '#dc2626'} strokeWidth={4} />
              <g ref={(el) => { if (el) valveEls.current.set(b.id, el) }}><rect x={-16} y={-4} width={32} height={8} rx={4} fill={s.open[b.id] ? '#16a34a' : '#dc2626'} /></g>
              <text y={40} textAnchor="middle" fontSize={11} fontWeight={700} fill="#334155">{b.label} {s.open[b.id] ? 'on' : 'off'}</text>
            </g>
          </g>
        ))}
        <g transform={`translate(${MAIN.x} ${MAIN.y})`} onPointerDown={toggleMain} style={{ cursor: 'pointer' }}>
          <circle r={26} fill="#fff" stroke={s.main ? '#16a34a' : '#dc2626'} strokeWidth={5} />
          <g ref={(el) => { if (el) valveEls.current.set('main', el) }}><rect x={-20} y={-5} width={40} height={10} rx={5} fill={s.main ? '#16a34a' : '#dc2626'} /></g>
          <text y={-34} textAnchor="middle" fontSize={11} fontWeight={800} fill="#334155">MAIN {s.main ? 'on' : 'off'}</text>
        </g>
        {s.leaks.map((l) => {
          const on = flowing(l.branch)
          return (
            <g key={l.id} transform={`translate(${l.x} ${l.y})`} onPointerDown={() => patch(l)} style={{ cursor: 'pointer' }}>
              <circle r={20} fill="transparent" />
              {on ? Array.from({ length: 4 }, (_, i) => (
                <circle key={i} r={4} fill="#3b82f6">
                  <animate attributeName="cy" from="0" to="60" dur={`${0.6 + i * 0.12}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="1" to="0" dur={`${0.6 + i * 0.12}s`} repeatCount="indefinite" />
                </circle>
              )) : null}
              <circle r={9} fill={l.fixing > 0 ? '#f59e0b' : on ? '#ef4444' : '#fca5a5'} stroke="#fff" strokeWidth={2} />
              {l.fixing > 0 && <text y={-14} textAnchor="middle" fontSize={18}>🔧</text>}
            </g>
          )
        })}
        <rect ref={soak} width={W} height={H} fill="#3b82f6" opacity={0} pointerEvents="none" />
        <g transform="translate(560 40)">
          <text fontSize={12} fill="#334155">damage</text>
          <rect y={6} width={180} height={8} rx={4} fill="#e2e8f0" /><rect y={6} width={Math.min(180, s.damage * 2)} height={8} rx={4} fill="#3b82f6" />
          <text y={32} fontSize={12} fill="#334155">grumbles</text>
          <rect y={38} width={180} height={8} rx={4} fill="#e2e8f0" /><rect y={38} width={Math.min(180, s.grumble * 2)} height={8} rx={4} fill="#f97316" />
        </g>
      </svg>
    </GameShell>
  )
}
