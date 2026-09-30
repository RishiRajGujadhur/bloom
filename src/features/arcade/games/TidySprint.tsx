import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Tidy Sprint: the room's a tip and guests are on their way. Drag each thing
 * to its home — every home shows a faint outline of what lives there. Things
 * put straight away in one go earn a "one touch" bonus. Three rooms.
 */
type Home = { id: string; label: string; x: number; y: number; w: number; h: number; color: string }
type Thing = { id: number; glyph: string; home: string; x: number; y: number; r: number; touches: number; done: boolean }
const W = 820, H = 500
const HOMES: Home[] = [
  { id: 'shelf', label: 'Bookshelf', x: 30, y: 40, w: 180, h: 110, color: '#a16207' },
  { id: 'hooks', label: 'Coat hooks', x: 250, y: 30, w: 170, h: 70, color: '#475569' },
  { id: 'basket', label: 'Laundry', x: 640, y: 40, w: 150, h: 110, color: '#0ea5e9' },
  { id: 'drawer', label: 'Desk drawer', x: 620, y: 360, w: 170, h: 110, color: '#7c3aed' },
  { id: 'toybox', label: 'Toy box', x: 30, y: 360, w: 170, h: 110, color: '#e11d48' },
  { id: 'bin', label: 'Bin', x: 460, y: 30, w: 120, h: 80, color: '#16a34a' },
]
const THINGS: { glyph: string; home: string }[] = [
  { glyph: '📚', home: 'shelf' }, { glyph: '📖', home: 'shelf' }, { glyph: '📓', home: 'shelf' },
  { glyph: '🧥', home: 'hooks' }, { glyph: '🧢', home: 'hooks' }, { glyph: '👜', home: 'hooks' },
  { glyph: '🧦', home: 'basket' }, { glyph: '👕', home: 'basket' }, { glyph: '👖', home: 'basket' },
  { glyph: '✏️', home: 'drawer' }, { glyph: '🔋', home: 'drawer' }, { glyph: '🔑', home: 'drawer' }, { glyph: '✂️', home: 'drawer' },
  { glyph: '🧸', home: 'toybox' }, { glyph: '🎲', home: 'toybox' }, { glyph: '🎈', home: 'toybox' }, { glyph: '⚽', home: 'toybox' },
  { glyph: '🥤', home: 'bin' }, { glyph: '🍌', home: 'bin' }, { glyph: '📦', home: 'bin' },
]
const ROOMS = 3
const SECS = 35

export default function TidySprint() {
  const [best, submit] = useBest('tidy')
  const [things, setThings] = useState<Thing[]>([])
  const [room, setRoom] = useState(0)
  const [time, setTime] = useState(SECS)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null)
  const homeEls = useRef(new Map<string, SVGGElement>())
  const st = useRef({ room: 0, t: SECS, score: 0, oneTouch: 0, total: 0, left: 0, running: true })
  const thingsRef = useRef<Thing[]>([])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const scatter = (n: number): Thing[] => {
    const pool = [...THINGS].sort(() => Math.random() - 0.5).slice(0, n)
    return pool.map((t, i) => ({ id: i + 1, ...t, x: 240 + Math.random() * 340, y: 170 + Math.random() * 190, r: (Math.random() - 0.5) * 60, touches: 0, done: false }))
  }
  const load = useCallback((r: number) => {
    const t = scatter(10 + r * 4)
    thingsRef.current = t
    setThings(t); setRoom(r)
    st.current.room = r; st.current.t = SECS
  }, [])

  useEffect(() => {
    st.current = { room: 0, t: SECS, score: 0, oneTouch: 0, total: 0, left: 0, running: true }
    setScore(0)
    load(0)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        setTime(Math.max(0, Math.ceil(s.t)))
        const allDone = thingsRef.current.length > 0 && thingsRef.current.every((x) => x.done)
        if (allDone || s.t <= 0) {
          s.left += thingsRef.current.filter((x) => !x.done).length
          if (allDone) s.score += Math.ceil(s.t) * 3
          setScore(s.score)
          if (s.room >= ROOMS - 1) {
            s.running = false
            const record = submitRef.current(s.score)
            setResult({ headline: s.left ? 'Guests are here!' : 'Spotless! ✨', lines: [`${s.total} things put away`, `${s.oneTouch} in one touch`, `${s.left} left lying around`, `Score ${s.score}`], record })
          } else load(s.room + 1)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, load])

  const pt = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 }
  }
  const grab = (e: React.PointerEvent, t: Thing) => {
    if (t.done || !st.current.running) return
    const p = pt(e)
    drag.current = { id: t.id, dx: p.x - t.x, dy: p.y - t.y }
    t.touches++
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const p = pt(e)
    thingsRef.current = thingsRef.current.map((x) => (x.id === d.id ? { ...x, x: p.x - d.dx, y: p.y - d.dy, r: 0 } : x))
    setThings(thingsRef.current)
  }
  const drop = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const s = st.current
    const t = thingsRef.current.find((x) => x.id === d.id)!
    const home = HOMES.find((h) => t.x > h.x && t.x < h.x + h.w && t.y > h.y && t.y < h.y + h.h)
    if (!home) return
    const el = homeEls.current.get(home.id)
    if (home.id === t.home) {
      const inHome = thingsRef.current.filter((x) => x.done && x.home === home.id).length
      const tx = home.x + 22 + (inHome % 5) * 32, ty = home.y + home.h - 22 - Math.floor(inHome / 5) * 28
      thingsRef.current = thingsRef.current.map((x) => (x.id === t.id ? { ...x, done: true, x: tx, y: ty } : x))
      s.total++; s.score += t.touches === 1 ? 15 : 8
      if (t.touches === 1) s.oneTouch++
      if (el && !reducedMotion()) gsap.fromTo(el, { scale: 1.06 }, { scale: 1, duration: 0.35, ease: 'back.out(3)', svgOrigin: `${home.x + home.w / 2} ${home.y + home.h / 2}` })
    } else {
      s.score = Math.max(0, s.score - 3)
      if (el && !reducedMotion()) gsap.fromTo(el, { x: -5 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
      thingsRef.current = thingsRef.current.map((x) => (x.id === t.id ? { ...x, x: 400 + (Math.random() - 0.5) * 200, y: 280 + (Math.random() - 0.5) * 100 } : x))
    }
    setThings(thingsRef.current); setScore(s.score)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const left = things.filter((t) => !t.done).length
  return (
    <GameShell title="Tidy Sprint" score={score} best={best} result={result} onRestart={restart}
      hint={`Room ${room + 1}/${ROOMS} · drag things to their homes · ${left} left · guests in ${time}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerUp={drop} role="img" aria-label="Messy room" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#fdf6ec" />
        <ellipse cx={410} cy={270} rx={200} ry={110} fill="#f4d9c6" opacity={0.7} />
        {HOMES.map((h) => {
          const kinds = THINGS.filter((t) => t.home === h.id)
          return (
            <g key={h.id} ref={(el) => { if (el) homeEls.current.set(h.id, el) }}>
              <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={12} fill="#fff" stroke={h.color} strokeWidth={4} />
              <text x={h.x + h.w / 2} y={h.y + 18} textAnchor="middle" fontSize={12} fontWeight={800} fill={h.color}>{h.label}</text>
              {kinds.slice(0, 4).map((k, i) => <text key={i} x={h.x + 20 + i * 34} y={h.y + 50} fontSize={22} opacity={0.14}>{k.glyph}</text>)}
            </g>
          )
        })}
        {things.map((t) => (
          <g key={t.id} transform={`translate(${t.x} ${t.y}) rotate(${t.r})`} onPointerDown={(e) => grab(e, t)} style={{ cursor: t.done ? 'default' : 'grab' }} opacity={t.done ? 0.9 : 1}>
            {!t.done && <circle r={24} fill="#ffffffaa" />}
            <text textAnchor="middle" dominantBaseline="central" fontSize={t.done ? 22 : 32}>{t.glyph}</text>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
