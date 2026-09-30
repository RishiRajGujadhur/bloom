import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Phrasebook Parrot: you're off travelling with a chatty parrot. Locals greet
 * you in their language, and the parrot needs feeding the right seed-card to
 * reply — "hello" for a greeting, "thank you" after help, "how much?" at a
 * stall. The parrot learns: cards you've fed right before glow a little
 * brighter next time. Four countries.
 */
type Phrase = { key: 'hello' | 'thanks' | 'price' | 'bye' | 'sorry'; en: string; icon: string }
const PHRASES: Phrase[] = [
  { key: 'hello', en: 'Hello', icon: '👋' }, { key: 'thanks', en: 'Thank you', icon: '🙏' }, { key: 'price', en: 'How much?', icon: '💰' },
  { key: 'bye', en: 'Goodbye', icon: '🚶' }, { key: 'sorry', en: 'Sorry', icon: '😅' },
]
const LANGS: { name: string; flag: string; words: Record<Phrase['key'], string>; scene: string }[] = [
  { name: 'Spain', flag: '💃', words: { hello: 'Hola', thanks: 'Gracias', price: '¿Cuánto cuesta?', bye: 'Adiós', sorry: 'Lo siento' }, scene: '#fde68a' },
  { name: 'France', flag: '🥐', words: { hello: 'Bonjour', thanks: 'Merci', price: 'C’est combien ?', bye: 'Au revoir', sorry: 'Pardon' }, scene: '#bfdbfe' },
  { name: 'Japan', flag: '🗻', words: { hello: 'Konnichiwa', thanks: 'Arigatō', price: 'Ikura desu ka?', bye: 'Sayōnara', sorry: 'Sumimasen' }, scene: '#fecdd3' },
  { name: 'Italy', flag: '🍕', words: { hello: 'Ciao', thanks: 'Grazie', price: 'Quanto costa?', bye: 'Arrivederci', sorry: 'Scusi' }, scene: '#bbf7d0' },
]
// What the local says first, and what you should reply with.
const SCENES: { says: Phrase['key']; reply: Phrase['key']; who: string; ctx: string }[] = [
  { says: 'hello', reply: 'hello', who: '👨', ctx: 'A café owner greets you' },
  { says: 'price', reply: 'thanks', who: '👵', ctx: 'A stallholder tells you the price and hands you some fruit' },
  { says: 'bye', reply: 'bye', who: '👮', ctx: 'A guard waves you off' },
  { says: 'sorry', reply: 'sorry', who: '🧓', ctx: 'You bumped into someone — they apologise too' },
  { says: 'thanks', reply: 'thanks', who: '👩', ctx: 'You held the door and they thank you' },
]
const W = 800, H = 460

export default function PhrasebookParrot() {
  const [best, submit] = useBest('parrot')
  const [li, setLi] = useState(0)
  const [si, setSi] = useState(0)
  const [known, setKnown] = useState<Record<string, number>>({})
  const [msg, setMsg] = useState('')
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const parrot = useRef<SVGGElement>(null)
  const st = useRef({ score: 0, right: 0, wrong: 0, t0: performance.now() })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, right: 0, wrong: 0, t0: performance.now() }; setLi(0); setSi(0); setKnown({}); setMsg(''); setScore(0) }, [round])
  useEffect(() => {
    if (parrot.current && !reducedMotion()) { const t = gsap.to(parrot.current, { y: -6, rotation: 4, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut', svgOrigin: '160 330' }); return () => { t.kill() } }
  }, [])

  const L = LANGS[li]
  const S = SCENES[(si + li) % SCENES.length]
  const feed = (p: Phrase) => {
    const s = st.current
    const ok = p.key === S.reply
    const k = `${L.name}:${p.key}`
    if (ok) {
      s.right++; const secs = (performance.now() - s.t0) / 1000
      s.score += 10 + Math.max(0, Math.round(8 - secs))
      setKnown((kn) => ({ ...kn, [k]: (kn[k] ?? 0) + 1 }))
      setMsg(`🦜 “${L.words[p.key]}!” — they smile.`)
      if (parrot.current && !reducedMotion()) gsap.fromTo(parrot.current, { scale: 1 }, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, svgOrigin: '160 330' })
    } else {
      s.wrong++; s.score = Math.max(0, s.score - 4)
      setMsg(`🦜 “${L.words[p.key].replace(/[?？]$/, '')}?” — they look puzzled.`)
    }
    setScore(s.score)
    if (!ok) return
    setTimeout(() => {
      setMsg('')
      s.t0 = performance.now()
      if (si + 1 >= 4) {
        if (li + 1 >= LANGS.length) { const record = submitRef.current(s.score); setResult({ headline: 'What a trip! 🌍', lines: [`${s.right} good replies across ${LANGS.length} countries`, `${s.wrong} puzzled looks`, `Score ${s.score}`], record }) }
        else { setLi(li + 1); setSi(0) }
      } else setSi(si + 1)
    }, 900)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Phrasebook Parrot" score={score} best={best} result={result} onRestart={restart}
      hint={`${L.flag} ${L.name} · ${S.ctx} · feed the parrot the right reply ${msg ? `· ${msg}` : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Parrot and a local">
        <rect width={W} height={H} fill={L.scene} />
        <rect y={360} width={W} height={100} fill="#00000014" />
        <text x={720} y={60} fontSize={44}>{L.flag}</text>
        {/* Local and speech bubble. */}
        <text x={600} y={330} textAnchor="middle" fontSize={90}>{S.who}</text>
        <foreignObject x={440} y={110} width={300} height={90}><div className="ct-bubble">“{L.words[S.says]}”</div></foreignObject>
        {/* Parrot on a perch. */}
        <line x1={80} y1={360} x2={250} y2={360} stroke="#78350f" strokeWidth={10} strokeLinecap="round" />
        <g ref={parrot}>
          <ellipse cx={160} cy={300} rx={48} ry={60} fill="#22c55e" />
          <ellipse cx={180} cy={310} rx={24} ry={42} fill="#16a34a" />
          <circle cx={150} cy={232} r={34} fill="#ef4444" />
          <circle cx={140} cy={226} r={9} fill="#fff" /><circle cx={138} cy={226} r={4} fill="#111" />
          <path d="M118 238 q-26 6 -8 24 q6 -10 14 -14 z" fill="#f59e0b" />
          <path d="M150 360 v-12 M170 360 v-12" stroke="#f59e0b" strokeWidth={5} />
          <path d="M190 330 q40 30 20 70 q-10 -30 -30 -40 z" fill="#3b82f6" />
        </g>
        {msg && <foreignObject x={60} y={100} width={260} height={80}><div className="gr-bubble">{msg.replace('🦜 ', '')}</div></foreignObject>}
      </svg>
      <div className="cf-tray">
        {PHRASES.map((p) => {
          const k = known[`${L.name}:${p.key}`] ?? 0
          return <button key={p.key} type="button" onClick={() => feed(p)} style={k ? { boxShadow: `0 0 ${6 + k * 4}px #facc15` } : undefined}>{p.icon} {p.en}<small style={{ opacity: 0.6 }}>&nbsp;{k ? L.words[p.key] : ''}</small></button>
        })}
      </div>
    </GameShell>
  )
}
