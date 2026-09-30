import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Echo Talk: a friend is telling you about their day. Pick replies that show
 * you're really listening — reflecting what they said, asking a curious
 * question — and they glow warmer and open up. Replies about yourself, quick
 * fixes or changing the subject make them cool and go quiet.
 */
type Opt = { text: string; warmth: number }
const CHATS: { who: string; lines: { says: string; opts: Opt[] }[] }[] = [
  { who: '🧑', lines: [
    { says: 'Work was so hectic today, my boss dumped three projects on me.', opts: [{ text: 'Three at once? That sounds overwhelming.', warmth: 2 }, { text: 'My boss does that too, last week…', warmth: -1 }, { text: 'Just say no next time.', warmth: -1 }] },
    { says: 'Yeah… I feel like I can never catch up.', opts: [{ text: 'What’s weighing on you the most?', warmth: 2 }, { text: 'Have you tried a to-do app?', warmth: 0 }, { text: 'Anyway, did you see the match?', warmth: -2 }] },
    { says: 'Honestly, the report due Friday. I haven’t even started.', opts: [{ text: 'So Friday’s the big worry. Want to talk it through?', warmth: 2 }, { text: 'You’ll be fine!', warmth: 0 }, { text: 'I always start things late too haha', warmth: -1 }] },
  ] },
  { who: '👩', lines: [
    { says: 'I didn’t get into the course I applied for.', opts: [{ text: 'Oh no — you were really hoping for that one.', warmth: 2 }, { text: 'There are loads of other courses.', warmth: -1 }, { text: 'I got into mine first try.', warmth: -2 }] },
    { says: 'I worked so hard on the application.', opts: [{ text: 'It must feel unfair after all that effort.', warmth: 2 }, { text: 'Did you check it for typos?', warmth: -1 }, { text: 'Mm.', warmth: 0 }] },
    { says: 'I don’t know what to do next.', opts: [{ text: 'What would feel good to you right now?', warmth: 2 }, { text: 'You should just apply somewhere else.', warmth: -1 }, { text: 'Want to get food and not think about it for a bit?', warmth: 1 }] },
  ] },
  { who: '👴', lines: [
    { says: 'My garden won a ribbon at the village show!', opts: [{ text: 'A ribbon! Which plants were you proudest of?', warmth: 2 }, { text: 'Nice. I hate gardening.', warmth: -2 }, { text: 'Cool.', warmth: 0 }] },
    { says: 'The roses, I’ve been working on them for years.', opts: [{ text: 'Years of care — no wonder they won.', warmth: 2 }, { text: 'Roses are hard, aren’t they?', warmth: 1 }, { text: 'Mine all died.', warmth: -1 }] },
    { says: 'Maybe next year I’ll try tulips too.', opts: [{ text: 'I’d love to see them — will you show me?', warmth: 2 }, { text: 'Tulips are overrated.', warmth: -2 }, { text: 'Sounds good.', warmth: 0 }] },
  ] },
]
const W = 800, H = 460

export default function EchoTalk() {
  const [best, submit] = useBest('echo')
  const [ci, setCi] = useState(0)
  const [li, setLi] = useState(0)
  const [warm, setWarm] = useState(0.4)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const glow = useRef<SVGCircleElement>(null)
  const st = useRef({ score: 0, great: 0, warm: 0.4, lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, great: 0, warm: 0.4, lines: [] }; setCi(0); setLi(0); setWarm(0.4); setScore(0) }, [round])
  const chat = CHATS[ci], line = chat.lines[li]
  const opts = useRef<Opt[]>([])
  opts.current = [...line.opts].sort((a, b) => (a.text.length * 7 + b.text.length * 3) % 3 - 1)

  const choose = (o: Opt) => {
    const s = st.current
    s.warm = Math.max(0, Math.min(1, s.warm + o.warmth * 0.15))
    setWarm(s.warm)
    s.score += Math.max(0, o.warmth * 8 + 4); if (o.warmth === 2) s.great++
    setScore(s.score)
    if (glow.current && !reducedMotion()) gsap.fromTo(glow.current, { attr: { r: 90 } }, { attr: { r: 90 + s.warm * 60 }, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    if (li + 1 < chat.lines.length) { setLi(li + 1); return }
    s.lines.push(`${chat.who} felt ${s.warm > 0.75 ? 'really heard' : s.warm > 0.45 ? 'listened to' : 'brushed off'}`)
    if (ci + 1 >= CHATS.length) {
      const record = submitRef.current(s.score)
      setResult({ headline: 'Good friend energy 💛', lines: [...s.lines, `${s.great} really thoughtful replies`, `Score ${s.score}`], record })
    } else { setCi(ci + 1); setLi(0); s.warm = 0.4; setWarm(0.4) }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const hue = 210 - warm * 180
  return (
    <GameShell title="Echo Talk" score={score} best={best} result={result} onRestart={restart}
      hint={`Friend ${ci + 1}/${CHATS.length} · pick the reply that shows you’re listening`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A friend talking">
        <rect width={W} height={H} fill="#fafaf9" />
        <circle ref={glow} cx={170} cy={230} r={90 + warm * 60} fill={`hsl(${hue}, 90%, 70%)`} opacity={0.35} />
        <text x={170} y={265} textAnchor="middle" fontSize={110}>{chat.who}</text>
        <foreignObject x={320} y={80} width={440} height={140}><div className="ct-bubble" style={{ fontWeight: 600, fontSize: 18 }}>{line.says}</div></foreignObject>
        <g transform="translate(60 400)">
          <rect width={220} height={10} rx={5} fill="#e7e5e4" />
          <rect width={220 * warm} height={10} rx={5} fill={`hsl(${hue}, 90%, 55%)`} />
          <text y={30} fontSize={12} fill="#78716c">how heard they feel</text>
        </g>
      </svg>
      <div className="dm-gates" style={{ gridTemplateColumns: '1fr' }}>
        {opts.current.map((o) => <button key={o.text} type="button" style={{ borderColor: '#d6d3d1' }} onClick={() => choose(o)}>{o.text}</button>)}
      </div>
    </GameShell>
  )
}
