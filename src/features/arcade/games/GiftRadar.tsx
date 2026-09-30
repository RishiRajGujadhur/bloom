import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Gift Radar: a friend's birthday is coming. Spend the week with them — little
 * things they say float up for a moment. Tap the ones that feel like hints to
 * jot them in your notebook. Then it's off to the shop: the perfect gift
 * isn't the priciest one, it's the one that shows you were listening.
 */
type Hint = { text: string; tag: string }
type Friend = { name: string; face: string; hints: Hint[] }
const FRIENDS: Friend[] = [
  { name: 'Maya', face: '👩', hints: [{ text: 'My hands are always freezing on the bus', tag: 'cold' }, { text: 'I killed another plant, sigh', tag: 'plants' }, { text: 'I keep humming that jazz song', tag: 'jazz' }] },
  { name: 'Leo', face: '🧔', hints: [{ text: 'My old mug finally cracked', tag: 'tea' }, { text: 'I want to get back into drawing', tag: 'art' }, { text: 'Can never find my keys', tag: 'keys' }] },
  { name: 'Gran', face: '👵', hints: [{ text: 'The crossword print is so tiny', tag: 'reading' }, { text: 'Birds love my garden this spring', tag: 'birds' }, { text: 'My feet get chilly at night', tag: 'cold' }] },
]
const FILLER = ['Traffic was awful today', 'Did you see the match?', 'This weather, honestly', 'Work was fine I guess', 'I had pasta for lunch', 'My phone needs charging', 'Lovely sunset tonight']
const GIFTS: { name: string; glyph: string; price: number; tags: string[] }[] = [
  { name: 'Fleecy gloves', glyph: '🧤', price: 12, tags: ['cold'] }, { name: 'Unkillable cactus', glyph: '🌵', price: 8, tags: ['plants'] },
  { name: 'Jazz vinyl', glyph: '💿', price: 20, tags: ['jazz'] }, { name: 'Handmade mug', glyph: '☕', price: 14, tags: ['tea'] },
  { name: 'Sketchbook & pens', glyph: '✏️', price: 16, tags: ['art'] }, { name: 'Key finder tag', glyph: '🔑', price: 18, tags: ['keys'] },
  { name: 'Magnifying bookmark', glyph: '🔍', price: 6, tags: ['reading'] }, { name: 'Bird feeder', glyph: '🐦', price: 15, tags: ['birds'] },
  { name: 'Woolly socks', glyph: '🧦', price: 9, tags: ['cold'] }, { name: 'Designer perfume', glyph: '🧴', price: 60, tags: [] },
  { name: 'Giant TV', glyph: '📺', price: 300, tags: [] }, { name: 'Gold watch', glyph: '⌚', price: 150, tags: [] },
]
const W = 800, H = 480
const WEEK = 22

export default function GiftRadar() {
  const [best, submit] = useBest('gifts')
  const [fi, setFi] = useState(0)
  const [phase, setPhase] = useState<'week' | 'shop'>('week')
  const [bubbles, setBubbles] = useState<{ id: number; text: string; tag: string | null; x: number }[]>([])
  const [notes, setNotes] = useState<{ text: string; tag: string | null }[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [time, setTime] = useState(WEEK)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const els = useRef(new Map<number, SVGGElement>())
  const st = useRef({ score: 0, lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, lines: [] }; setScore(0); setFi(0) }, [round])

  useEffect(() => {
    if (phase !== 'week') return
    setNotes([]); setPicked([]); setBubbles([]); setTime(WEEK)
    const f = FRIENDS[fi]
    const queue = [...f.hints.map((h) => ({ text: h.text, tag: h.tag as string | null })), ...[...FILLER].sort(() => Math.random() - 0.5).slice(0, 6).map((t) => ({ text: t, tag: null as string | null }))].sort(() => Math.random() - 0.5)
    let id = 1, i = 0
    const spawn = window.setInterval(() => {
      if (i >= queue.length) return
      const q = queue[i++]
      const b = { id: id++, text: q.text, tag: q.tag, x: 120 + Math.random() * 480 }
      setBubbles((bs) => [...bs, b])
      window.setTimeout(() => setBubbles((bs) => bs.filter((x) => x.id !== b.id)), 3600)
    }, 2200)
    const t0 = performance.now()
    const tick = window.setInterval(() => {
      const left = Math.max(0, WEEK - Math.floor((performance.now() - t0) / 1000))
      setTime(left)
      if (left <= 0) { setPhase('shop'); clearInterval(tick) }
    }, 250)
    return () => { clearInterval(spawn); clearInterval(tick) }
  }, [phase, fi, round])

  const mount = (id: number, el: SVGGElement | null) => {
    if (!el || els.current.has(id)) return
    els.current.set(id, el)
    if (!reducedMotion()) gsap.fromTo(el, { y: 40, opacity: 0 }, { y: -30, opacity: 1, duration: 3.4, ease: 'none' })
  }
  const jot = (b: { id: number; text: string; tag: string | null }) => {
    if (notes.some((n) => n.text === b.text)) return
    setNotes((n) => [...n, { text: b.text, tag: b.tag }])
    setBubbles((bs) => bs.filter((x) => x.id !== b.id))
  }
  const pick = (name: string) => {
    if (phase !== 'shop') return
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : p.length < 2 ? [...p, name] : p))
  }
  const give = () => {
    const f = FRIENDS[fi]
    const tags = new Set(f.hints.map((h) => h.tag))
    const gifts = GIFTS.filter((g) => picked.includes(g.name))
    const matched = gifts.filter((g) => g.tags.some((t) => tags.has(t))).length
    const spent = gifts.reduce((n, g) => n + g.price, 0)
    const noted = notes.filter((n) => n.tag).length
    const pts = matched * 30 + noted * 5 - Math.max(0, spent - 40) / 5 - notes.filter((n) => !n.tag).length * 2
    const s = st.current
    s.score += Math.max(0, Math.round(pts)); setScore(s.score)
    s.lines.push(`${f.name}: ${matched === gifts.length && matched ? 'loved it 🥰' : matched ? 'liked it 🙂' : 'polite smile 😐'} (£${spent})`)
    if (fi + 1 >= FRIENDS.length) {
      const record = submitRef.current(s.score)
      setResult({ headline: 'Birthday season done', lines: [...s.lines, `Score ${s.score}`], record })
    } else { els.current.clear(); setFi(fi + 1); setPhase('week') }
  }
  const restart = useCallback(() => { els.current.clear(); setResult(null); setPhase('week'); setRound((r) => r + 1) }, [])
  const f = FRIENDS[fi]
  return (
    <GameShell title="Gift Radar" score={score} best={best} result={result} onRestart={restart}
      hint={phase === 'week' ? `A week with ${f.name} · tap anything that sounds like a hint · shop in ${time}s` : `Pick up to two gifts for ${f.name}, then give them`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Friend and shop">
        <rect width={W} height={H} fill={phase === 'week' ? '#ecfeff' : '#fff7ed'} />
        {phase === 'week' ? (
          <>
            <text x={400} y={440} textAnchor="middle" fontSize={80}>{f.face}</text>
            {bubbles.map((b) => (
              <g key={b.id} ref={(el) => mount(b.id, el)} onPointerDown={() => jot(b)} style={{ cursor: 'pointer' }}>
                <foreignObject x={b.x - 110} y={250} width={220} height={70}><div className="gr-bubble">{b.text}</div></foreignObject>
              </g>
            ))}
          </>
        ) : (
          <>
            <text x={20} y={34} fontSize={16} fontWeight={800} fill="#7c2d12">Gift shop</text>
            {GIFTS.map((g, i) => {
              const x = 30 + (i % 4) * 135, y = 50 + Math.floor(i / 4) * 140
              const on = picked.includes(g.name)
              return (
                <g key={g.name} transform={`translate(${x} ${y})`} onPointerDown={() => pick(g.name)} style={{ cursor: 'pointer' }}>
                  <rect width={122} height={126} rx={14} fill={on ? '#fed7aa' : '#fff'} stroke={on ? '#ea580c' : '#fdba74'} strokeWidth={on ? 3 : 1.5} />
                  <text x={61} y={58} textAnchor="middle" fontSize={40}>{g.glyph}</text>
                  <text x={61} y={90} textAnchor="middle" fontSize={11} fontWeight={700} fill="#431407">{g.name}</text>
                  <text x={61} y={110} textAnchor="middle" fontSize={12} fill="#9a3412">£{g.price}</text>
                </g>
              )
            })}
          </>
        )}
        <g transform="translate(575 40)">
          <rect width={210} height={phase === 'week' ? 200 : 300} rx={10} fill="#fefce8" stroke="#eab308" />
          <text x={12} y={24} fontSize={13} fontWeight={800} fill="#713f12">📓 notebook</text>
          {notes.map((n, i) => <foreignObject key={i} x={10} y={34 + i * 38} width={190} height={36}><div className="gr-note">{n.text}</div></foreignObject>)}
          {phase === 'shop' && (
            <g transform="translate(40 250)" onPointerDown={give} style={{ cursor: picked.length ? 'pointer' : 'default' }} opacity={picked.length ? 1 : 0.4}>
              <rect width={130} height={38} rx={19} fill="#ea580c" />
              <text x={65} y={25} textAnchor="middle" fontWeight={800} fill="#fff">🎁 Give</text>
            </g>
          )}
        </g>
      </svg>
    </GameShell>
  )
}
