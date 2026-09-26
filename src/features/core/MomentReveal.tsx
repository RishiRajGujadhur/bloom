import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import confetti from 'canvas-confetti'
import { X } from 'lucide-react'
import { subOn } from '../subFeatures'
import './core.css'

/**
 * Rewards as moments, not notifications:
 *   1. anticipation — a seed pod trembles ("Bloom discovered something…")
 *   2. reveal       — it opens and the words bloom in, one by one
 *   3. celebration  — petals, a soft chime and a tiny haptic tap
 * Reserved for meaningful moments; ordinary actions stay quiet.
 */
export const MOMENT_EVENT = 'bloom:moment'
export type MomentDetail = {
  kind: 'discovery' | 'stage' | 'day' | 'week' | 'welcome'
  kicker: string
  title: string
  body: string
  rare?: boolean
  stats?: { label: string; value: string }[]
}
export const showMoment = (d: MomentDetail) => window.dispatchEvent(new CustomEvent<MomentDetail>(MOMENT_EVENT, { detail: d }))

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function chime(rare: boolean) {
  try {
    const ac = new AudioContext()
    ;(rare ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 987.77]).forEach((f, i) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t = ac.currentTime + i * 0.12
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
      o.connect(g).connect(ac.destination)
      o.start(t)
      o.stop(t + 2)
    })
    setTimeout(() => void ac.close(), 2600)
  } catch {
    /* optional */
  }
}

function Moment({ m, onClose }: { m: MomentDetail; onClose: () => void }) {
  const [phase, setPhase] = useState<'anticipate' | 'reveal'>(reduced() ? 'reveal' : 'anticipate')
  const pod = useRef<HTMLButtonElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  const open = useCallback(() => setPhase('reveal'), [])

  // 1. Anticipation: the pod trembles, glowing brighter, then opens itself.
  useLayoutEffect(() => {
    if (phase !== 'anticipate' || !pod.current) return
    const tl = gsap
      .timeline({ onComplete: open })
      .fromTo(pod.current, { scale: 0.4, opacity: 0, rotation: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' })
      .to(pod.current, { rotation: 6, duration: 0.07, yoyo: true, repeat: 9, ease: 'sine.inOut' })
      .to(pod.current, { scale: 1.15, filter: 'brightness(1.3)', duration: 0.4, ease: 'power2.in' })
    return () => void tl.kill()
  }, [phase, open])

  // 2 + 3. Reveal the words, then celebrate.
  useLayoutEffect(() => {
    if (phase !== 'reveal' || !card.current) return
    closeBtn.current?.focus()
    if (reduced()) return
    const words = card.current.querySelectorAll('.moment-word')
    const tl = gsap
      .timeline()
      .from(card.current, { scale: 0.85, opacity: 0, y: 20, duration: 0.5, ease: 'back.out(1.8)' })
      .from(words, { opacity: 0, y: 10, filter: 'blur(6px)', duration: 0.5, stagger: 0.035, ease: 'power2.out' }, 0.2)
      .from(card.current.querySelectorAll('.moment-stat'), { opacity: 0, y: 12, stagger: 0.08, duration: 0.4 }, '-=0.2')
      .add(() => {
        const r = card.current?.getBoundingClientRect()
        if (r && subOn('bloomCore', 'celebration'))
          void confetti({
            particleCount: m.rare ? 120 : 60,
            spread: 80,
            startVelocity: 28,
            origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + 30) / innerHeight },
            colors: m.rare ? ['#f2c14e', '#fff3c4', '#e0903a'] : ['#f4a7b9', '#f7c7a8', '#c9e4c5', '#fff'],
            scalar: 0.8,
            disableForReducedMotion: true,
          })
        if (subOn('bloomCore', 'celebration')) chime(!!m.rare)
        navigator.vibrate?.(m.rare ? [20, 40, 30] : 18)
      }, 0.35)
    return () => void tl.progress(1).kill()
  }, [phase, m.rare])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const words = m.body.split(' ')
  return (
    <div className="moment-backdrop" onClick={phase === 'reveal' ? onClose : open}>
      {phase === 'anticipate' ? (
        <div className="moment-anticipate">
          <button ref={pod} className="moment-pod" data-rare={m.rare} aria-label="Open" onClick={open}>
            <svg viewBox="0 0 80 100" aria-hidden="true">
              <path d="M40 8 C66 30 70 64 40 92 C10 64 14 30 40 8 Z" className="moment-pod-shell" />
              <path d="M40 16 C40 40 40 70 40 88" className="moment-pod-seam" />
            </svg>
          </button>
          <p>{m.kicker}…</p>
        </div>
      ) : (
        <div ref={card} className="moment-card" data-kind={m.kind} data-rare={m.rare} role="alertdialog" aria-labelledby="moment-title" aria-describedby="moment-body" onClick={(e) => e.stopPropagation()}>
          <button ref={closeBtn} className="moment-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
          <span className="moment-kicker">{m.rare ? `Rare · ${m.kicker}` : m.kicker}</span>
          <h2 id="moment-title">{m.title}</h2>
          <p id="moment-body">
            {words.map((w, i) => (
              <span key={i} className="moment-word">
                {w}{' '}
              </span>
            ))}
          </p>
          {m.stats && (
            <div className="moment-stats">
              {m.stats.map((s) => (
                <div key={s.label} className="moment-stat">
                  <strong>{s.value}</strong>
                  <small>{s.label}</small>
                </div>
              ))}
            </div>
          )}
          <button className="ov-primary moment-cta" onClick={onClose}>
            Keep growing
          </button>
        </div>
      )}
    </div>
  )
}

/** Mounted once. Queues moments so two never collide. */
export function MomentHost() {
  const [queue, setQueue] = useState<MomentDetail[]>([])
  useEffect(() => {
    const on = (e: Event) => setQueue((q) => [...q, (e as CustomEvent<MomentDetail>).detail])
    window.addEventListener(MOMENT_EVENT, on)
    return () => window.removeEventListener(MOMENT_EVENT, on)
  }, [])
  const current = queue[0]
  if (!current) return null
  return <Moment key={`${current.kind}:${current.title}`} m={current} onClose={() => setQueue((q) => q.slice(1))} />
}
