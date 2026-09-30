import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Label Detective: the print on the back of the pack is tiny. Sweep the
 * magnifying glass over it and click every sugar in disguise before the
 * shopper moves on. Five packs, each hiding sweeteners under other names.
 */
const W = 800, H = 480
const SECS = 22
const SUGARS = ['sugar', 'glucose syrup', 'dextrose', 'maltose', 'fructose', 'honey', 'cane juice', 'invert syrup', 'maltodextrin', 'agave nectar', 'rice syrup', 'sucrose', 'corn syrup', 'molasses', 'fruit juice concentrate', 'caramel']
const PLAIN = ['oats', 'wheat flour', 'salt', 'sunflower oil', 'milk powder', 'cocoa', 'raising agent', 'emulsifier', 'natural flavouring', 'barley malt extract', 'rolled oats', 'almonds', 'dried apple', 'cinnamon', 'vitamin D', 'iron', 'rice flour', 'water', 'yeast', 'vanilla', 'palm oil', 'peanuts', 'soy lecithin', 'whey powder', 'citric acid', 'pectin', 'tomato purée', 'vinegar', 'spices', 'onion powder']
const PACKS = [
  { name: 'Crunchy Granola', color: '#e9a23b' },
  { name: 'Fruity Yoghurt', color: '#f28ab2' },
  { name: 'Tomato Ketchup', color: '#d9362b' },
  { name: '“Healthy” Cereal Bar', color: '#6bbf59' },
  { name: 'Morning Muesli', color: '#8c6bd6' },
]
type Word = { text: string; sugar: boolean; x: number; y: number; w: number; found: boolean }

const layout = (): Word[] => {
  const n = 4 + Math.floor(Math.random() * 3)
  const sugars = [...SUGARS].sort(() => Math.random() - 0.5).slice(0, n)
  const plain = [...PLAIN].sort(() => Math.random() - 0.5).slice(0, 26)
  const all = [...sugars.map((t) => ({ t, s: true })), ...plain.map((t) => ({ t, s: false }))].sort(() => Math.random() - 0.5)
  const words: Word[] = []
  let x = 270, y = 150
  for (const { t, s } of all) {
    const text = `${t},`
    const w = text.length * 2.9 + 4
    if (x + w > 560) { x = 270; y += 10 }
    words.push({ text, sugar: s, x, y, w, found: false })
    x += w
  }
  return words
}

export default function LabelDetective() {
  const [best, submit] = useBest('labels')
  const [pack, setPack] = useState(0)
  const [words, setWords] = useState<Word[]>(layout)
  const [lens, setLens] = useState({ x: 400, y: 200 })
  const [time, setTime] = useState(SECS)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ pack: 0, t: SECS, score: 0, found: 0, missed: 0, wrong: 0, running: true })
  const svg = useRef<SVGSVGElement>(null)
  const box = useRef<SVGGElement>(null)
  const wordsRef = useRef<Word[]>(words)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const nextPack = useCallback(() => {
    const s = st.current
    s.missed += wordsRef.current.filter((w) => w.sugar && !w.found).length
    if (s.pack >= PACKS.length - 1) {
      s.running = false
      const record = submitRef.current(s.score)
      setResult({ headline: 'Case closed', lines: [`${s.found} hidden sugars spotted`, `${s.missed} slipped past`, `${s.wrong} false alarms`, `Score ${s.score}`], record })
      return
    }
    s.pack++; s.t = SECS
    const w = layout(); wordsRef.current = w
    setWords(w); setPack(s.pack)
    if (box.current && !reducedMotion()) gsap.fromTo(box.current, { x: 400, rotation: 10 }, { x: 0, rotation: 0, duration: 0.5, ease: 'back.out(1.4)' })
  }, [])

  useEffect(() => {
    st.current = { pack: 0, t: SECS, score: 0, found: 0, missed: 0, wrong: 0, running: true }
    const w = layout(); wordsRef.current = w
    setWords(w); setPack(0); setScore(0)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        setTime(Math.max(0, Math.ceil(s.t)))
        if (s.t <= 0 || wordsRef.current.filter((x) => x.sugar).every((x) => x.found)) {
          if (s.t > 0) s.score += Math.ceil(s.t) * 2
          setScore(s.score)
          nextPack()
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, nextPack])

  const pt = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 }
  }
  const click = (e: React.PointerEvent) => {
    const s = st.current
    if (!s.running) return
    const p = pt(e)
    const w = wordsRef.current.find((x) => p.x >= x.x && p.x <= x.x + x.w && Math.abs(p.y - (x.y - 2)) < 5)
    if (!w || w.found) return
    if (w.sugar) { w.found = true; s.found++; s.score += 15 } else { s.wrong++; s.score = Math.max(0, s.score - 5) }
    setScore(s.score)
    setWords([...wordsRef.current])
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const P = PACKS[pack]
  const left = words.filter((w) => w.sugar && !w.found).length
  const Z = 3
  return (
    <GameShell title="Label Detective" score={score} best={best} result={result} onRestart={restart}
      hint={`Pack ${pack + 1}/${PACKS.length}: ${P.name} · sweep the glass and click sugars in disguise · ${left} still hiding · ${time}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={(e) => setLens(pt(e))} onPointerDown={click} role="img" aria-label="Food packet label" style={{ cursor: 'none' }}>
        <defs>
          <clipPath id="ld-lens"><circle cx={lens.x} cy={lens.y} r={70} /></clipPath>
        </defs>
        <rect width={W} height={H} fill="#f3efe8" />
        <rect x={0} y={400} width={W} height={80} fill="#d8cfc0" />
        <g ref={box}>
          <rect x={240} y={60} width={340} height={360} rx={10} fill={P.color} />
          <rect x={255} y={120} width={310} height={210} rx={6} fill="#fffdf6" />
          <text x={410} y={100} textAnchor="middle" fontWeight={900} fontSize={22} fill="#fff">{P.name}</text>
          <text x={270} y={138} fontWeight={800} fontSize={8} fill="#333">INGREDIENTS:</text>
          {words.map((w, i) => <text key={i} x={w.x} y={w.y} fontSize={5} fill="#555">{w.text}</text>)}
          <rect x={270} y={345} width={140} height={60} fill="#fff" />
          <text x={280} y={362} fontSize={9} fill="#333" fontWeight={700}>Nutrition per 100g</text>
          {Array.from({ length: 3 }, (_, i) => <rect key={i} x={280} y={370 + i * 10} width={120} height={4} fill="#ddd" />)}
        </g>
        {/* The lens magnifies the label around the pointer. */}
        <g clipPath="url(#ld-lens)" pointerEvents="none">
          <circle cx={lens.x} cy={lens.y} r={70} fill="#fffdf6" />
          <g transform={`translate(${lens.x} ${lens.y}) scale(${Z}) translate(${-lens.x} ${-lens.y})`}>
            <rect x={255} y={120} width={310} height={210} fill="#fffdf6" />
            {words.map((w, i) => (
              <g key={i}>
                {w.found && <rect x={w.x - 1} y={w.y - 5.5} width={w.w - 2} height={7} rx={1.5} fill="#fde047" />}
                <text x={w.x} y={w.y} fontSize={5} fill="#222">{w.text}</text>
              </g>
            ))}
          </g>
        </g>
        {words.filter((w) => w.found).map((w, i) => <rect key={i} x={w.x - 1} y={w.y - 8} width={w.w - 2} height={10} rx={2} fill="#fde047" opacity={0.6} pointerEvents="none" />)}
        <g pointerEvents="none">
          <circle cx={lens.x} cy={lens.y} r={70} fill="none" stroke="#3f3a36" strokeWidth={8} />
          <circle cx={lens.x} cy={lens.y} r={70} fill="none" stroke="#fff" strokeWidth={2} opacity={0.6} />
          <line x1={lens.x + 50} y1={lens.y + 50} x2={lens.x + 110} y2={lens.y + 110} stroke="#3f3a36" strokeWidth={14} strokeLinecap="round" />
          <circle cx={lens.x} cy={lens.y} r={3} fill="#e11d48" />
        </g>
        <g transform="translate(30 60)">
          <text fontSize={13} fill="#6b5b4a" fontWeight={700}>Spotted</text>
          {words.filter((w) => w.found).map((w, i) => <text key={i} y={22 + i * 18} fontSize={13} fill="#a16207">🔍 {w.text.replace(',', '')}</text>)}
        </g>
      </svg>
    </GameShell>
  )
}
