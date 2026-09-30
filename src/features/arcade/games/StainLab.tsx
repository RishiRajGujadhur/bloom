import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Stain Lab: a basket of stained clothes. For each one, pick the treatment —
 * cold water, dish soap, white vinegar, bicarbonate paste, or blotting — then
 * dab it on. The right treatment lifts the stain; the wrong one sets it
 * (hot water on blood, rubbing red wine). Eight garments.
 */
const TREAT = [
  { id: 'cold', label: 'Cold water', glyph: '💧' }, { id: 'soap', label: 'Dish soap', glyph: '🧴' }, { id: 'vinegar', label: 'White vinegar', glyph: '🍶' },
  { id: 'bicarb', label: 'Bicarb paste', glyph: '🥣' }, { id: 'blot', label: 'Blot, don’t rub', glyph: '🧻' }, { id: 'hot', label: 'Hot water', glyph: '♨️' },
]
const STAINS = [
  { name: 'Grass on jeans', color: '#16a34a', fix: 'vinegar', cloth: '#3b5ba5' }, { name: 'Pasta sauce on a shirt', color: '#dc2626', fix: 'soap', cloth: '#f8fafc' },
  { name: 'Blood on a pillowcase', color: '#7f1d1d', fix: 'cold', cloth: '#fef3c7' }, { name: 'Red wine on a tablecloth', color: '#7e22ce', fix: 'blot', cloth: '#f8fafc' },
  { name: 'Grease on a tee', color: '#a16207', fix: 'soap', cloth: '#fda4af' }, { name: 'Sweat marks on a shirt', color: '#eab308', fix: 'bicarb', cloth: '#e0f2fe' },
  { name: 'Coffee on a jumper', color: '#78350f', fix: 'cold', cloth: '#d9f99d' }, { name: 'Musty smell in a towel', color: '#6b7280', fix: 'vinegar', cloth: '#a5f3fc' },
]
const W = 800, H = 440

export default function StainLab() {
  const [best, submit] = useBest('stains')
  const [order] = useState(() => [...STAINS].sort(() => Math.random() - 0.5))
  const [i, setI] = useState(0)
  const [treat, setTreat] = useState<string | null>(null)
  const [fade, setFade] = useState(1)
  const [msg, setMsg] = useState('Pick a treatment, then dab the stain.')
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const stain = useRef<SVGGElement>(null)
  const st = useRef({ score: 0, right: 0, set: [] as string[], busy: false })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, right: 0, set: [], busy: false }; setI(0); setTreat(null); setFade(1); setScore(0); setMsg('Pick a treatment, then dab the stain.') }, [round])
  const S = order[i % order.length]

  const dab = () => {
    const s = st.current
    if (!treat || s.busy) return
    s.busy = true
    const ok = treat === S.fix
    const o = { f: 1 }
    const done = () => {
      if (ok) { s.right++; s.score += 15; setMsg(`${S.name}: gone! ✨`) } else { s.set.push(S.name.toLowerCase()); s.score = Math.max(0, s.score - 5); setMsg(treat === 'hot' ? 'Hot water set it in 😬' : 'Hmm, that just spread it around.') }
      setScore(s.score)
      setTimeout(() => {
        if (i + 1 >= order.length) { const record = submitRef.current(s.score); setResult({ headline: 'Laundry rescued', lines: [`${s.right} of ${order.length} stains lifted`, s.set.length ? `Set for good: ${s.set.join(', ')}` : 'No stains set!', `Score ${s.score}`], record }) }
        else { setI(i + 1); setTreat(null); setFade(1); setMsg('Pick a treatment, then dab the stain.'); s.busy = false }
      }, 1200)
    }
    if (reducedMotion()) { setFade(ok ? 0 : 1.3); done(); return }
    gsap.to(o, { f: ok ? 0 : 1.3, duration: 1, onUpdate: () => setFade(o.f), onComplete: done })
    if (stain.current) gsap.fromTo(stain.current, { scale: 1 }, { scale: ok ? 0.6 : 1.25, duration: 1, transformOrigin: '50% 50%' })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Stain Lab" score={score} best={best} result={result} onRestart={restart}
      hint={`${i + 1}/${order.length}: ${S.name} · ${msg}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Stained garment" onPointerDown={dab} style={{ cursor: treat ? 'pointer' : 'default' }}>
        <rect width={W} height={H} fill="#f5f5f4" />
        <path d="M250 60 L330 40 Q400 80 470 40 L550 60 L640 150 L580 200 L550 170 L550 400 L250 400 L250 170 L220 200 L160 150 Z" fill={S.cloth} stroke="#a8a29e" strokeWidth={3} />
        <g ref={stain}>
          {Array.from({ length: 7 }, (_, k) => <ellipse key={k} cx={400 + Math.cos(k * 1.3) * 26 * Math.min(1.3, fade + 0.2)} cy={240 + Math.sin(k * 1.7) * 20} rx={30 * Math.max(0.05, fade)} ry={22 * Math.max(0.05, fade)} fill={S.color} opacity={Math.min(0.85, fade * 0.7)} />)}
        </g>
        {treat && <text x={620} y={330} fontSize={60}>{TREAT.find((t) => t.id === treat)!.glyph}</text>}
      </svg>
      <div className="cf-tray">
        {TREAT.map((t) => <button key={t.id} type="button" className={treat === t.id ? 'on' : ''} onClick={() => setTreat(t.id)}>{t.glyph} {t.label}</button>)}
        <button type="button" className="cf-match" disabled={!treat} onClick={dab}>🧽 Dab it</button>
      </div>
    </GameShell>
  )
}
