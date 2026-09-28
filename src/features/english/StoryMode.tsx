import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { BloomFace } from '../../components/ui/BloomFace'
import type { AvatarDrawing } from '../../components/ui/avatarStyle'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { units } from './englishCourse'
import { makeLesson } from './lessonGen'
import { LessonPlayer, type LessonResult } from './LessonPlayer'
import { sfx } from './sfx'
import { unitThemes } from './UnitScene'
import './story.css'

const IntroPlayer = lazy(() => import('./video/IntroPlayer').then((m) => ({ default: m.IntroPlayer })))

/**
 * Story mode — "The Word Well": a short side quest. Bloom World is leaking
 * words; only the champion of the Grand English Tournament can refill the
 * Word Well. Three matches, Persona-style dialogue before and after each one,
 * and a bonus wheel after every win.
 */
export type Who = { name: string; face: AvatarDrawing; color: string; tint?: string }
export const cast: Record<string, Who> = {
  tinker: { name: 'Professor Tinker', face: 'tinker', color: '#ff8a2a' },
  glitch: { name: 'GLITCH', face: 'robot', color: '#ff4b4b', tint: 'hue-rotate(230deg) saturate(2.2)' },
  bloom: { name: 'Bloom', face: 'bloom', color: '#ff8a5a' },
  mochi: { name: 'Mochi', face: 'orb', color: '#8f7ae5' },
  globe: { name: 'Professor Globe', face: 'globe', color: '#4a5fd6' },
  sparky: { name: 'Sparky', face: 'spark', color: '#ff8a2a' },
  pix: { name: 'Pix (commentator)', face: 'pixel', color: '#ffc800' },
  unit7: { name: 'UNIT-7', face: 'robot', color: '#39ff6a' },
  beacon: { name: 'Beacon (referee)', face: 'beacon', color: '#ff8a2a' },
}
export type Line = [keyof typeof cast, string]
type Level = { id: string; title: string; place: string; rival: keyof typeof cast; rivalScore: number; unit: number; sky: [string, string]; before: Line[]; after: Line[]; lose: Line[] }

const prologue: Line[] = [
  ['bloom', 'Uh-oh. The words are leaking out of Bloom World!'],
  ['mochi', 'I tried to say “good morning” and it came out “goo mor”. Humiliating.'],
  ['globe', 'Only the champion of the Grand English Tournament can refill the Word Well!'],
  ['bloom', 'That’s you. No pressure. Well… some pressure.'],
  ['pix', 'TOURNAMENT MODE: ON! INSERT COIN! …Just kidding, it’s free.'],
]
const levels: Level[] = [
  {
    id: 'qualifier', title: 'Round 1 · The Qualifier', place: 'Petal Plaza', rival: 'mochi', rivalScore: 0.5, unit: 0, sky: ['#ffd6e8', '#b5bdf3'],
    before: [
      ['beacon', 'Round one! Contestants, keep your vowels where I can see them.'],
      ['mochi', 'I’m not competitive. I’m just… emotionally invested.'],
      ['mochi', 'Also my colour changes when I lose. Please don’t make me beige.'],
    ],
    after: [
      ['mochi', 'I’m fine. This is my happy colour. Mostly.'],
      ['pix', 'WHAT A FINISH! Mochi is now officially… lilac with sadness!'],
      ['bloom', 'One down! I can already hear a few words coming back. “Sandwich!”'],
    ],
    lose: [['mochi', 'I won?! Quick, somebody take a picture of my colour!'], ['bloom', 'Shake it off — try again!']],
  },
  {
    id: 'semi', title: 'Round 2 · The Snack-Final', place: 'Crunchy Coliseum', rival: 'sparky', rivalScore: 0.65, unit: 1, sky: ['#ffe0b8', '#ff8a5a'],
    before: [
      ['sparky', 'Did someone say free snacks? I’m in!'],
      ['beacon', 'Sparky, the prize is saving the world.'],
      ['sparky', '…Are there snacks in the world?'],
      ['pix', 'The crowd goes MILD! Sparky only entered for the free tote bag!'],
    ],
    after: [
      ['sparky', 'I lost, but I got a free lanyard. Honestly? Worth it.'],
      ['sparky', 'Hey, the final is against UNIT-7. It’s been sighing since Tuesday.'],
      ['bloom', 'A robot that’s… bored? That can’t be good.'],
    ],
    lose: [['sparky', 'I WON! Do I get snacks now? …I get to keep playing? Ugh, fine.'], ['bloom', 'Try again — for the world, and for Sparky’s snack budget.']],
  },
  {
    id: 'final', title: 'The Grand Final', place: 'The Word Well Arena', rival: 'unit7', rivalScore: 0.8, unit: 3, sky: ['#0b2a14', '#39ff6a'],
    before: [
      ['unit7', 'I have calculated 14 million outcomes. I was bored in all of them.'],
      ['globe', 'UNIT-7 entered the tournament to “experience a feeling”. Any feeling.'],
      ['unit7', 'Beat me, human, and I might feel… something. Probably static.'],
      ['pix', 'FINAL ROUND! The Word Well is almost dry! NO PRESSURE! (Lots of pressure.)'],
    ],
    after: [
      ['unit7', 'Error: defeat detected. New emotion detected: …fun?'],
      ['unit7', 'Rematch next week. I have cleared my schedule. My schedule was already clear.'],
      ['globe', 'The Word Well is FULL! Bloom World can speak again!'],
      ['mochi', 'Good morning! GOOD MORNING! I can say it! I’m turning gold!'],
      ['bloom', 'You saved Bloom World, champion. I’m so proud I might sprout a second leaf.'],
    ],
    lose: [['unit7', 'Victory. Emotion detected: still bored.'], ['bloom', 'So close! The Well needs you — once more!']],
  },
]

const STORY_KEY = 'bloom-english-story-v1'
type StoryState = { cleared: number; seenPrologue: boolean }

/* ---------- Scene: an animated SVG backdrop with drifting letters and stage lights ---------- */
export function Scene({ sky, children, final }: { sky: [string, string]; children?: React.ReactNode; final?: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const letters = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ ch: 'ABCDEFGHIJKLMNOPRSTUWY'[(i * 7) % 22], x: (i * 61) % 800, y: 40 + ((i * 97) % 300), s: 14 + (i % 4) * 6 })), [])
  useLayoutEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.to('.st-letter', { y: '-=30', rotate: () => gsap.utils.random(-25, 25), opacity: () => gsap.utils.random(0.25, 0.7), duration: () => gsap.utils.random(3, 6), yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.2 })
      gsap.fromTo('.st-beam', { rotate: -18 }, { rotate: 18, svgOrigin: '400 -20', duration: 3.5, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.8 })
      gsap.to('.st-crowd circle', { y: -4, duration: 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: { each: 0.05, from: 'random' } })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <div className="st-scene">
      <svg ref={ref} className="st-bg" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-matrix-native>
        <defs>
          <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky[0]} />
            <stop offset="1" stopColor={sky[1]} />
          </linearGradient>
          <radialGradient id="st-beam-g" cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="420" fill="url(#st-sky)" />
        {[260, 400, 540].map((x) => <path key={x} className="st-beam" d={`M${x} -20 L${x - 90} 420 L${x + 90} 420 Z`} fill="url(#st-beam-g)" opacity={final ? 0.5 : 0.3} />)}
        {letters.map((l, i) => <text key={i} className="st-letter" x={l.x} y={l.y} fontSize={l.s} fontWeight="900" fill="#fff" opacity="0.4">{l.ch}</text>)}
        <g className="st-crowd">
          {Array.from({ length: 34 }, (_, i) => <circle key={i} cx={12 + i * 24} cy={400 - (i % 3) * 8} r={14} fill={['#00000033', '#00000022', '#00000044'][i % 3]} />)}
        </g>
      </svg>
      {children}
    </div>
  )
}

/* ---------- Persona-style dialogue box with a sliding portrait and typewriter text ---------- */
export function Dialogue({ lines, sky, onDone, final }: { lines: Line[]; sky: [string, string]; onDone: () => void; final?: boolean }) {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(0)
  const portrait = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [who, text] = lines[i]
  const c = cast[who]
  const prev = i > 0 ? lines[i - 1][0] : null
  useLayoutEffect(() => {
    if (prev !== who && portrait.current) gsap.fromTo(portrait.current, { x: -120, opacity: 0, skewX: -10 }, { x: 0, opacity: 1, skewX: 0, duration: 0.45, ease: 'back.out(1.6)' })
    if (box.current) gsap.fromTo(box.current, { y: 10 }, { y: 0, duration: 0.25, ease: 'power2.out' })
    setShown(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])
  useEffect(() => {
    if (shown >= text.length) return
    const t = window.setTimeout(() => setShown((n) => n + 2), 22)
    return () => window.clearTimeout(t)
  }, [shown, text])
  const next = () => {
    if (shown < text.length) return setShown(text.length)
    sfx('tick')
    if (i + 1 >= lines.length) onDone()
    else setI(i + 1)
  }
  return (
    <Scene sky={sky} final={final}>
      <div className="st-stage" onClick={next} role="button" tabIndex={0} aria-label="Next line" onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && next()}>
        <div ref={portrait} className="st-portrait" style={{ ['--who' as string]: c.color, filter: c.tint }}>
          <BloomFace variant={c.face} size={150} follow={false} waveOnMount={false} label={c.name} />
        </div>
        <div ref={box} className="st-box" style={{ ['--who' as string]: c.color }}>
          <span className="st-name">{c.name}</span>
          <p aria-live="polite">{text.slice(0, shown)}</p>
          <span className="st-next" aria-hidden="true">▼</span>
        </div>
        <button type="button" className="st-skip" onClick={(e) => { e.stopPropagation(); onDone() }}>Skip ›</button>
      </div>
    </Scene>
  )
}

/* ---------- VS splash ---------- */
export function Versus({ level, onGo }: { level: Pick<Level, 'title' | 'place' | 'rival' | 'rivalScore'>; onGo: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const rival = cast[level.rival]
  useLayoutEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.timeline()
        .from('.vs-stripe', { xPercent: -120, duration: 0.5, stagger: 0.08, ease: 'power3.out' })
        .from('.vs-left', { x: -200, opacity: 0, duration: 0.45, ease: 'back.out(1.7)' }, 0.2)
        .from('.vs-right', { x: 200, opacity: 0, duration: 0.45, ease: 'back.out(1.7)' }, 0.2)
        .from('.vs-mark', { scale: 4, opacity: 0, rotate: -30, duration: 0.5, ease: 'expo.out' }, 0.5)
        .from('.vs-info', { y: 20, opacity: 0, duration: 0.3 }, 0.8)
    }, ref)
    sfx('done')
    return () => ctx.revert()
  }, [])
  return (
    <div ref={ref} className="st-vs">
      {[0, 1, 2].map((k) => <i key={k} className="vs-stripe" />)}
      <div className="vs-left"><BloomFace variant="bloom" size={120} follow={false} waveOnMount={false} label="You and Bloom" /><strong>You</strong></div>
      <span className="vs-mark">VS</span>
      <div className="vs-right" style={{ filter: rival.tint }}><BloomFace variant={rival.face} size={120} follow={false} waveOnMount={false} label={rival.name} /><strong>{rival.name}</strong></div>
      <div className="vs-info">
        <h3>{level.title}</h3>
        <p>{level.place} · beat {rival.name}’s score of <strong>{Math.round(level.rivalScore * 100)}%</strong></p>
        <button type="button" className="en-check" onClick={onGo}>Fight! ⚔️</button>
      </div>
    </div>
  )
}

/* ---------- Bonus wheel ---------- */
export const prizes = [
  { label: '+10 XP', color: '#58cc02', xp: 10 },
  { label: '+20 💎', color: '#1cb0f6', gems: 20 },
  { label: '+5 XP', color: '#ff9600', xp: 5 },
  { label: '🧊 Freeze', color: '#8fe3ff', freeze: 1 },
  { label: '+50 XP!', color: '#ffc800', xp: 50 },
  { label: '+15 💎', color: '#ce82ff', gems: 15 },
]
export function Wheel({ onPrize }: { onPrize: (p: (typeof prizes)[number]) => void }) {
  const wheel = useRef<SVGGElement>(null)
  const [spun, setSpun] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const seg = 360 / prizes.length
  const spin = () => {
    if (spinning || spun) return
    setSpinning(true)
    const k = Math.floor(Math.random() * prizes.length)
    // Land segment k under the pointer at the top.
    const target = 360 * 6 + (360 - (k * seg + seg / 2))
    gsap.to(wheel.current, {
      rotate: target, svgOrigin: '150 150', duration: 4.2, ease: 'power4.out',
      onUpdate() { if (Math.random() < 0.25) sfx('tick') },
      onComplete: () => {
        setSpinning(false)
        setSpun(prizes[k].label)
        onPrize(prizes[k])
      },
    })
  }
  return (
    <div className="st-wheel">
      <svg viewBox="0 0 300 320" width="260" aria-label="Bonus wheel" role="img">
        <g ref={wheel}>
          {prizes.map((p, i) => {
            const a0 = ((i * seg - 90) * Math.PI) / 180
            const a1 = (((i + 1) * seg - 90) * Math.PI) / 180
            const mid = ((i * seg + seg / 2 - 90) * Math.PI) / 180
            return (
              <g key={p.label}>
                <path d={`M150 150 L${150 + 140 * Math.cos(a0)} ${150 + 140 * Math.sin(a0)} A140 140 0 0 1 ${150 + 140 * Math.cos(a1)} ${150 + 140 * Math.sin(a1)} Z`} fill={p.color} stroke="#fff" strokeWidth="3" />
                <text x={150 + 90 * Math.cos(mid)} y={150 + 90 * Math.sin(mid)} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="900" fill="#1f1d2b" transform={`rotate(${i * seg + seg / 2} ${150 + 90 * Math.cos(mid)} ${150 + 90 * Math.sin(mid)})`}>{p.label}</text>
              </g>
            )
          })}
          <circle cx="150" cy="150" r="22" fill="#fff" stroke="#1f1d2b" strokeWidth="3" />
        </g>
        <path d="M150 22 L138 0 H162 Z" fill="#1f1d2b" />
      </svg>
      {spun ? <p className="st-prize">You won <strong>{spun}</strong>!</p> : <button type="button" className="en-check" disabled={spinning} onClick={spin}>{spinning ? 'Spinning…' : 'Spin the bonus wheel!'}</button>}
    </div>
  )
}

/* ---------- The story flow ---------- */
type Step =
  | { kind: 'map' }
  | { kind: 'video'; then: Step }
  | { kind: 'talk'; lines: Line[]; sky: [string, string]; then: Step; final?: boolean }
  | { kind: 'vs'; level: number }
  | { kind: 'play'; level: number }
  | { kind: 'wheel'; level: number }

export function StoryMode({ onXp, onGems, onFreeze }: { onXp: (n: number) => void; onGems: (n: number) => void; onFreeze: () => void }) {
  const [state, setState] = useState<StoryState>(() => readStore(STORY_KEY, { cleared: 0, seenPrologue: false }))
  const save = (s: StoryState) => {
    setState(s)
    writeStore(STORY_KEY, s)
  }
  // First visit: the Remotion intro video, then the prologue dialogue.
  const [step, setStep] = useState<Step>(() => (state.seenPrologue ? { kind: 'map' } : { kind: 'video', then: { kind: 'talk', lines: prologue, sky: ['#fff0e0', '#ffc2a8'], then: { kind: 'map' } } }))
  const map = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (step.kind !== 'map' || !map.current) return
    const ctx = gsap.context(() => {
      gsap.from('.st-node', { scale: 0, opacity: 0, stagger: 0.12, duration: 0.5, ease: 'back.out(2)' })
      gsap.fromTo('.st-path', { strokeDashoffset: 900 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' })
      gsap.to('.st-node.is-next', { y: -8, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      gsap.to('.st-well-water', { attr: { y: 70 - state.cleared * 16 }, duration: 1.2, ease: 'power2.out' })
    }, map)
    return () => ctx.revert()
  }, [step, state.cleared])

  const startLevel = (li: number) => {
    const lv = levels[li]
    setStep({ kind: 'talk', lines: lv.before, sky: lv.sky, final: li === levels.length - 1, then: { kind: 'vs', level: li } })
  }
  const done = (li: number, r: LessonResult) => {
    const lv = levels[li]
    const acc = r.total ? r.correct / r.total : 0
    if (acc >= lv.rivalScore) {
      burst(undefined, 'stars')
      onXp(15)
      if (li + 1 > state.cleared) save({ ...state, cleared: li + 1 })
      setStep({ kind: 'talk', lines: [['beacon', `Final score: ${Math.round(acc * 100)}% vs ${Math.round(lv.rivalScore * 100)}%. The winner is… YOU!`], ...lv.after], sky: lv.sky, final: li === levels.length - 1, then: { kind: 'wheel', level: li } })
    } else {
      setStep({ kind: 'talk', lines: [['beacon', `Final score: ${Math.round(acc * 100)}% vs ${Math.round(lv.rivalScore * 100)}%.`], ...lv.lose], sky: lv.sky, then: { kind: 'map' } })
    }
  }

  if (step.kind === 'video')
    return (
      <Suspense fallback={<p role="status">Loading the intro…</p>}>
        <IntroPlayer video="wordWell" onEnd={() => setStep(step.then)} />
      </Suspense>
    )
  if (step.kind === 'talk')
    return <Dialogue key={step.lines[0][1]} lines={step.lines} sky={step.sky} final={step.final} onDone={() => { if (!state.seenPrologue) save({ ...state, seenPrologue: true }); setStep(step.then) }} />
  if (step.kind === 'vs') return <Versus level={levels[step.level]} onGo={() => setStep({ kind: 'play', level: step.level })} />
  if (step.kind === 'play') {
    const lv = levels[step.level]
    const exercises = makeLesson(units[lv.unit], 2, { speak: false }).slice(0, 8)
    return <LessonPlayer title={lv.title} exercises={exercises} hearts={5} onHeartLost={() => {}} onDone={(r) => done(step.level, r)} onQuit={() => setStep({ kind: 'map' })} theme={unitThemes[units[lv.unit].id]} />
  }
  if (step.kind === 'wheel')
    return (
      <Scene sky={levels[step.level].sky} final>
        <div className="st-wheel-wrap">
          <h3>Bonus round!</h3>
          <Wheel onPrize={(p) => { if (p.xp) onXp(p.xp); if (p.gems) onGems(p.gems); if (p.freeze) onFreeze(); burst(undefined, 'coins') }} />
          <button type="button" className="studio-btn" onClick={() => setStep({ kind: 'map' })}>Back to the tournament map</button>
        </div>
      </Scene>
    )

  const champion = state.cleared >= levels.length
  return (
    <div ref={map} className="st-map">
      <header>
        <h3>🏆 Story: The Word Well</h3>
        <p>{champion ? 'You are the champion — Bloom World is saved! Replay any match for fun.' : 'Win the Grand English Tournament to refill the Word Well and save Bloom World.'}</p>
      </header>
      <svg className="st-map-svg" viewBox="0 0 640 220" aria-hidden="true">
        <path className="st-path" d="M60 170 C 160 60, 240 60, 320 130 S 480 200, 580 80" fill="none" stroke="var(--border-color)" strokeWidth="6" strokeDasharray="900" strokeLinecap="round" />
        <g transform="translate(560 120)">
          <rect x="-26" y="10" width="52" height="60" rx="6" fill="#8d6e63" />
          <clipPath id="st-well-clip"><rect x="-22" y="14" width="44" height="52" rx="4" /></clipPath>
          <rect className="st-well-water" x="-22" y="70" width="44" height="60" fill="#1cb0f6" clipPath="url(#st-well-clip)" />
          <text y="95" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor">Word Well</text>
        </g>
      </svg>
      <div className="st-nodes">
        {levels.map((lv, i) => {
          const open = i <= state.cleared
          const cleared = i < state.cleared
          return (
            <button key={lv.id} type="button" className={`st-node ${cleared ? 'is-done' : open ? 'is-next' : ''}`} disabled={!open} style={{ ['--who' as string]: cast[lv.rival].color }} onClick={() => startLevel(i)}>
              <BloomFace variant={cast[lv.rival].face} size={64} follow={false} waveOnMount={false} label={cast[lv.rival].name} />
              <strong>{lv.title}</strong>
              <small>{open ? `vs ${cast[lv.rival].name}` : '🔒 Locked'}{cleared ? ' · ✓ won' : ''}</small>
            </button>
          )
        })}
      </div>
      <div className="en-inline">
        <button type="button" className="studio-btn" onClick={() => setStep({ kind: 'video', then: { kind: 'map' } })}>▶ Watch the intro</button>
        <button type="button" className="en-link" onClick={() => setStep({ kind: 'talk', lines: prologue, sky: ['#fff0e0', '#ffc2a8'], then: { kind: 'map' } })}>Replay the prologue</button>
      </div>
    </div>
  )
}
