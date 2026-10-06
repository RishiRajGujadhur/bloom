import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { rotationTrial, scrambleTrial, simonLength, simonSequence, streamTrial, trackSetup, type Vec } from './gamesModel'

type Finish = (score: number, accuracy: number) => void
type Props = { level: number; finish: Finish; blip: (ok: boolean) => void }

const pads = [
  { color: '#e2553f', note: 330 },
  { color: '#3f7fd0', note: 392 },
  { color: '#3f8a5a', note: 494 },
  { color: '#d9a400', note: 587 },
]
function tone(freq: number) {
  try {
    const ac = new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.frequency.value = freq
    g.gain.setValueAtTime(0.1, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.35)
    o.connect(g).connect(ac.destination)
    o.start()
    o.stop(ac.currentTime + 0.36)
    setTimeout(() => void ac.close(), 500)
  } catch {
    /* optional */
  }
}

/** Pattern echo (Simon): four SVG pads flash with GSAP; repeat the pattern. */
export function PatternEcho({ level, finish, blip }: Props) {
  const [seq] = useState(() => simonSequence(simonLength(level)))
  const [shown, setShown] = useState(1)
  const [input, setInput] = useState<number[]>([])
  const [watching, setWatching] = useState(true)
  const svg = useRef<SVGSVGElement>(null)
  const flash = (i: number) => {
    const el = svg.current?.querySelector(`[data-pad="${i}"]`)
    if (el) gsap.fromTo(el, { opacity: 1, scale: 1.08, transformOrigin: '50% 50%' }, { opacity: 0.45, scale: 1, duration: 0.45, ease: 'power2.out' })
    tone(pads[i].note)
  }
  useEffect(() => {
    if (!watching) return
    const timers = seq.slice(0, shown).map((p, k) => setTimeout(() => flash(p), 600 + k * 650))
    const done = setTimeout(() => setWatching(false), 600 + shown * 650)
    return () => [...timers, done].forEach(clearTimeout)
  }, [watching, shown, seq])
  const press = (i: number) => {
    if (watching) return
    flash(i)
    const next = [...input, i]
    const ok = seq[next.length - 1] === i
    if (!ok) {
      blip(false)
      return finish((shown - 1) * 15, (shown - 1) / seq.length)
    }
    if (next.length === shown) {
      blip(true)
      if (shown === seq.length) return finish(seq.length * 15 + 20, 1)
      setInput([])
      setShown(shown + 1)
      setWatching(true)
    } else setInput(next)
  }
  return (
    <div className="bg-play bg-col">
      <p className="bg-prompt">{watching ? 'Watch…' : `Your turn: ${input.length}/${shown}`}</p>
      <svg ref={svg} className="bg-simon" viewBox="0 0 220 220" role="group" aria-label="Pattern pads">
        {pads.map((p, i) => (
          <path
            key={i}
            data-pad={i}
            role="button"
            aria-label={`Pad ${i + 1}`}
            tabIndex={0}
            d={['M110 10 A100 100 0 0 1 210 110 H140 A30 30 0 0 0 110 80Z', 'M210 110 A100 100 0 0 1 110 210 V140 A30 30 0 0 0 140 110Z', 'M110 210 A100 100 0 0 1 10 110 H80 A30 30 0 0 0 110 140Z', 'M10 110 A100 100 0 0 1 110 10 V80 A30 30 0 0 0 80 110Z'][i]}
            fill={p.color}
            opacity="0.45"
            onClick={() => press(i)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && press(i)}
          />
        ))}
        <text x="110" y="116" textAnchor="middle" className="bg-simon-count">{shown}</text>
      </svg>
    </div>
  )
}

function Shape({ cubes, angle, color, spin }: { cubes: Vec[]; angle: number; color: string; spin: boolean }) {
  const g = useRef<Group>(null)
  const cx = cubes.reduce((a, c) => a + c[0], 0) / cubes.length
  const cy = cubes.reduce((a, c) => a + c[1], 0) / cubes.length
  const cz = cubes.reduce((a, c) => a + c[2], 0) / cubes.length
  useFrame((_, dt) => {
    if (g.current && spin) g.current.rotation.y += dt * 0.15
  })
  return (
    <group ref={g} rotation={[angle * 0.5, angle, angle * 0.3]}>
      {cubes.map(([x, y, z], i) => (
        <mesh key={i} position={[x - cx, y - cy, z - cz]}>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

/** Mental rotation (Shepard–Metzler) rendered with three.js. */
export function MentalRotation({ level, finish, blip }: Props) {
  const rounds = 8
  const [n, setN] = useState(0)
  const [right, setRight] = useState(0)
  const trial = useMemo(() => rotationTrial(level), [level, n]) // eslint-disable-line react-hooks/exhaustive-deps
  const answer = (same: boolean) => {
    const ok = same === trial.same
    blip(ok)
    const r = right + Number(ok)
    if (n + 1 >= rounds) return finish(r * 12, r / rounds)
    setRight(r)
    setN(n + 1)
  }
  return (
    <div className="bg-play bg-col">
      <p className="bg-prompt">Round {n + 1}/{rounds} — is the right shape the same object, just turned?</p>
      <div className="bg-rotate bloom-columns">
        {[trial.shape, trial.other].map((cubes, i) => (
          <div key={`${n}-${i}`} className="bg-rotate-view" aria-label={i ? 'Second shape' : 'First shape'}>
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 2]}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[4, 6, 5]} intensity={1.1} />
              <Shape cubes={cubes} angle={i ? trial.angle : 0.4} color={i ? '#8f7ae5' : '#3f8a5a'} spin={false} />
            </Canvas>
          </div>
        ))}
      </div>
      <div className="bg-controls">
        <button type="button" className="studio-btn primary" onClick={() => answer(true)}>Same</button>
        <button type="button" className="studio-btn" onClick={() => answer(false)}>Mirror</button>
      </div>
    </div>
  )
}

/** Word scramble: letter tiles shuffle in with GSAP. */
export function WordScramble({ level, finish, blip }: Props) {
  const [left, setLeft] = useState(60)
  const [n, setN] = useState(0)
  const [right, setRight] = useState(0)
  const [value, setValue] = useState('')
  const [trial, setTrial] = useState(() => scrambleTrial(level))
  const tiles = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(() => (left <= 0 ? finish(right * 12, n ? right / n : 0) : setLeft(left - 1)), 1000)
    return () => clearTimeout(t)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!tiles.current) return
    const tw = gsap.from(tiles.current.children, { y: -20, rotate: () => gsap.utils.random(-30, 30), opacity: 0, stagger: 0.05, duration: 0.4, ease: 'back.out(2)' })
    return () => void tw.progress(1)
  }, [trial])
  const next = (ok: boolean) => {
    blip(ok)
    setN(n + 1)
    if (ok) setRight(right + 1)
    setValue('')
    setTrial(scrambleTrial(level))
  }
  return (
    <div className="bg-play bg-col">
      <p className="bg-prompt">{left}s left · {right} solved</p>
      <div ref={tiles} className="bg-tiles" aria-label={`Letters ${trial.letters.split('').join(' ')}`}>
        {trial.letters.split('').map((c, i) => <span key={`${trial.word}-${i}`}>{c}</span>)}
      </div>
      <form className="bg-controls" onSubmit={(e) => { e.preventDefault(); next(value.trim().toLowerCase() === trial.word) }}>
        <input className="studio-input bg-answer" autoFocus aria-label="Word" value={value} onChange={(e) => setValue(e.target.value)} />
        <button type="button" className="studio-btn" onClick={() => next(false)}>Skip ({trial.word.length} letters)</button>
      </form>
    </div>
  )
}

/** Multiple-object tracking: dots drift (GSAP), then pick the marked ones. */
export function FocusTracker({ level, finish, blip }: Props) {
  const { dots, targets, seconds } = trackSetup(level)
  const [phase, setPhase] = useState<'mark' | 'move' | 'pick'>('mark')
  const [picked, setPicked] = useState<number[]>([])
  const box = useRef<HTMLDivElement>(null)
  const targetSet = useMemo(() => new Set(Array.from({ length: targets }, (_, i) => i)), [targets])
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('move'), 1800)
    return () => clearTimeout(t1)
  }, [])
  useEffect(() => {
    if (phase !== 'move' || !box.current) return
    const els = [...box.current.querySelectorAll<HTMLElement>('.bg-dot')]
    const tweens = els.map((el) =>
      gsap.to(el, { keyframes: Array.from({ length: Math.ceil(seconds * 1.2) }, () => ({ left: `${gsap.utils.random(4, 88)}%`, top: `${gsap.utils.random(4, 84)}%`, duration: 0.85, ease: 'sine.inOut' })) }),
    )
    const stop = setTimeout(() => setPhase('pick'), seconds * 1000)
    return () => { clearTimeout(stop); tweens.forEach((t) => t.kill()) }
  }, [phase, seconds])
  const pick = (i: number) => {
    if (phase !== 'pick' || picked.includes(i)) return
    const next = [...picked, i]
    blip(targetSet.has(i))
    setPicked(next)
    if (next.length === targets) {
      const hits = next.filter((x) => targetSet.has(x)).length
      setTimeout(() => finish(hits * 20, hits / targets), 500)
    }
  }
  const start = useMemo(() => Array.from({ length: dots }, (_, i) => ({ left: 8 + ((i * 37) % 80), top: 10 + ((i * 53) % 72) })), [dots])
  return (
    <div className="bg-play bg-col">
      <p className="bg-prompt">{phase === 'mark' ? `Remember the ${targets} glowing dot${targets > 1 ? 's' : ''}` : phase === 'move' ? 'Keep your eyes on them…' : `Tap the ${targets} you followed`}</p>
      <div ref={box} className="bg-track">
        {start.map((p, i) => (
          <button
            key={i}
            type="button"
            className={`bg-dot ${phase === 'mark' && targetSet.has(i) ? 'target' : ''} ${picked.includes(i) ? (targetSet.has(i) ? 'hit' : 'miss') : ''}`}
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            aria-label={`Dot ${i + 1}`}
            onClick={() => pick(i)}
          />
        ))}
      </div>
    </div>
  )
}

/** Number stream: numbers flash one at a time; give the running total. */
export function NumberStream({ level, finish, blip }: Props) {
  const [trial] = useState(() => streamTrial(level))
  const [i, setI] = useState(-1)
  const [value, setValue] = useState('')
  const num = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (i >= trial.nums.length) return
    const t = setTimeout(() => setI(i + 1), i < 0 ? 900 : trial.ms)
    return () => clearTimeout(t)
  }, [i, trial])
  useLayoutEffect(() => {
    if (num.current && i >= 0) gsap.fromTo(num.current, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25 })
  }, [i])
  const done = i >= trial.nums.length
  return (
    <div className="bg-play bg-stroop bg-col">
      <div ref={num} className="bg-word bg-sum">{i < 0 ? 'Ready' : done ? '= ?' : `+${trial.nums[i]}`}</div>
      {done && (
        <form
          className="bg-controls"
          onSubmit={(e) => {
            e.preventDefault()
            const diff = Math.abs(Number(value) - trial.total)
            blip(diff === 0)
            finish(diff === 0 ? trial.nums.length * 12 : Math.max(0, trial.nums.length * 6 - diff * 2), diff === 0 ? 1 : Math.max(0, 1 - diff / trial.total))
          }}
        >
          <input className="studio-input bg-answer" inputMode="numeric" autoFocus aria-label="Total" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))} />
          <small className="studio-empty">Enter the total</small>
        </form>
      )}
    </div>
  )
}
