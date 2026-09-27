import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react'
import gsap from 'gsap'
import './bloomFace.css'
import { useMatrix } from './MatrixRain'

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
  const robot = useMatrix()
  const q = (s: string) => svg.current?.querySelector(s) as SVGElement | null

  const wave = () => {
    const arm = q('.bf-arm')
    const hand = q('.bf-arm-swing')
    if (!arm || !hand) return
    return gsap
      .timeline()
      .set(arm, { opacity: 1 })
      .fromTo(arm, { scale: 0, svgOrigin: '74 62' }, { scale: 1, svgOrigin: '74 62', duration: 0.45, ease: 'power2.out' })
      .fromTo(hand, { rotate: -8 }, { rotate: 18, svgOrigin: '74 62', duration: 0.42, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .to(hand, { rotate: 0, svgOrigin: '74 62', duration: 0.3, ease: 'sine.out' })
      .to(arm, { scale: 0, svgOrigin: '74 62', duration: 0.4, ease: 'power2.in', delay: 0.2 })
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
    if (m === 'talk' && robot) tl.fromTo(svg.current.querySelectorAll('.rb-bar'), { scaleY: 0.3 }, { scaleY: () => gsap.utils.random(0.6, 1.4), transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 5, stagger: 0.03, ease: 'steps(3)' })
    if (m === 'talk' && !robot) tl.to(svg.current.querySelector('.bf-lid'), { scaleY: 1, duration: 0.1, yoyo: true, repeat: 1, ease: 'sine.inOut' })
    if (m === 'happy' || m === 'wink')
      tl.to(eye, { opacity: 0, duration: 0.08 }).to(happy, { opacity: 1, duration: 0.08 }, 0).to(eye, { opacity: 1, duration: 0.1 }, 0.9).to(happy, { opacity: 0, duration: 0.1 }, 0.9)
    if (m === 'think') tl.to(q('.bf-pupil'), { x: 4, y: -4, duration: 0.35, yoyo: true, repeat: 1, repeatDelay: 0.6, ease: 'power2.inOut' })
    if (m === 'excited' || m === 'wave') {
      const w = wave()
      if (w) tl.add(w, 0)
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
    // Slow levitation: Bloom floats up and down while its shadow breathes.
    const breathe = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 2.8, ease: 'sine.inOut' } })
      .to(el.querySelector('.bf-body'), { y: -4 }, 0)
      .to(el.querySelector('.bf-shadow'), { scaleX: 0.8, opacity: 0.18, transformOrigin: '50% 50%' }, 0)
    // Say hello: pop in and wave when Bloom first appears.
    let hello: gsap.core.Timeline | undefined
    if (waveOnMount) {
      hello = gsap.timeline({ delay: 0.3 })
      hello.fromTo(el.querySelector('.bf-breath'), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'sine.out' })
      const w = wave()
      if (w) hello.add(w, '-=0.1')
    }
    return () => {
      next?.kill()
      blinkTl?.kill()
      breathe.kill()
      hello?.kill()
      gsap.set(el.querySelector('.bf-arm'), { opacity: 0 })
    }
    // Re-run when the drawing swaps (Matrix theme robot).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robot])

  // Robot idle: antenna light pulses, a scanline sweeps the visor, rare glitch.
  useEffect(() => {
    const el = svg.current
    if (!el || !robot || reduced()) return
    const bulb = gsap.to(el.querySelector('.rb-bulb'), { opacity: 0.25, duration: 0.6, yoyo: true, repeat: -1, ease: 'steps(2)' })
    const scan = gsap.fromTo(el.querySelector('.rb-scan'), { attr: { y: 34 } }, { attr: { y: 62 }, duration: 2.4, repeat: -1, ease: 'none' })
    let glitch: gsap.core.Tween | null = null
    const doGlitch = () => {
      glitch = gsap.to(el.querySelector('.bf-breath'), {
        keyframes: [{ x: 2, skewX: 6, duration: 0.05 }, { x: -2, skewX: -4, duration: 0.05 }, { x: 0, skewX: 0, duration: 0.05 }],
        onComplete: () => void (glitch = gsap.delayedCall(gsap.utils.random(6, 10), doGlitch) as unknown as gsap.core.Tween),
      })
    }
    glitch = gsap.delayedCall(4, doGlitch) as unknown as gsap.core.Tween
    return () => {
      bulb.kill()
      scan.kill()
      glitch?.kill()
    }
  }, [robot])

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
  }, [follow, robot])

  useEffect(() => {
    if (mood !== 'idle') react(mood)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood])

  return (
    <svg ref={svg} className={`bloom-face ${className ?? ''}`} width={size} height={size} viewBox="0 -2 100 108" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`bf-body-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ff7a59" />
          <stop offset="0.55" stopColor="#ff9f5a" />
          <stop offset="1" stopColor="#ffd66b" />
        </linearGradient>
        <linearGradient id={`rb-head-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f3a1c" />
          <stop offset="1" stopColor="#061a0c" />
        </linearGradient>
        <linearGradient id={`bf-eye-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fff4ea" />
        </linearGradient>
      </defs>
      <ellipse className="bf-shadow" cx="50" cy="102" rx="22" ry="3.5" fill={robot ? '#39ff6a' : '#d9503a'} opacity="0.28" />
      {robot ? (
        <g className="bf-body">
          <g className="bf-arm" opacity="0">
            <g className="bf-arm-swing">
              <path d="M74 62 L84 58 L88 44" stroke="#39ff6a" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              <rect x="83" y="36" width="10" height="9" rx="2" fill="#0b2a14" stroke="#39ff6a" strokeWidth="2" />
            </g>
          </g>
          <g className="bf-breath">
            <line x1="50" y1="22" x2="50" y2="11" stroke="#39ff6a" strokeWidth="3" strokeLinecap="round" />
            <circle className="rb-bulb" cx="50" cy="9" r="4.5" fill="#b6ffc8" />
            <circle cx="50" cy="9" r="7" fill="#39ff6a" opacity="0.25" />
            <rect x="16" y="22" width="68" height="60" rx="16" fill={`url(#rb-head-${uid})`} stroke="#39ff6a" strokeWidth="2.5" />
            <rect x="10" y="44" width="6" height="16" rx="2" fill="#0f3a1c" stroke="#39ff6a" strokeWidth="1.5" />
            <rect x="84" y="44" width="6" height="16" rx="2" fill="#0f3a1c" stroke="#39ff6a" strokeWidth="1.5" />
            <g className="bf-eye">
              <rect x="24" y="32" width="52" height="30" rx="8" fill="#021006" stroke="#1f7a3a" strokeWidth="1.5" />
              <g className="bf-pupil">
                <rect x="34" y="40" width="10" height="12" rx="2" fill="#39ff6a" />
                <rect x="56" y="40" width="10" height="12" rx="2" fill="#39ff6a" />
              </g>
              <rect className="rb-scan" x="25" y="34" width="50" height="2" fill="#39ff6a" opacity="0.35" />
              <rect className="bf-lid" x="23" y="31" width="54" height="32" rx="8" fill="#0b2a14" />
            </g>
            <path className="bf-happy" d="M33 50 L39 43 L45 50 M55 50 L61 43 L67 50" stroke="#39ff6a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0" />
            <g>
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <rect key={k} className="rb-bar" x={33 + k * 6} y="67" width="4" height="8" rx="1" fill="#39ff6a" opacity={0.85} />
              ))}
            </g>
          </g>
        </g>
      ) : (
      <g className="bf-body">
          {/* waving arm (hidden until it waves) */}
          <g className="bf-arm" opacity="0">
            <g className="bf-arm-swing">
              <path d="M72 62 C 80 60, 86 54, 87 45" stroke="#ff9458" strokeWidth="8" strokeLinecap="round" fill="none" />
              <circle cx="87" cy="42" r="6.5" fill="#ffc06b" stroke="#ff9458" strokeWidth="2.5" />
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
      )}
    </svg>
  )
})
