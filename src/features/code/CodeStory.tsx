import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { BloomFace } from '../../components/ui/BloomFace'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { setQuiz } from '../../companion/quizContext'
import { Dialogue, Scene, Versus, Wheel, cast, type Line } from '../english/StoryMode'
import { sfx } from '../english/sfx'
import '../english/english.css'
import '../english/story.css'

const IntroPlayer = lazy(() => import('../english/video/IntroPlayer').then((m) => ({ default: m.IntroPlayer })))

/**
 * Story mode for Learn to code — “The Code Cup”. GLITCH has scrambled the
 * Lighthouse code and Bloom World is going dark; only the Code Cup champion
 * gets the Debug Key. Three code duels (predict the output / spot the bug)
 * against a racing rival, Persona-style dialogue around each, a bonus wheel,
 * a Remotion intro and a finale video once you win the Cup.
 */
type Q = { q: string; code?: string; options: string[]; answer: number; why: string }
type Round = { id: string; title: string; place: string; rival: keyof typeof cast; rivalScore: number; sky: [string, string]; questions: Q[]; before: Line[]; after: Line[]; lose: Line[] }

const prologue: Line[] = [
  ['bloom', 'The Lighthouse just went dark… and the code on the screen says “console.lgo”.'],
  ['glitch', 'Heh heh. That was me. I scrambled everything. Good luck reading it!'],
  ['tinker', 'Only the champion of the Code Cup can hold the Debug Key and fix it.'],
  ['pix', 'CODE CUP! CODE CUP! Contestants, warm up your semicolons!'],
  ['bloom', 'You can do this. Well — we can. I’ll hold the snacks.'],
]
const rounds: Round[] = [
  {
    id: 'heats', title: 'Round 1 · Hello World Heats', place: 'Syntax Garden', rival: 'mochi', rivalScore: 0.6, sky: ['#ffd6e8', '#b5bdf3'],
    questions: [
      { q: 'What does this print?', code: "console.log('Bloom' + 1)", options: ['Bloom1', 'Bloom 1', '2', 'Error'], answer: 0, why: 'Adding a number to a string joins them.' },
      { q: 'Spot the bug', code: "consol.log('hi')", options: ['Missing semicolon', 'consol should be console', "Use double quotes", 'Nothing'], answer: 1, why: 'The object is called console.' },
      { q: 'What does this print?', code: 'let x = 3\nx = x * 2\nconsole.log(x)', options: ['3', '5', '6', 'x'], answer: 2, why: 'x becomes 3 × 2 = 6.' },
      { q: 'Which line makes a constant?', options: ['let a = 1', 'const a = 1', 'var a = 1', 'a := 1'], answer: 1, why: 'const cannot be reassigned.' },
      { q: 'What does this print?', code: 'console.log(typeof "42")', options: ['number', 'string', '42', 'text'], answer: 1, why: 'Anything in quotes is a string.' },
    ],
    before: [
      ['beacon', 'Round one! Keyboards ready. No copy-pasting from the audience!'],
      ['mochi', 'I only know console.log… but I know it emotionally.'],
      ['pix', 'Mochi is glowing a nervous shade of lavender!'],
    ],
    after: [
      ['mochi', 'You won! I’m turning happy-yellow. That’s allowed, right?'],
      ['glitch', 'Pfft. Beginner’s luck. Wait until you meet my loops.'],
    ],
    lose: [['mochi', 'I… won? Quick, someone screenshot my colour!'], ['bloom', 'Shake it off — rematch!']],
  },
  {
    id: 'loops', title: 'Round 2 · The Loop-de-Loop', place: 'Rollercoaster of Recursion', rival: 'sparky', rivalScore: 0.75, sky: ['#ffe0b8', '#ff8a5a'],
    questions: [
      { q: 'How many times does this log?', code: 'for (let i = 0; i < 4; i++) console.log(i)', options: ['3', '4', '5', 'Forever'], answer: 1, why: 'i goes 0, 1, 2, 3.' },
      { q: 'What does this print?', code: 'const n = 7\nconsole.log(n > 5 ? "big" : "small")', options: ['big', 'small', 'true', '7'], answer: 0, why: '7 > 5, so the ternary picks "big".' },
      { q: 'Spot the bug', code: 'for (let i = 0; i < 5; i--) {}', options: ['i-- never reaches 5 (infinite loop)', 'Needs var', 'Missing braces', 'Nothing'], answer: 0, why: 'Counting down from 0 never hits 5.' },
      { q: 'What does this print?', code: 'console.log(10 === "10")', options: ['true', 'false', '10', 'Error'], answer: 1, why: '=== checks the type too.' },
      { q: 'What does this print?', code: 'let s = 0\nfor (const n of [1, 2, 3]) s += n\nconsole.log(s)', options: ['3', '6', '123', '0'], answer: 1, why: '1 + 2 + 3 = 6.' },
    ],
    before: [
      ['sparky', 'I heard the prize is a lifetime supply of stickers.'],
      ['tinker', 'The prize is the Debug Key.'],
      ['sparky', '…Does the key have stickers on it?'],
      ['pix', 'Sparky only joined for the free swag! The crowd respects it!'],
    ],
    after: [
      ['sparky', 'I lost, but I got a free lanyard AND a sticker. Best day ever.'],
      ['sparky', 'Heads up: the final is UNIT-7. It speed-read the whole manual. Twice.'],
    ],
    lose: [['sparky', 'I WON?! Do I get stickers now? …I have to keep coding? Ugh.'], ['bloom', 'Try again — the Lighthouse is counting on you!']],
  },
  {
    id: 'final', title: 'The Function Finals', place: 'Lighthouse Arena', rival: 'unit7', rivalScore: 0.85, sky: ['#030a05', '#39ff6a'],
    questions: [
      { q: 'What does this return?', code: 'function add(a, b) { return a + b }\nadd(2, 5)', options: ['25', '7', 'undefined', 'ab'], answer: 1, why: 'return a + b gives 7.' },
      { q: 'What does this print?', code: 'const double = n => n * 2\nconsole.log(double(21))', options: ['21', '42', 'n2', 'undefined'], answer: 1, why: 'The arrow function returns n * 2.' },
      { q: 'What does this print?', code: 'console.log([1, 2, 3].map(n => n * 10))', options: ['[10, 20, 30]', '60', '[1, 2, 3]', '[11, 12, 13]'], answer: 0, why: 'map applies n * 10 to each item.' },
      { q: 'Spot the bug', code: 'const f = (x) => { x + 1 }\nf(1)', options: ['Needs return inside braces', 'Arrow functions can’t take x', 'Missing semicolon', 'Nothing'], answer: 0, why: 'With braces you must write return.' },
      { q: 'What does this print?', code: 'console.log([5, 8, 2].filter(n => n > 4).length)', options: ['1', '2', '3', '15'], answer: 1, why: '5 and 8 pass the test.' },
      { q: 'What does this print?', code: 'const pet = { name: "Mochi" }\nconsole.log(pet.name.length)', options: ['4', '5', 'undefined', 'Mochi'], answer: 1, why: '"Mochi" has 5 letters.' },
    ],
    before: [
      ['unit7', 'I learned to code. Now I am bored faster.'],
      ['glitch', 'Beat the robot and I’ll… um… I’ll be very upset!'],
      ['unit7', 'Defeat me, human, and I may experience “fun”. Statistically unlikely.'],
      ['pix', 'FINAL ROUND! The Lighthouse is flickering! NO PRESSURE!'],
    ],
    after: [
      ['unit7', 'Error: defeat detected. New emotion unlocked: …respect?'],
      ['tinker', 'Champion! Take the Debug Key — go fix that Lighthouse!'],
    ],
    lose: [['unit7', 'Victory. Emotion: still bored. Try again, human.'], ['bloom', 'So close! Once more — for the Lighthouse!']],
  },
]

const STORY_KEY = 'bloom-code-story-v1'
type StoryState = { cleared: number; seenIntro: boolean; seenFinale: boolean }

/* ---------- A code duel: questions vs. a racing rival bar ---------- */
function Duel({ round, onDone, onQuit }: { round: Round; onDone: (score: number) => void; onQuit: () => void }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const card = useRef<HTMLDivElement>(null)
  const rivalBar = useRef<HTMLElement>(null)
  const q = round.questions[i]
  const total = round.questions.length
  useEffect(() => {
    // The rival “types” along at a steady pace towards its target score.
    const tw = rivalBar.current ? gsap.fromTo(rivalBar.current, { width: '0%' }, { width: `${round.rivalScore * 100}%`, duration: 8 + total * 5, ease: 'none' }) : null
    return () => void tw?.kill()
  }, [round, total])
  useLayoutEffect(() => {
    if (card.current) gsap.fromTo(card.current, { rotateY: -80, opacity: 0, transformPerspective: 900 }, { rotateY: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' })
    setQuiz({ source: 'Code Cup', question: q.q + (q.code ? ` ${q.code}` : ''), answer: q.options[q.answer], options: q.options, explain: q.why })
    return () => setQuiz(null)
  }, [i, q])
  const pick = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    const ok = k === q.answer
    if (ok) setCorrect((c) => c + 1)
    sfx(ok ? 'right' : 'wrong')
    if (!ok && card.current) gsap.fromTo(card.current, { x: -12 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
  }
  const next = () => {
    if (i + 1 >= total) return onDone(correct / total)
    setI(i + 1)
    setPicked(null)
  }
  const r = cast[round.rival]
  return (
    <Scene sky={round.sky} final={round.id === 'final'}>
      <div className="cs-duel">
        <div className="cs-bars">
          <div className="cs-bar you"><span><BloomFace variant="bloom" size={30} follow={false} waveOnMount={false} label="" /> You</span><em><i style={{ width: `${(correct / total) * 100}%` }} /></em><b>{correct}/{total}</b></div>
          <div className="cs-bar rival" style={{ filter: r.tint }}><span><BloomFace variant={r.face} size={30} follow={false} waveOnMount={false} label="" /> {r.name}</span><em><i ref={rivalBar} style={{ background: r.color }} /></em><b>{Math.round(round.rivalScore * total)}/{total}</b></div>
        </div>
        <div ref={card} className="cs-card">
          <small>{round.title} · question {i + 1} of {total}</small>
          <h3>{q.q}</h3>
          {q.code && <pre className="cd-snippet">{q.code}</pre>}
          <div className="cd-opts">
            {q.options.map((o, k) => (
              <button key={o} type="button" className={`cd-opt ${picked !== null && k === q.answer ? 'right' : ''} ${picked === k && k !== q.answer ? 'wrong' : ''}`} disabled={picked !== null} onClick={() => pick(k)}>
                <kbd>{'ABCD'[k]}</kbd> <code>{o}</code>
              </button>
            ))}
          </div>
          {picked !== null && <p className="cd-why">{picked === q.answer ? '✅ ' : '❌ '}{q.why}</p>}
          <div className="cd-help">
            <button type="button" className="studio-btn" onClick={onQuit}>Leave match</button>
            {picked !== null && <button type="button" className="cd-run" onClick={next}>{i + 1 >= total ? 'Final score →' : 'Next →'}</button>}
          </div>
        </div>
      </div>
    </Scene>
  )
}

type Step =
  | { kind: 'map' }
  | { kind: 'video'; video: 'codeCupIntro' | 'codeCupFinale'; then: Step }
  | { kind: 'talk'; lines: Line[]; sky: [string, string]; then: Step; final?: boolean }
  | { kind: 'vs'; round: number }
  | { kind: 'play'; round: number }
  | { kind: 'wheel'; round: number }

export function CodeStory({ onXp }: { onXp: (n: number) => void }) {
  const [state, setState] = useState<StoryState>(() => readStore(STORY_KEY, { cleared: 0, seenIntro: false, seenFinale: false }))
  const save = (s: StoryState) => {
    setState(s)
    writeStore(STORY_KEY, s)
  }
  const talkPrologue: Step = { kind: 'talk', lines: prologue, sky: ['#1c2b3f', '#0d0d12'], then: { kind: 'map' } }
  const [step, setStep] = useState<Step>(() => (state.seenIntro ? { kind: 'map' } : { kind: 'video', video: 'codeCupIntro', then: talkPrologue }))
  const map = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (step.kind !== 'map' || !map.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.st-node', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.12, duration: 0.5, ease: 'back.out(2)' })
      gsap.fromTo('.cs-path', { strokeDashoffset: 900 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' })
      gsap.to('.st-node.is-next', { y: -8, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      gsap.to('.cs-beam', { opacity: state.cleared >= rounds.length ? 0.9 : 0.1 + state.cleared * 0.2, duration: 1 })
    }, map)
    return () => ctx.revert()
  }, [step, state.cleared])

  const done = (ri: number, score: number) => {
    const r = rounds[ri]
    const won = score >= r.rivalScore
    const verdict: Line = ['beacon', `Final score: ${Math.round(score * 100)}% vs ${Math.round(r.rivalScore * 100)}%. ${won ? 'The winner is… YOU!' : 'Not this time.'}`]
    if (!won) return setStep({ kind: 'talk', lines: [verdict, ...r.lose], sky: r.sky, then: { kind: 'map' } })
    burst(undefined, 'stars')
    onXp(20)
    const champion = ri === rounds.length - 1
    if (ri + 1 > state.cleared) save({ ...state, cleared: ri + 1, seenFinale: state.seenFinale || champion })
    const afterWheel: Step = champion ? { kind: 'video', video: 'codeCupFinale', then: { kind: 'map' } } : { kind: 'map' }
    setStep({ kind: 'talk', lines: [verdict, ...r.after], sky: r.sky, final: champion, then: { kind: 'wheel', round: ri } })
    wheelNext.current = afterWheel
  }
  const wheelNext = useRef<Step>({ kind: 'map' })

  if (step.kind === 'video')
    return (
      <Suspense fallback={<p role="status">Loading the video…</p>}>
        <IntroPlayer video={step.video} onEnd={() => { if (step.video === 'codeCupIntro' && !state.seenIntro) save({ ...state, seenIntro: true }); setStep(step.then) }} />
      </Suspense>
    )
  if (step.kind === 'talk') return <Dialogue key={step.lines[0][1]} lines={step.lines} sky={step.sky} final={step.final} onDone={() => setStep(step.then)} />
  if (step.kind === 'vs') return <Versus level={rounds[step.round]} onGo={() => setStep({ kind: 'play', round: step.round })} />
  if (step.kind === 'play') return <Duel round={rounds[step.round]} onDone={(s) => done(step.round, s)} onQuit={() => setStep({ kind: 'map' })} />
  if (step.kind === 'wheel')
    return (
      <Scene sky={rounds[step.round].sky} final>
        <div className="st-wheel-wrap">
          <h3>Bonus round!</h3>
          <Wheel onPrize={(p) => { onXp((p.xp ?? 0) + (p.gems ?? 0)); burst(undefined, 'coins') }} />
          <button type="button" className="studio-btn" onClick={() => setStep(wheelNext.current)}>{step.round === rounds.length - 1 ? 'Watch the finale ▶' : 'Back to the bracket'}</button>
        </div>
      </Scene>
    )

  const champion = state.cleared >= rounds.length
  return (
    <div ref={map} className="st-map cs-map">
      <header>
        <h3>🏆 Story: The Code Cup</h3>
        <p>{champion ? 'Champion! The Lighthouse shines again. Replay any duel for fun.' : 'Win three code duels to earn the Debug Key and relight Bloom World’s Lighthouse.'}</p>
      </header>
      <svg className="st-map-svg" viewBox="0 0 640 200" aria-hidden="true">
        <path className="cs-path" d="M60 160 C 160 60, 240 60, 320 120 S 480 190, 560 90" fill="none" stroke="var(--border-color)" strokeWidth="6" strokeDasharray="900" strokeLinecap="round" />
        <g transform="translate(575 40)">
          <path className="cs-beam" d="M0 30 L-120 0 L-120 60 Z" fill="#fff6a8" opacity="0.1" />
          <path d="M-14 150 L-8 40 L8 40 L14 150 Z" fill="#f4f1de" stroke="#ff4b4b" strokeWidth="2" />
          <rect x="-12" y="18" width="24" height="22" rx="4" fill="#1f1d2b" />
          <circle cx="0" cy="29" r="7" fill={champion ? '#fff6a8' : '#555'} />
          <path d="M-14 18 L0 4 L14 18 Z" fill="#ff4b4b" />
        </g>
      </svg>
      <div className="st-nodes">
        {rounds.map((r, i) => {
          const open = i <= state.cleared
          const cleared = i < state.cleared
          return (
            <button key={r.id} type="button" className={`st-node ${cleared ? 'is-done' : open ? 'is-next' : ''}`} disabled={!open} style={{ ['--who' as string]: cast[r.rival].color }} onClick={() => setStep({ kind: 'talk', lines: r.before, sky: r.sky, final: i === rounds.length - 1, then: { kind: 'vs', round: i } })}>
              <span style={{ filter: cast[r.rival].tint }}><BloomFace variant={cast[r.rival].face} size={64} follow={false} waveOnMount={false} label={cast[r.rival].name} /></span>
              <strong>{r.title}</strong>
              <small>{open ? `vs ${cast[r.rival].name}` : '🔒 Locked'}{cleared ? ' · ✓ won' : ''}</small>
            </button>
          )
        })}
      </div>
      <div className="cs-row">
        <button type="button" className="studio-btn" onClick={() => setStep({ kind: 'video', video: 'codeCupIntro', then: { kind: 'map' } })}>▶ Watch the intro</button>
        {state.seenFinale && <button type="button" className="studio-btn" onClick={() => setStep({ kind: 'video', video: 'codeCupFinale', then: { kind: 'map' } })}>▶ Watch the finale</button>}
        <button type="button" className="studio-btn" onClick={() => setStep(talkPrologue)}>Replay the prologue</button>
      </div>
    </div>
  )
}
