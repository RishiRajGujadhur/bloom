import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Allergy Chef: dishes glide out of the kitchen on a belt, each showing what's
 * in it. Guests wear little badges for what they can't eat. Tap a dish, then
 * tap a guest to serve them. Everyone happy and fed beats everyone fed fast.
 */
type Tag = 'nut' | 'gluten' | 'dairy' | 'shellfish' | 'egg'
const TAGS: Record<Tag, string> = { nut: '🥜', gluten: '🌾', dairy: '🥛', shellfish: '🦐', egg: '🥚' }
const DISHES: { name: string; glyph: string; has: Tag[] }[] = [
  { name: 'Pad thai', glyph: '🍜', has: ['nut', 'shellfish', 'egg'] },
  { name: 'Margherita', glyph: '🍕', has: ['gluten', 'dairy'] },
  { name: 'Fruit salad', glyph: '🍓', has: [] },
  { name: 'Risotto', glyph: '🍚', has: ['dairy'] },
  { name: 'Satay skewers', glyph: '🍢', has: ['nut'] },
  { name: 'Prawn curry', glyph: '🍛', has: ['shellfish'] },
  { name: 'Veg soup', glyph: '🥣', has: [] },
  { name: 'Omelette', glyph: '🍳', has: ['egg', 'dairy'] },
  { name: 'Sourdough', glyph: '🥖', has: ['gluten'] },
  { name: 'Grilled fish', glyph: '🐟', has: [] },
  { name: 'Cheesecake', glyph: '🍰', has: ['dairy', 'gluten', 'egg'] },
  { name: 'Salad bowl', glyph: '🥗', has: ['nut'] },
]
const FACES = ['👩', '🧔', '👵', '🧒', '👨', '👱', '🧑', '👧']
const W = 820, H = 480
const TIME = 80
type Guest = { id: number; face: string; avoid: Tag[]; seat: number; wait: number; state: 'hungry' | 'happy' | 'itchy' }
type Plate = { id: number; d: typeof DISHES[number]; x: number }

export default function AllergyChef() {
  const [best, submit] = useBest('allergy')
  const [, frame] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ guests: [] as Guest[], plates: [] as Plate[], t: TIME, score: 0, happy: 0, itchy: 0, left: 0, running: true, id: 1, nextG: 0, nextP: 0 })
  const els = useRef(new Map<number, SVGGElement>())
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { guests: [], plates: [], t: TIME, score: 0, happy: 0, itchy: 0, left: 0, running: true, id: 1, nextG: 0, nextP: 0 }
    setSel(null)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        s.nextG -= dt; s.nextP -= dt
        const free = [0, 1, 2, 3, 4].filter((i) => !s.guests.some((g) => g.seat === i))
        if (s.nextG <= 0 && free.length) {
          const n = Math.random() < 0.3 ? 2 : 1
          const avoid = [...(Object.keys(TAGS) as Tag[])].sort(() => Math.random() - 0.5).slice(0, n)
          s.guests.push({ id: s.id++, face: FACES[Math.floor(Math.random() * FACES.length)], avoid, seat: free[Math.floor(Math.random() * free.length)], wait: 0, state: 'hungry' })
          s.nextG = 3.2
        }
        if (s.nextP <= 0) { s.plates.push({ id: s.id++, d: DISHES[Math.floor(Math.random() * DISHES.length)], x: -60 }); s.nextP = 1.6 }
        for (const p of s.plates) p.x += 70 * dt
        s.plates = s.plates.filter((p) => p.x < W + 60)
        for (const g of s.guests) {
          if (g.state === 'hungry') { g.wait += dt; if (g.wait > 16) { g.state = 'itchy'; s.left++; g.wait = 0 } }
          else { g.wait += dt }
        }
        s.guests = s.guests.filter((g) => g.state === 'hungry' || g.wait < 1.6)
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Service over', lines: [`${s.happy} happy, safe guests`, `${s.itchy} dishes they shouldn't have had`, `${s.left} left hungry`, `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const serve = (g: Guest) => {
    const s = st.current
    if (sel === null || g.state !== 'hungry' || !s.running) return
    const p = s.plates.find((x) => x.id === sel)
    if (!p) { setSel(null); return }
    s.plates = s.plates.filter((x) => x !== p)
    const bad = p.d.has.some((t) => g.avoid.includes(t))
    const el = els.current.get(g.id)
    if (bad) { g.state = 'itchy'; s.itchy++; s.score = Math.max(0, s.score - 15); if (el && !reducedMotion()) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)' }) }
    else { g.state = 'happy'; s.happy++; s.score += 10 + Math.max(0, Math.round(10 - g.wait)); if (el && !reducedMotion()) gsap.fromTo(el, { y: -14 }, { y: 0, duration: 0.5, ease: 'bounce.out' }) }
    g.wait = 0
    setSel(null)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  return (
    <GameShell title="Allergy Chef" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Tap a dish on the belt, then a guest · badges show what they can't have · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Restaurant belt and guests">
        <rect width={W} height={H} fill="#fdf2f8" />
        <rect y={60} width={W} height={120} fill="#e5e7eb" />
        <rect y={70} width={W} height={100} fill="#9ca3af" />
        {Array.from({ length: 20 }, (_, i) => <line key={i} x1={((i * 50 + performance.now() * 0.07) % (W + 50)) - 25} x2={((i * 50 + performance.now() * 0.07) % (W + 50)) - 25} y1={72} y2={168} stroke="#6b7280" strokeWidth={2} />)}
        <text x={14} y={46} fontSize={13} fontWeight={800} fill="#831843">🍳 kitchen →</text>
        {s.plates.map((p) => (
          <g key={p.id} transform={`translate(${p.x} 120)`} onPointerDown={() => setSel(p.id)} style={{ cursor: 'pointer' }}>
            <circle r={40} fill="#fff" stroke={sel === p.id ? '#db2777' : '#d1d5db'} strokeWidth={sel === p.id ? 5 : 2} />
            <text textAnchor="middle" dominantBaseline="central" y={-6} fontSize={34}>{p.d.glyph}</text>
            <text textAnchor="middle" y={28} fontSize={13}>{p.d.has.map((t) => TAGS[t]).join('') || '✓'}</text>
          </g>
        ))}
        <rect y={330} width={W} height={24} fill="#a16207" />
        {[0, 1, 2, 3, 4].map((i) => {
          const g = s.guests.find((x) => x.seat === i)
          const x = 90 + i * 160
          return (
            <g key={i}>
              <rect x={x - 50} y={354} width={100} height={12} fill="#78350f" />
              {g && (
                <g ref={(el) => { if (el) els.current.set(g.id, el) }} onPointerDown={() => serve(g)} style={{ cursor: sel !== null && g.state === 'hungry' ? 'pointer' : 'default' }}>
                  <text x={x} y={300} textAnchor="middle" fontSize={54}>{g.state === 'itchy' ? '🤧' : g.state === 'happy' ? '😋' : g.face}</text>
                  <g transform={`translate(${x} 230)`}>
                    <rect x={-38} y={-18} width={76} height={30} rx={15} fill="#fff" stroke="#f472b6" />
                    <text textAnchor="middle" y={4} fontSize={15}>{g.avoid.map((t) => `🚫${TAGS[t]}`).join(' ')}</text>
                  </g>
                  {g.state === 'hungry' && <rect x={x - 36} y={316} width={72 * Math.max(0, 1 - g.wait / 16)} height={6} rx={3} fill={g.wait > 11 ? '#ef4444' : '#22c55e'} />}
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </GameShell>
  )
}
