import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Scam Bubbles: messages drift up toward your phone in soap bubbles. Pop the
 * sketchy ones before they reach the top; let the real ones float through.
 * Three cracks and the screen is gone. Bubbles speed up as you go.
 */
type Msg = { from: string; text: string; bad: boolean }
const GOOD: Msg[] = [
  { from: 'Mum', text: 'Landed safe, call you after dinner x', bad: false },
  { from: 'Dentist', text: 'Reminder: check-up Tue 10:30. Reply C to confirm.', bad: false },
  { from: 'Sam', text: 'Running 10 min late, grab us a table?', bad: false },
  { from: 'Library', text: 'Your book is ready to collect at the front desk.', bad: false },
  { from: 'Gym', text: 'Pool closed Sunday for cleaning.', bad: false },
  { from: 'Priya', text: 'Photos from the hike are in the shared album 📸', bad: false },
  { from: 'Bank app', text: 'You paid £4.20 at Corner Café.', bad: false },
  { from: 'Work', text: 'Standup moved to 9:45 tomorrow.', bad: false },
  { from: 'Dad', text: 'Did you see the match?!', bad: false },
  { from: 'Pharmacy', text: 'Prescription ready. Open till 6pm.', bad: false },
]
const BAD: Msg[] = [
  { from: '+44 7700 900', text: 'URGENT: your account is locked. Verify now: bnk-secure.co', bad: true },
  { from: 'Delivery', text: 'Parcel held. Pay £1.99 fee at royal-maill.info', bad: true },
  { from: 'Unknown', text: 'You WON an iPhone 17!! Claim in 10 min ⏰', bad: true },
  { from: 'Mum?', text: 'Hi it’s me, new number. Can you send £300 today?', bad: true },
  { from: 'HMRC', text: 'Tax refund £742 waiting. Enter card details to receive.', bad: true },
  { from: 'Support', text: 'Read me the 6-digit code we just sent you.', bad: true },
  { from: 'Crypto Pro', text: 'Double your savings in 48h guaranteed 🚀', bad: true },
  { from: 'Netflix', text: 'Payment failed. Update billing: netflx-help.net', bad: true },
  { from: 'Boss', text: 'Need 5 gift cards urgently, keep it quiet, reimburse later', bad: true },
  { from: 'Friend', text: 'Is this you in this video?? lol bit.ly/x9q', bad: true },
]
const W = 720, H = 560
type Bubble = { id: number; m: Msg; x: number; r: number }

export default function ScamBubbles() {
  const [best, submit] = useBest('scam')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [cracks, setCracks] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ score: 0, cracks: 0, popped: 0, passed: 0, oops: 0, running: true, speed: 1 })
  const tweens = useRef(new Map<number, gsap.core.Timeline>())
  const els = useRef(new Map<number, SVGGElement>())
  const phone = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  const nid = useRef(1)
  const started = useRef(new Set<number>())

  const end = useCallback(() => {
    const s = st.current
    if (!s.running) return
    s.running = false
    tweens.current.forEach((t) => t.pause())
    const record = submitRef.current(s.score)
    setResult({ headline: 'Screen cracked!', lines: [`${s.popped} sketchy messages popped`, `${s.passed} real ones delivered`, `${s.oops} real ones popped by mistake`, `Score ${s.score}`], record })
  }, [])

  const arrive = useCallback((b: Bubble) => {
    const s = st.current
    if (!s.running) return
    tweens.current.delete(b.id)
    setBubbles((list) => list.filter((x) => x.id !== b.id))
    if (b.m.bad) {
      s.cracks++
      setCracks(s.cracks)
      if (phone.current && !reducedMotion()) gsap.fromTo(phone.current, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
      if (s.cracks >= 3) end()
    } else {
      s.passed++
      s.score += 5
      setScore(s.score)
    }
  }, [end])

  useEffect(() => {
    st.current = { score: 0, cracks: 0, popped: 0, passed: 0, oops: 0, running: true, speed: 1 }
    let timer = 0
    const spawn = () => {
      const s = st.current
      if (!s.running) return
      const bad = Math.random() < 0.5
      const pool = bad ? BAD : GOOD
      const m = pool[Math.floor(Math.random() * pool.length)]
      const b = { id: nid.current++, m, x: 110 + Math.random() * (W - 380), r: 74 }
      setBubbles((list) => [...list, b])
      s.speed = Math.min(2.6, s.speed + 0.04)
      timer = window.setTimeout(spawn, Math.max(700, 2100 / s.speed))
    }
    timer = window.setTimeout(spawn, 400)
    const map = tweens.current
    return () => { clearTimeout(timer); map.forEach((t) => t.kill()); map.clear() }
  }, [round])

  // Start a float tween when a bubble's element mounts.
  const mount = (b: Bubble, el: SVGGElement | null) => {
    if (!el) return
    els.current.set(b.id, el)
    if (tweens.current.has(b.id) || started.current.has(b.id)) return
    started.current.add(b.id)
    const dur = 9 / st.current.speed
    const tl = gsap.timeline({ onComplete: () => arrive(b) })
    tl.fromTo(el, { y: H + 80 }, { y: 70, duration: dur, ease: 'none' })
    if (!reducedMotion()) tl.to(el, { x: `+=${30 + Math.random() * 30}`, duration: dur / 4, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0)
    tweens.current.set(b.id, tl)
  }

  const pop = (b: Bubble) => {
    const s = st.current
    if (!s.running) return
    tweens.current.get(b.id)?.kill()
    tweens.current.delete(b.id)
    const el = els.current.get(b.id)
    if (b.m.bad) { s.popped++; s.score += 10 } else { s.oops++; s.score = Math.max(0, s.score - 8) }
    setScore(s.score)
    const done = () => setBubbles((list) => list.filter((x) => x.id !== b.id))
    if (el && !reducedMotion()) {
      el.querySelectorAll('.sb-drop').forEach((d, i) => gsap.fromTo(d, { opacity: 1, x: 0, y: 0 }, { opacity: 0, x: Math.cos(i) * 90, y: Math.sin(i) * 90, duration: 0.5 }))
      gsap.to(el.querySelector('.sb-body'), { scale: 1.4, opacity: 0, duration: 0.25, transformOrigin: '50% 50%', onComplete: done })
    } else done()
  }

  const restart = useCallback(() => { els.current.clear(); started.current.clear(); setBubbles([]); setScore(0); setCracks(0); setResult(null); setRound((r) => r + 1) }, [])

  return (
    <GameShell title="Scam Bubbles" score={score} best={best} result={result} onRestart={restart}
      hint={`Pop the sketchy messages · let the real ones through · ${3 - cracks} screen lives left`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bubbles rising to a phone">
        <defs>
          <radialGradient id="sb-g" cx="35%" cy="30%"><stop offset="0" stopColor="#ffffff" stopOpacity=".95" /><stop offset=".5" stopColor="#bfe6ff" stopOpacity=".35" /><stop offset="1" stopColor="#7cc4ff" stopOpacity=".55" /></radialGradient>
          <linearGradient id="sb-sea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dff3ff" /><stop offset="1" stopColor="#7fb8e6" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#sb-sea)" />
        <g ref={phone} transform="translate(560 30)">
          <rect width={130} height={240} rx={22} fill="#1d2230" />
          <rect x={8} y={14} width={114} height={212} rx={14} fill="#dfe9ff" />
          {cracks > 0 && <path d="M20 40 L60 90 L40 130 L80 170" stroke="#1d2230" strokeWidth={2} fill="none" />}
          {cracks > 1 && <path d="M110 30 L80 80 L100 120 L70 200" stroke="#1d2230" strokeWidth={2} fill="none" />}
          {cracks > 2 && <path d="M15 200 L60 150 L110 190" stroke="#1d2230" strokeWidth={2} fill="none" />}
          <text x={65} y={120} textAnchor="middle" fontSize={11} fill="#1d2230">inbox · {st.current.passed} ✓</text>
        </g>
        <line x1={0} x2={540} y1={70} y2={70} stroke="#1d2230" strokeDasharray="4 8" opacity={0.3} />
        {bubbles.map((b) => (
          <g key={b.id} ref={(el) => mount(b, el)} transform={`translate(${b.x} ${H + 80})`} onPointerDown={() => pop(b)} style={{ cursor: 'pointer' }}>
            {Array.from({ length: 6 }, (_, i) => <circle key={i} className="sb-drop" r={5} fill="#bfe6ff" opacity={0} />)}
            <g className="sb-body">
              <circle r={b.r} fill="url(#sb-g)" stroke="#ffffffaa" strokeWidth={2} />
              <foreignObject x={-62} y={-44} width={124} height={88} pointerEvents="none">
                <div className="sb-card">
                  <b>{b.m.from}</b>
                  <span>{b.m.text}</span>
                </div>
              </foreignObject>
            </g>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
