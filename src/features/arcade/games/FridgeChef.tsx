import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Fridge Chef: five days, one fridge of odds and ends. Each evening, tap two
 * or three things into the pan and cook — the fridge tells you what they
 * made. Anything whose little counter hits zero goes in the bin, so use the
 * wobbly spinach before the sturdy cheese. A new shop arrives mid-week.
 */
type Food = { id: number; name: string; glyph: string; days: number; tag: string }
const SHOP: Omit<Food, 'id'>[] = [
  { name: 'Eggs', glyph: '🥚', days: 5, tag: 'egg' }, { name: 'Spinach', glyph: '🥬', days: 2, tag: 'veg' }, { name: 'Tomatoes', glyph: '🍅', days: 3, tag: 'veg' },
  { name: 'Cheese', glyph: '🧀', days: 6, tag: 'dairy' }, { name: 'Milk', glyph: '🥛', days: 3, tag: 'dairy' }, { name: 'Chicken', glyph: '🍗', days: 2, tag: 'protein' },
  { name: 'Rice', glyph: '🍚', days: 9, tag: 'carb' }, { name: 'Bread', glyph: '🍞', days: 3, tag: 'carb' }, { name: 'Peppers', glyph: '🌶️', days: 4, tag: 'veg' },
  { name: 'Mushrooms', glyph: '🍄', days: 2, tag: 'veg' }, { name: 'Yoghurt', glyph: '🥣', days: 4, tag: 'dairy' }, { name: 'Tofu', glyph: '🧈', days: 4, tag: 'protein' },
]
const RECIPES: { name: string; glyph: string; needs: string[] }[] = [
  { name: 'Veggie omelette', glyph: '🍳', needs: ['egg', 'veg'] }, { name: 'Cheese toastie', glyph: '🥪', needs: ['carb', 'dairy'] },
  { name: 'Stir-fry', glyph: '🥘', needs: ['protein', 'veg', 'carb'] }, { name: 'Frittata', glyph: '🥧', needs: ['egg', 'dairy', 'veg'] },
  { name: 'Fried rice', glyph: '🍛', needs: ['carb', 'egg'] }, { name: 'Soup', glyph: '🍲', needs: ['veg', 'veg'] }, { name: 'Smoothie', glyph: '🥤', needs: ['dairy', 'veg'] },
]
const W = 800, H = 470
const DAYS = 5

const matchRecipe = (pan: Food[]) => {
  const tags = pan.map((f) => f.tag)
  return RECIPES.filter((r) => { const left = [...tags]; return r.needs.every((n) => { const i = left.indexOf(n); if (i < 0) return false; left.splice(i, 1); return true }) }).sort((a, b) => b.needs.length - a.needs.length)[0] ?? null
}

export default function FridgeChef() {
  const [best, submit] = useBest('fridgechef')
  const [fridge, setFridge] = useState<Food[]>([])
  const [pan, setPan] = useState<Food[]>([])
  const [day, setDay] = useState(1)
  const [msg, setMsg] = useState('Tap 2–3 things into the pan, then cook.')
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const panEl = useRef<SVGGElement>(null)
  const st = useRef({ id: 1, score: 0, meals: [] as string[], wasted: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  const stock = (n: number): Food[] => [...SHOP].sort(() => Math.random() - 0.5).slice(0, n).map((f) => ({ ...f, id: st.current.id++, days: Math.max(1, f.days + Math.floor(Math.random() * 2) - 1) }))
  useEffect(() => { st.current = { id: 1, score: 0, meals: [], wasted: [] }; setFridge(stock(10)); setPan([]); setDay(1); setScore(0); setMsg('Tap 2–3 things into the pan, then cook.') }, [round])

  const tap = (f: Food) => { if (pan.length >= 3) return; setFridge((xs) => xs.filter((x) => x.id !== f.id)); setPan((p) => [...p, f]) }
  const back = (f: Food) => { setPan((p) => p.filter((x) => x.id !== f.id)); setFridge((xs) => [...xs, f]) }
  const cook = () => {
    const s = st.current
    const r = matchRecipe(pan)
    if (pan.length) {
      const urgency = pan.reduce((n, f) => n + Math.max(0, 4 - f.days), 0)
      const pts = r ? 15 + r.needs.length * 5 + urgency * 4 : 3
      s.score += pts; s.meals.push(r ? `${r.glyph} ${r.name}` : '🍽 a strange but edible plate')
      setMsg(r ? `You made ${r.glyph} ${r.name}! (+${pts})` : `Hmm, not a recipe — but you ate it. (+${pts})`)
      if (panEl.current && !reducedMotion()) gsap.fromTo(panEl.current, { rotation: -8 }, { rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)', svgOrigin: '600 320' })
    } else setMsg('Takeaway night…')
    // Overnight: everything ages; spoiled things go in the bin.
    let next = fridge.map((f) => ({ ...f, days: f.days - 1 }))
    const spoiled = next.filter((f) => f.days <= 0)
    if (spoiled.length) { s.wasted.push(...spoiled.map((f) => f.name.toLowerCase())); s.score = Math.max(0, s.score - spoiled.length * 6) }
    next = next.filter((f) => f.days > 0)
    if (day === 2) next = [...next, ...stock(6)]
    setScore(s.score); setPan([]); setFridge(next)
    if (day >= DAYS) {
      const record = submitRef.current(s.score)
      setResult({ headline: s.wasted.length ? 'The week’s cooking is done' : 'Zero waste week! ♻️', lines: [...s.meals.slice(-3), s.wasted.length ? `Binned: ${s.wasted.join(', ')}` : 'Nothing thrown away', `Score ${s.score}`], record })
    } else setDay(day + 1)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const preview = matchRecipe(pan)
  return (
    <GameShell title="Fridge Chef" score={score} best={best} result={result} onRestart={restart}
      hint={`Day ${day}/${DAYS} · counters show days left · ${msg}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Fridge and pan">
        <rect width={W} height={H} fill="#fef9f3" />
        <rect x={30} y={20} width={420} height={430} rx={24} fill="#e0f2fe" stroke="#94a3b8" strokeWidth={4} />
        {[140, 250, 360].map((y) => <rect key={y} x={40} y={y} width={400} height={6} fill="#bae6fd" />)}
        {fridge.map((f, i) => {
          const x = 70 + (i % 5) * 76, y = 90 + Math.floor(i / 5) * 110
          const urgent = f.days <= 1
          return (
            <g key={f.id} transform={`translate(${x} ${y})`} onPointerDown={() => tap(f)} style={{ cursor: 'pointer' }}>
              <circle r={30} fill="#fff" stroke={urgent ? '#ef4444' : f.days <= 2 ? '#f59e0b' : '#cbd5e1'} strokeWidth={urgent ? 4 : 2} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={30}>{f.glyph}</text>
              <g transform="translate(22 -22)">
                <circle r={11} fill={urgent ? '#ef4444' : f.days <= 2 ? '#f59e0b' : '#64748b'} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill="#fff">{f.days}</text>
              </g>
              {urgent && <animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;1 0;-1 0;0 0" dur="0.4s" repeatCount="indefinite" />}
            </g>
          )
        })}
        <g ref={panEl}>
          <ellipse cx={600} cy={330} rx={130} ry={40} fill="#1f2937" />
          <ellipse cx={600} cy={322} rx={112} ry={30} fill="#374151" />
          <rect x={720} y={316} width={70} height={14} rx={6} fill="#1f2937" />
          {pan.map((f, i) => <text key={f.id} x={540 + i * 60} y={328} textAnchor="middle" dominantBaseline="central" fontSize={32} onPointerDown={() => back(f)} style={{ cursor: 'pointer' }}>{f.glyph}</text>)}
        </g>
        <text x={600} y={250} textAnchor="middle" fontSize={16} fontWeight={800} fill="#7c2d12">{pan.length ? (preview ? `→ ${preview.glyph} ${preview.name}` : '→ ???') : 'the pan'}</text>
        <g transform="translate(530 390)" onPointerDown={cook} style={{ cursor: 'pointer' }}>
          <rect width={140} height={44} rx={22} fill="#ea580c" />
          <text x={70} y={28} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">🔥 Cook dinner</text>
        </g>
        <g transform="translate(500 40)">
          <text fontSize={12} fontWeight={800} fill="#7c2d12">Cookbook</text>
          {RECIPES.map((r, i) => <text key={r.name} y={18 + i * 17} fontSize={11} fill="#9a3412">{r.glyph} {r.name}</text>)}
        </g>
      </svg>
    </GameShell>
  )
}
