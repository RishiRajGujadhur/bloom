import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react'
import gsap from 'gsap'
import './bloomFace.css'

export type FaceMood = 'idle' | 'talk' | 'happy' | 'think' | 'excited' | 'wink'
export type BloomFaceHandle = { react: (mood: FaceMood) => void }

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Bloom's face: a four-petal flower in Bloom coral with one big friendly eye
 * (after Brilliant's Koji). GSAP gives it life — it floats, blinks, looks at
 * the pointer, bobs when it talks, squints when happy and spins when excited.
 */
export const BloomFace = forwardRef<BloomFaceHandle, { size?: number; mood?: FaceMood; follow?: boolean; label?: string; className?: string }>(function BloomFace(
  { size = 72, mood = 'idle', follow = true, label = 'Bloom', className },
  ref,
) {
  const svg = useRef<SVGSVGElement>(null)
  const current = useRef<gsap.core.Timeline | null>(null)
  const uid = useId().replace(/:/g, '')
  const q = (s: string) => svg.current?.querySelector(s) as SVGElement | null

  const react = (m: FaceMood) => {
    const el = svg.current
    if (!el || reduced()) return
    const body = q('.bf-body')
    const eye = q('.bf-eye')
    const lid = q('.bf-happy')
    // Finish whatever the last reaction was doing, then start clean.
    current.current?.kill()
    gsap.killTweensOf([body, lid, eye])
    gsap.set(eye, { opacity: 1 })
    gsap.set(lid, { opacity: 0 })
    if (m === 'talk') gsap.fromTo(body, { scaleY: 0.9, scaleX: 1.06 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.4)', transformOrigin: '50% 90%' })
    if (m === 'happy' || m === 'wink') {
      current.current = gsap.timeline().to(eye, { opacity: 0, duration: 0.1 }).to(lid, { opacity: 1, duration: 0.1 }, 0).to(body, { y: -6, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, 0).to(eye, { opacity: 1, duration: 0.1, delay: 0.9 }).to(lid, { opacity: 0, duration: 0.1 }, '<')
    }
    if (m === 'think') gsap.to(q('.bf-pupil'), { x: 6, y: -8, duration: 0.4, yoyo: true, repeat: 1, repeatDelay: 0.6, ease: 'power2.inOut' })
    if (m === 'excited')
      gsap.timeline()
        .to(body, { y: -14, duration: 0.2, ease: 'power2.out', transformOrigin: '50% 50%' })
        .to(q('.bf-petals'), { rotate: '+=90', transformOrigin: '50px 50px', duration: 0.6, ease: 'back.out(2)' }, 0)
        .to(body, { y: 0, duration: 0.45, ease: 'bounce.out' })
  }
  useImperativeHandle(ref, () => ({ react }))

  // Life: soft blinking and breathing (no bouncing).
  useEffect(() => {
    const el = svg.current
    if (!el || reduced()) return
    const lid = el.querySelector('.bf-lid')
    let next: gsap.core.Tween | null = null
    let blinkTl: gsap.core.Timeline | null = null
    const blink = () => {
      blinkTl = gsap.timeline({ onComplete: () => void (next = gsap.delayedCall(gsap.utils.random(3.5, 6), blink)) })
        .to(lid, { scaleY: 1, duration: 0.12, ease: 'sine.in' })
        .to(lid, { scaleY: 0, duration: 0.18, ease: 'sine.out' })
    }
    next = gsap.delayedCall(2.5, blink)
    const breathe = gsap.to(el.querySelector('.bf-body'), { scale: 1.02, transformOrigin: '50% 60%', duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    return () => {
      next?.kill()
      blinkTl?.kill()
      breathe.kill()
    }
  }, [])

  // The eye follows the pointer.
  useEffect(() => {
    const el = svg.current
    if (!el || !follow || reduced()) return
    const pupil = q('.bf-pupil')
    const x = gsap.quickTo(pupil, 'x', { duration: 0.35, ease: 'power3' })
    const y = gsap.quickTo(pupil, 'y', { duration: 0.35, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(6, d / 30)
      x((dx / d) * k)
      y((dy / d) * k)
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
        <linearGradient id={`bf-grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb07a" />
          <stop offset="0.55" stopColor="#f07a4a" />
          <stop offset="1" stopColor="#d9503a" />
        </linearGradient>
        <linearGradient id={`bf-grad2-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd3a8" />
          <stop offset="1" stopColor="#f59a6b" />
        </linearGradient>
      </defs>
      <g className="bf-body">
        <path className="bf-leaf" d="M50 14 C 54 4, 66 2, 70 6 C 64 8, 58 12, 52 18 Z" fill="#6cc04a" />
        <g className="bf-petals">
          {[0, 90, 180, 270].map((a) => (
            <ellipse key={a} cx="50" cy="28" rx="20" ry="22" fill={`url(#bf-grad2-${uid})`} transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
        <rect x="22" y="22" width="56" height="56" rx="22" fill={`url(#bf-grad-${uid})`} />
        <ellipse cx="38" cy="36" rx="9" ry="5" fill="#ffffff55" transform="rotate(-25 38 36)" />
        <g className="bf-eye">
          <rect x="36" y="38" width="28" height="26" rx="9" fill="#fff" />
          <g className="bf-pupil">
            <rect x="44" y="45" width="12" height="12" rx="3.5" fill="#1d1d2b" />
            <circle cx="53" cy="48" r="2" fill="#fff" />
          </g>
          <rect className="bf-lid" x="35" y="37" width="30" height="28" rx="10" fill="#f07a4a" />
        </g>
        <path className="bf-happy" d="M38 54 Q50 40 62 54" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0" />
        <ellipse cx="30" cy="62" rx="5" ry="3" fill="#ff8fa3" opacity="0.6" />
        <ellipse cx="70" cy="62" rx="5" ry="3" fill="#ff8fa3" opacity="0.6" />
      </g>
    </svg>
  )
})
