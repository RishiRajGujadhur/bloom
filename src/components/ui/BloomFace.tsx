import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react'
import gsap from 'gsap'
import './bloomFace.css'

export type FaceMood = 'idle' | 'talk' | 'happy' | 'think' | 'excited' | 'wink' | 'wave'
export type BloomFaceHandle = { react: (mood: FaceMood) => void }

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Bloom, drawn after Brilliant's Koji: a rounded diamond in Bloom's coral-to-
 * sunshine gradient, one window-like eye with a square pupil, a little leaf
 * sprout, and an arm that pops out to wave hello when Bloom appears.
 * Idle is calm: soft blinks and breathing only.
 */
export const BloomFace = forwardRef<
  BloomFaceHandle,
  { size?: number; mood?: FaceMood; follow?: boolean; label?: string; className?: string; waveOnMount?: boolean }
>(function BloomFace({ size = 72, mood = 'idle', follow = true, label = 'Bloom', className, waveOnMount = true }, ref) {
  const svg = useRef<SVGSVGElement>(null)
  const current = useRef<gsap.core.Timeline | null>(null)
  const uid = useId().replace(/:/g, '')
  const q = (s: string) => svg.current?.querySelector(s) as SVGElement | null

  const wave = () => {
    const arm = q('.bf-arm')
    const hand = q('.bf-arm-swing')
    if (!arm || !hand) return
    return gsap
      .timeline()
      .set(arm, { opacity: 1 })
      .fromTo(arm, { scale: 0, svgOrigin: '78 64' }, { scale: 1, svgOrigin: '78 64', duration: 0.25, ease: 'back.out(3)' })
      .fromTo(hand, { rotate: -12 }, { rotate: 26, svgOrigin: '80 62', duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut' })
      .to(hand, { rotate: 0, svgOrigin: '80 62', duration: 0.15 })
      .to(arm, { scale: 0, svgOrigin: '78 64', duration: 0.2, ease: 'back.in(2)', delay: 0.15 })
      .set(arm, { opacity: 0 })
  }

  const react = (m: FaceMood) => {
    if (!svg.current || reduced()) return
    const body = q('.bf-body')
    const eye = q('.bf-eye')
    const happy = q('.bf-happy')
    current.current?.kill()
    gsap.killTweensOf([body, eye, happy])
    gsap.set(eye, { opacity: 1 })
    gsap.set(happy, { opacity: 0 })
    const tl = gsap.timeline()
    current.current = tl
    if (m === 'talk') tl.fromTo(body, { scaleY: 0.93, scaleX: 1.04 }, { scaleY: 1, scaleX: 1, transformOrigin: '50% 90%', duration: 0.45, ease: 'elastic.out(1.1, 0.45)' })
    if (m === 'happy' || m === 'wink')
      tl.to(eye, { opacity: 0, duration: 0.08 }).to(happy, { opacity: 1, duration: 0.08 }, 0).to(eye, { opacity: 1, duration: 0.1 }, 0.9).to(happy, { opacity: 0, duration: 0.1 }, 0.9)
    if (m === 'think') tl.to(q('.bf-pupil'), { x: 4, y: -4, duration: 0.35, yoyo: true, repeat: 1, repeatDelay: 0.6, ease: 'power2.inOut' })
    if (m === 'excited' || m === 'wave') {
      const w = wave()
      if (w) tl.add(w, 0)
      if (m === 'excited') tl.fromTo(body, { y: 0 }, { y: -5, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, 0)
    }
  }
  useImperativeHandle(ref, () => ({ react }))

  // Calm idle: soft blinks at uneven intervals and slow breathing.
  useEffect(() => {
    const el = svg.current
    if (!el || reduced()) return
    const lid = el.querySelector('.bf-lid')
    let next: gsap.core.Tween | null = null
    let blinkTl: gsap.core.Timeline | null = null
    const blink = () => {
      blinkTl = gsap
        .timeline({ onComplete: () => void (next = gsap.delayedCall(gsap.utils.random(3.5, 6), blink)) })
        .to(lid, { scaleY: 1, duration: 0.12, ease: 'sine.in' })
        .to(lid, { scaleY: 0, duration: 0.18, ease: 'sine.out' })
    }
    next = gsap.delayedCall(2.5, blink)
    const breathe = gsap.to(el.querySelector('.bf-breath'), { scale: 1.025, transformOrigin: '50% 60%', duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    // Say hello: pop in and wave when Bloom first appears.
    let hello: gsap.core.Timeline | undefined
    if (waveOnMount) {
      hello = gsap.timeline({ delay: 0.3 })
      hello.fromTo(el.querySelector('.bf-breath'), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, transformOrigin: '50% 60%', duration: 0.5, ease: 'back.out(2.2)' })
      const w = wave()
      if (w) hello.add(w, '-=0.1')
    }
    return () => {
      next?.kill()
      blinkTl?.kill()
      breathe.kill()
      hello?.progress(1).kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The eye follows the pointer.
  useEffect(() => {
    const el = svg.current
    if (!el || !follow || reduced()) return
    const pupil = el.querySelector('.bf-pupil')
    const x = gsap.quickTo(pupil, 'x', { duration: 0.35, ease: 'power3' })
    const y = gsap.quickTo(pupil, 'y', { duration: 0.35, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(5, d / 30)
      x((dx / d) * k)
      y((dy / d) * k * 0.8)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [follow])

  useEffect(() => {
    if (mood !== 'idle') react(mood)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood])

  return (
    <svg ref={svg} className={`bloom-face ${className ?? ''}`} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`bf-body-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ff7a59" />
          <stop offset="0.55" stopColor="#ff9f5a" />
          <stop offset="1" stopColor="#ffd66b" />
        </linearGradient>
        <linearGradient id={`bf-eye-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fff4ea" />
        </linearGradient>
      </defs>
      <g className="bf-body">
        {/* waving arm (hidden until it waves) */}
        <g className="bf-arm" opacity="0">
          <g className="bf-arm-swing">
            <path d="M78 64 C 86 60, 90 50, 88 42" stroke="#ff8a5a" strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle cx="88" cy="40" r="6" fill="#ffb36b" stroke="#ff8a5a" strokeWidth="2" />
          </g>
        </g>
        <g className="bf-breath">
          {/* leaf sprout */}
          <path d="M50 12 C 50 6, 56 1, 63 2 C 61 8, 56 12, 50 14 Z" fill="#6cc04a" />
          <path d="M50 14 C 50 9, 45 5, 39 6 C 41 11, 45 14, 50 15 Z" fill="#8fd46a" />
          {/* rounded diamond body */}
          <rect x="21" y="23" width="58" height="58" rx="17" transform="rotate(45 50 52)" fill={`url(#bf-body-${uid})`} />
          <path d="M28 40 Q 36 28, 48 24" stroke="#ffffff66" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* window eye with square pupil */}
          <g className="bf-eye">
            <rect x="36" y="38" width="28" height="27" rx="7" fill={`url(#bf-eye-${uid})`} />
            <g className="bf-pupil">
              <rect x="43" y="41" width="14" height="12" rx="3" fill="#1f1d2b" />
              <rect x="52" y="43" width="3" height="3" rx="1" fill="#fff" />
            </g>
            <rect className="bf-lid" x="35" y="37" width="30" height="29" rx="8" fill="#ff9458" />
          </g>
          <path className="bf-happy" d="M39 55 Q50 42 61 55" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0" />
          <ellipse cx="31" cy="64" rx="4.5" ry="2.8" fill="#ff6f7f" opacity="0.45" />
          <ellipse cx="69" cy="64" rx="4.5" ry="2.8" fill="#ff6f7f" opacity="0.45" />
        </g>
      </g>
    </svg>
  )
})
