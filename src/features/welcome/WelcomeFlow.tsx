import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ChevronLeft } from 'lucide-react'
import { BloomFace, type BloomFaceHandle } from '../../components/ui/BloomFace'
import type { FeatureFlags } from '../../settings/appSettings'
import { questions, themeSwatches, type Answers } from './welcomeModel'
import './welcome.css'

const reduced = () => !!prefersReducedMotion()
type Step = 'intro' | number | 'build' | 'done'

/** Drifting SVG petals behind the whole flow. */
function PetalSky() {
  const root = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!root.current || reduced()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGElement>('.wf-petal').forEach((p, i) => {
        gsap.set(p, { x: gsap.utils.random(0, 1000), y: gsap.utils.random(-100, 700), rotate: gsap.utils.random(0, 360) })
        gsap.to(p, { y: '+=900', x: `+=${gsap.utils.random(-120, 120)}`, rotate: '+=360', duration: gsap.utils.random(14, 26), repeat: -1, ease: 'none', delay: -i * 1.7, modifiers: { y: (y: string) => `${((parseFloat(y) + 100) % 900) - 100}px` } })
      })
    }, root.current)
    return () => ctx.revert()
  }, [])
  return (
    <svg ref={root} className="wf-sky" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} className="wf-petal" d="M0 0 C 8 -12, 20 -8, 18 4 C 14 14, 2 10, 0 0 Z" fill={['#ffc1a1', '#ffd9c2', '#f7a8b8', '#ffe3a3'][i % 4]} opacity="0.55" />
      ))}
    </svg>
  )
}

/** Final screen: a flower grows a petal per chosen feature; chips fly into it. */
function BuildBloom({ chips, onDone }: { chips: string[]; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const petals = el.querySelectorAll('.wb-petal')
    const items = el.querySelectorAll('.wb-chip')
    if (reduced()) {
      const t = setTimeout(onDone, 600)
      return () => clearTimeout(t)
    }
    const tl = gsap.timeline({ onComplete: onDone })
    tl.from('.wb-stem', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, ease: 'power2.out' })
      .from('.wb-leaf', { scale: 0, transformOrigin: '50% 100%', stagger: 0.1, duration: 0.4, ease: 'back.out(3)' })
    items.forEach((chip, i) => {
      tl.fromTo(chip, { opacity: 0, y: 30, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' }, `>-0.05`)
        .to(chip, { x: () => {
          const r = chip.getBoundingClientRect()
          const f = el.querySelector('.wb-flower')!.getBoundingClientRect()
          return f.left + f.width / 2 - (r.left + r.width / 2)
        }, y: () => {
          const r = chip.getBoundingClientRect()
          const f = el.querySelector('.wb-flower')!.getBoundingClientRect()
          return f.top + f.height * 0.35 - (r.top + r.height / 2)
        }, scale: 0.2, opacity: 0, duration: 0.45, ease: 'power2.in' }, '>0.05')
        .fromTo(petals[i % petals.length], { scale: 0 }, { scale: 1, transformOrigin: '100px 90px', duration: 0.4, ease: 'back.out(3)' }, '<0.3')
    })
    tl.to('.wb-core', { scale: 1.3, transformOrigin: '100px 90px', yoyo: true, repeat: 1, duration: 0.25 }).to(el.querySelector('.wb-flower'), { rotate: 360, transformOrigin: '100px 90px', duration: 1, ease: 'power2.inOut' }, '<')
    return () => void tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const n = Math.max(6, Math.min(12, chips.length))
  return (
    <div ref={root} className="wf-build">
      <svg className="wb-svg" viewBox="0 0 200 240" aria-hidden="true">
        <path className="wb-stem" d="M100 230 C 96 190, 104 150, 100 110" stroke="#4f9d3a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path className="wb-leaf" d="M100 190 C 70 180, 64 160, 72 150 C 88 158, 98 172, 100 190Z" fill="#6cc04a" />
        <path className="wb-leaf" d="M100 170 C 130 160, 138 140, 128 132 C 112 140, 102 154, 100 170Z" fill="#6cc04a" />
        <g className="wb-flower">
          {Array.from({ length: n }, (_, i) => (
            <ellipse key={i} className="wb-petal" cx="100" cy="62" rx="14" ry="28" fill={['#ffb07a', '#f07a4a', '#f7a8b8', '#ffd07a'][i % 4]} transform={`rotate(${(i * 360) / n} 100 90)`} />
          ))}
          <circle className="wb-core" cx="100" cy="90" r="16" fill="#ffd54f" />
        </g>
      </svg>
      <div className="wb-chips">
        {chips.map((c) => (
          <span key={c} className="wb-chip">{c}</span>
        ))}
      </div>
    </div>
  )
}

export function WelcomeFlow({
  onFinish,
  onSkip,
  preview,
}: {
  onFinish: (answers: Answers) => void
  onSkip: () => void
  /** Names of features the answers will turn on, for the build animation. */
  preview: (answers: Answers) => { names: string[]; features: FeatureFlags | null }
}) {
  const [step, setStep] = useState<Step>('intro')
  const [answers, setAnswers] = useState<Answers>({})
  const face = useRef<BloomFaceHandle>(null)
  const stage = useRef<HTMLDivElement>(null)
  const cont = useRef<HTMLButtonElement>(null)
  const q = typeof step === 'number' ? questions[step] : null
  const picked = q ? (answers[q.id] ?? []) : []
  const canGo = step === 'intro' || step === 'done' || (q ? picked.length > 0 : false)
  const chips = useMemo(() => (step === 'build' || step === 'done' ? preview(answers).names.slice(0, 12) : []), [step, answers, preview])

  // New screen: content slides in, Bloom "talks", options pop in.
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    face.current?.react(step === 'done' ? 'excited' : 'talk')
    if (reduced()) return
    const tl = gsap.timeline()
    tl.fromTo(el.querySelector('.wf-say'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
    const opts = el.querySelectorAll('.wf-opt')
    if (opts.length) tl.fromTo(opts, { opacity: 0, y: 24, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, stagger: 0.05, duration: 0.4, ease: 'back.out(1.8)' }, '-=0.15')
    return () => void tl.progress(1)
  }, [step])

  // Continue wakes up when an answer is chosen.
  useEffect(() => {
    if (!cont.current || !canGo || reduced()) return
    const tw = gsap.fromTo(cont.current, { scale: 0.96 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.4)' })
    return () => void tw.progress(1)
  }, [canGo])

  const choose = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!q) return
    const has = picked.includes(id)
    const next = q.multi ? (has ? picked.filter((x) => x !== id) : [...picked, id].slice(-q.multi)) : [id]
    setAnswers({ ...answers, [q.id]: next })
    face.current?.react(has ? 'think' : 'happy')
    if (!has && !reduced()) {
      const tick = e.currentTarget.querySelector('.wf-tick path')
      if (tick) gsap.fromTo(tick, { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' })
      gsap.fromTo(e.currentTarget, { scale: 0.94 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.4)' })
    }
  }
  const next = () => {
    if (!canGo) return
    if (step === 'intro') return setStep(0)
    if (typeof step === 'number') return setStep(step + 1 < questions.length ? step + 1 : 'build')
    if (step === 'done') onFinish(answers)
  }
  const back = () => setStep(step === 0 ? 'intro' : typeof step === 'number' ? step - 1 : step === 'done' ? questions.length - 1 : 'intro')

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Enter') next()
      if (e.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  const say =
    step === 'intro' ? (
      <>
        <strong>Hi, I’m Bloom!</strong>
        <span>I’ll set up your space around you. A few quick questions?</span>
      </>
    ) : step === 'build' ? (
      <strong>Growing your Bloom…</strong>
    ) : step === 'done' ? (
      <>
        <strong>Your Bloom is ready.</strong>
        <span>I turned on {chips.length} things for you. Change anything later in Settings.</span>
      </>
    ) : (
      <>
        <strong>{q!.ask}</strong>
        {q!.sub && <span>{q!.sub}</span>}
      </>
    )

  const progress = step === 'intro' ? 0 : typeof step === 'number' ? step + 1 : questions.length
  return createPortal(
    <div className="wf-root" role="dialog" aria-modal="true" aria-label="Welcome to Bloom">
      <PetalSky />
      <header className="wf-top">
        {step !== 'intro' && step !== 'build' ? (
          <button type="button" className="wf-back" aria-label="Back" onClick={back}>
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span className="wf-back" />
        )}
        <div className="wf-bars" aria-label={`Step ${progress} of ${questions.length}`}>
          {questions.map((x, i) => (
            <span key={x.id}>
              <i style={{ transform: `scaleX(${i < progress ? 1 : 0})` }} />
            </span>
          ))}
        </div>
        <button type="button" className="wf-skip" onClick={onSkip}>
          Skip
        </button>
      </header>
      <main ref={stage} className={`wf-stage ${step === 'intro' || step === 'done' || step === 'build' ? 'center' : ''}`}>
        <div className={`wf-ask ${q ? 'row' : 'col'}`}>
          <BloomFace ref={face} size={112} />
          <p className="wf-say" key={String(step)}>
            {say}
          </p>
        </div>
        {q && (
          <div className={`wf-opts ${q.kind ?? 'cards'}`} role={q.multi ? 'group' : 'radiogroup'} aria-label={q.ask}>
            {q.options.map((o) => {
              const on = picked.includes(o.id)
              const sw = themeSwatches[o.id]
              return (
                <button key={o.id} type="button" role={q.multi ? 'checkbox' : 'radio'} aria-checked={on} className="wf-opt" data-on={on} onClick={(e) => choose(o.id, e)}>
                  {q.kind === 'theme' && sw ? (
                    <svg className="wf-theme" viewBox="0 0 80 56" aria-hidden="true">
                      <rect width="80" height="56" rx="8" fill={sw[0]} />
                      <rect x="6" y="8" width="18" height="40" rx="4" fill={sw[1]} />
                      <rect x="30" y="8" width="44" height="12" rx="4" fill={sw[1]} />
                      <rect x="30" y="25" width="28" height="6" rx="3" fill={sw[2]} />
                      <rect x="30" y="35" width="40" height="4" rx="2" fill={sw[3]} opacity="0.5" />
                      <circle cx="15" cy="16" r="4" fill={sw[2]} />
                    </svg>
                  ) : (
                    <span className="wf-emoji" aria-hidden="true">{o.emoji}</span>
                  )}
                  <span className="wf-label bloom-stack">
                    <strong>{o.label}</strong>
                    {o.hint && <small>{o.hint}</small>}
                  </span>
                  <svg className="wf-tick" viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="10" r="9" />
                    <path d="M5.5 10.5 L8.5 13.5 L14.5 7" strokeDasharray="24" strokeDashoffset={on ? 0 : 24} />
                  </svg>
                </button>
              )
            })}
          </div>
        )}
        {(step === 'build' || step === 'done') && <BuildBloom chips={chips} onDone={() => setStep('done')} />}
      </main>
      <footer className="wf-foot">
        {step !== 'build' && (
          <button ref={cont} type="button" className="wf-continue" disabled={!canGo} onClick={next}>
            {step === 'done' ? 'Let’s bloom' : 'Continue'}
          </button>
        )}
      </footer>
    </div>,
    document.body,
  )
}
