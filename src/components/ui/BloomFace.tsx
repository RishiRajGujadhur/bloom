import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import { type Act, ActProp, pageActs, playAct } from './avatarActs'
import gsap from 'gsap'
import './bloomFace.css'
import { type AvatarDrawing, useAvatarDrawing } from './avatarStyle'
import { OrangeBot, isOrange, orangeIdle } from './orangeBots'
import { GlobeBot, PixelBot, extraIdle, isExtra } from './extraBots'
import { SpaceBot, isSpace, spaceIdle } from './spaceBots'

export type FaceMood = 'idle' | 'talk' | 'happy' | 'think' | 'excited' | 'wink' | 'wave' | 'cheer'
export type BloomFaceHandle = { react: (mood: FaceMood) => void; actFor: (page: string) => void }

/** Mood orb palettes (light, deep) and mouths — joy, ennui, anger, anxiety… */
const orbMoods: [string, string][] = [
  ['#8fe6ae', '#34b86a'], ['#b5bdf3', '#6a72c8'], ['#f39a9a', '#c84848'], ['#ffbb8a', '#e9804a'], ['#ffe391', '#f2c23a'],
  ['#a8dcff', '#4fb0f0'], ['#eadcf7', '#b999d8'], ['#9ad8ee', '#3a9cc8'], ['#f7a6cf', '#d8559a'],
]
const orbMouths = [
  'M42 53 Q50 50 58 53', 'M42 53 Q50 51 58 53', 'M42 55 Q50 49 58 55', 'M36 52 Q50 50 64 52', 'M40 50 Q50 58 60 50',
  'M42 55 Q50 49 58 55', 'M42 53 Q50 51 58 53', 'M44 51 Q50 55 56 51', 'M44 52 Q50 52 56 52',
]
function orbTo(el: SVGSVGElement, k: number, duration: number) {
  const [a, b] = orbMoods[k]
  const tl = gsap.timeline({ defaults: { duration, ease: 'sine.inOut' } })
  tl.to(el.querySelectorAll('.orb-s0'), { attr: { 'stop-color': a } }, 0)
    .to(el.querySelectorAll('.orb-s1'), { attr: { 'stop-color': b } }, 0)
    .to(el.querySelector('.orb-lid'), { attr: { fill: a } }, 0)
    .to(el.querySelector('.orb-mouth'), { attr: { d: orbMouths[k] } }, 0)
  return tl
}

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Bloom, drawn after Brilliant's Koji: a rounded diamond in Bloom's coral-to-
 * sunshine gradient, one window-like eye with a square pupil, a little leaf
 * sprout, and an arm that pops out to wave hello when Bloom appears.
 * Idle is calm: soft blinks and breathing only.
 */
export const BloomFace = forwardRef<
  BloomFaceHandle,
  { size?: number; mood?: FaceMood; follow?: boolean; label?: string; className?: string; waveOnMount?: boolean; variant?: AvatarDrawing }
>(function BloomFace({ size = 72, mood = 'idle', follow = true, label = 'Bloom', className, waveOnMount = true, variant }, ref) {
  const svg = useRef<SVGSVGElement>(null)
  const current = useRef<gsap.core.Timeline | null>(null)
  const lastCheer = useRef(-1)
  const uid = useId().replace(/:/g, '')
  const chosen = useAvatarDrawing()
  const drawing = variant ?? chosen
  const robot = drawing === 'robot'
  const orb = drawing === 'orb'
  const orange = isOrange(drawing) || isExtra(drawing) || isSpace(drawing)
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
    // Talking layers on top; it must not cut a wave short (that left the hand up).
    if (m !== 'talk') {
      current.current?.kill()
      gsap.set(q('.bf-arm'), { opacity: 0 })
    }
    gsap.killTweensOf([body, eye, happy])
    gsap.set(eye, { opacity: 1 })
    gsap.set(happy, { opacity: 0 })
    const tl = gsap.timeline()
    if (m !== 'talk') current.current = tl
    if (m === 'talk' && (robot || orange)) tl.fromTo(svg.current.querySelectorAll('.rb-bar'), { scaleY: 0.3 }, { scaleY: () => gsap.utils.random(0.6, 1.4), transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 5, stagger: 0.03, ease: 'steps(3)' })
    if (orb) {
      const mood = m === 'happy' || m === 'excited' || m === 'wave' || m === 'wink' ? 4 : m === 'think' ? 1 : m === 'talk' ? 7 : -1
      if (mood >= 0) tl.add(orbTo(svg.current, mood, 0.6), 0)
      if (m === 'talk') tl.fromTo(q('.orb-mouth'), { scaleY: 1 }, { scaleY: 1.8, svgOrigin: '50 52', duration: 0.12, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0)
    }
    if (m === 'talk' && !robot && !orb && !orange) tl.to(svg.current.querySelector('.bf-lid'), { scaleY: 1, duration: 0.1, yoyo: true, repeat: 1, ease: 'sine.inOut' })
    if (m === 'cheer') {
      // One of five reactions, never the same twice in a row; all move whole groups so every avatar supports them.
      const breath = q('.bf-breath')
      let k = Math.floor(Math.random() * 5)
      if (k === lastCheer.current) k = (k + 1) % 5
      lastCheer.current = k
      if (k === 0) tl.to(breath, { rotate: '+=360', svgOrigin: '50 54', duration: 0.8, ease: 'back.inOut(1.4)' })
      else if (k === 1) tl.to(breath, { scaleX: 1.12, scaleY: 0.86, svgOrigin: '50 88', duration: 0.14, ease: 'power2.out' }).to(breath, { scaleX: 0.94, scaleY: 1.08, duration: 0.16 }).to(breath, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1, 0.35)' })
      else if (k === 2) tl.to(breath, { keyframes: [{ rotate: -12 }, { rotate: 10 }, { rotate: -7 }, { rotate: 4 }, { rotate: 0 }], svgOrigin: '50 88', duration: 0.7, ease: 'sine.inOut' })
      else if (k === 3) tl.to(breath, { keyframes: [{ y: 5, rotate: 4 }, { y: 0, rotate: 0 }, { y: 5, rotate: -4 }, { y: 0, rotate: 0 }], svgOrigin: '50 88', duration: 0.8, ease: 'sine.inOut' })
      else tl.to(eye, { opacity: 0, duration: 0.08 }).to(happy, { opacity: 1, duration: 0.08 }, 0).fromTo(breath, { scale: 1 }, { scale: 1.1, svgOrigin: '50 54', duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, 0).to(eye, { opacity: 1, duration: 0.1 }, 0.8).to(happy, { opacity: 0, duration: 0.1 }, 0.8)
    }
    if (m === 'happy' || m === 'wink')
      tl.to(eye, { opacity: 0, duration: 0.08 }).to(happy, { opacity: 1, duration: 0.08 }, 0).to(eye, { opacity: 1, duration: 0.1 }, 0.9).to(happy, { opacity: 0, duration: 0.1 }, 0.9)
    if (m === 'think') tl.to(q('.bf-pupil'), { x: 4, y: -4, duration: 0.35, yoyo: true, repeat: 1, repeatDelay: 0.6, ease: 'power2.inOut' })
    if (m === 'excited' || m === 'wave') {
      const w = wave()
      if (w) tl.add(w, 0)
    }
  }
  // Page acts: show a prop for the page's intent, then play its timeline once drawn.
  const [act, setAct] = useState<{ act: Act; n: number } | null>(null)
  const actFor = (page: string) => {
    const a = pageActs[page] ?? 'wave'
    if (a === 'wave' || reduced()) return react('wave')
    setAct((p) => ({ act: a, n: (p?.n ?? 0) + 1 }))
  }
  useEffect(() => {
    if (!act || !svg.current) return
    const tl = playAct(svg.current, act.act)
    tl.eventCallback('onComplete', () => setAct(null))
    return () => {
      tl.kill()
    }
  }, [act])
  useImperativeHandle(ref, () => ({ react, actFor }))

  // Calm idle: slow levitation and tilt (no blinking).
  useEffect(() => {
    const el = svg.current
    if (!el || reduced()) return
    // Slow levitation: Bloom floats up and down while its shadow breathes.
    const breathe = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 2.8, ease: 'sine.inOut' } })
      .to(el.querySelector('.bf-body'), { y: -4 }, 0)
      .to(el.querySelector('.bf-shadow'), { scaleX: 0.8, opacity: 0.18, transformOrigin: '50% 50%' }, 0)
    // A slow, barely-there tilt so Bloom feels alive between blinks.
    const tilt = gsap.fromTo(el.querySelector('.bf-breath'), { rotate: -2 }, { rotate: 2, svgOrigin: '50 90', duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    // Say hello: pop in and wave when Bloom first appears.
    let hello: gsap.core.Timeline | undefined
    if (waveOnMount) {
      hello = gsap.timeline({ delay: 0.3 })
      hello.fromTo(el.querySelector('.bf-breath'), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'sine.out' })
      const w = wave()
      if (w) hello.add(w, '-=0.1')
    }
    return () => {
      breathe.kill()
      tilt.kill()
      hello?.kill()
      gsap.set(el.querySelector('.bf-arm'), { opacity: 0 })
    }
    // Re-run when the drawing swaps (Matrix theme robot).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing])

  // Mood orb idle: drift slowly through the mood colours and faces.
  useEffect(() => {
    const el = svg.current
    if (!el || !orb || reduced()) return
    let k = 4
    let next: gsap.core.Tween | null = null
    const drift = () => {
      k = (k + 1 + Math.floor(Math.random() * 3)) % orbMoods.length
      orbTo(el, k, 2.4)
      next = gsap.delayedCall(gsap.utils.random(7, 11), drift)
    }
    next = gsap.delayedCall(6, drift)
    const halo = gsap.to(el.querySelector('.orb-halo'), { attr: { r: 44 }, opacity: 0.75, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    return () => {
      next?.kill()
      halo.kill()
    }
  }, [orb])

  // Orange robots: each has its own idle life.
  useEffect(() => {
    const el = svg.current
    if (!el || !isOrange(drawing) || reduced()) return
    return orangeIdle(el, drawing)
  }, [drawing])

  // Pixel and globe: their own idle life.
  useEffect(() => {
    const el = svg.current
    if (!el || !isExtra(drawing) || reduced()) return
    return extraIdle(el, drawing)
  }, [drawing])

  useEffect(() => {
    const el = svg.current
    if (!el || !isSpace(drawing) || reduced()) return
    return spaceIdle(el)
  }, [drawing])

  // Robot idle: antenna light pulses, a scanline sweeps the visor, the visor glances around.
  useEffect(() => {
    const el = svg.current
    if (!el || !robot || reduced()) return
    const bulb = gsap.to(el.querySelector('.rb-bulb'), { opacity: 0.45, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    const scan = gsap.fromTo(el.querySelector('.rb-scan'), { attr: { y: 34 } }, { attr: { y: 62 }, duration: 2.4, repeat: -1, ease: 'none' })
    // Idle life without jumps: the visor slowly glances left and right.
    const glance = gsap.timeline({ repeat: -1, repeatDelay: 3, defaults: { duration: 1.2, ease: 'sine.inOut' } })
      .to(el.querySelector('.bf-pupil'), { x: -3 })
      .to(el.querySelector('.bf-pupil'), { x: 3 }, '+=1.4')
      .to(el.querySelector('.bf-pupil'), { x: 0 }, '+=1.4')
    return () => {
      bulb.kill()
      scan.kill()
      glance.kill()
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
  }, [follow, drawing])

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
      <ellipse className="bf-shadow" cx="50" cy="102" rx="22" ry="3.5" fill={robot ? '#39ff6a' : orb ? '#6a72c8' : orange ? '#ff8a2a' : '#d9503a'} opacity="0.28" />
      {isSpace(drawing) ? (
        <SpaceBot variant={drawing} uid={uid} />
      ) : drawing === 'pixel' ? (
        <PixelBot />
      ) : drawing === 'globe' ? (
        <GlobeBot uid={uid} />
      ) : isOrange(drawing) ? (
        <OrangeBot variant={drawing} uid={uid} />
      ) : orb ? (
        <g className="bf-body">
          <defs>
            <radialGradient id={`orb-g-${uid}`} cx="0.38" cy="0.3" r="0.75">
              <stop offset="0" stopColor="#fffbe8" />
              <stop className="orb-s0" offset="0.35" stopColor={orbMoods[4][0]} />
              <stop className="orb-s1" offset="1" stopColor={orbMoods[4][1]} />
            </radialGradient>
            <radialGradient id={`orb-h-${uid}`}>
              <stop className="orb-s1" offset="0.55" stopColor={orbMoods[4][1]} stopOpacity="0.7" />
              <stop className="orb-s1" offset="1" stopColor={orbMoods[4][1]} stopOpacity="0" />
            </radialGradient>
            <filter id={`orb-b-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
            <filter id={`orb-s-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
          </defs>
          <g className="bf-arm" opacity="0">
            <g className="bf-arm-swing">
              <circle cx="86" cy="44" r="8" fill={`url(#orb-g-${uid})`} filter={`url(#orb-s-${uid})`} />
            </g>
          </g>
          <g className="bf-breath">
            <circle className="orb-halo" cx="50" cy="54" r="40" fill={`url(#orb-h-${uid})`} opacity="0.55" filter={`url(#orb-b-${uid})`} />
            <circle cx="50" cy="54" r="33" fill={`url(#orb-g-${uid})`} filter={`url(#orb-s-${uid})`} />
            <ellipse cx="40" cy="36" rx="11" ry="6" fill="#fff" opacity="0.4" filter={`url(#orb-s-${uid})`} />
            <g className="bf-eye">
              <g className="bf-pupil">
                <path d="M35 44 a7 7.5 0 0 1 13 0 z" fill="#111" />
                <path d="M52 44 a7 7.5 0 0 1 13 0 z" fill="#111" />
                <circle cx="45" cy="40" r="1.2" fill="#fff" />
                <circle cx="62" cy="40" r="1.2" fill="#fff" />
              </g>
              <rect className="bf-lid orb-lid" x="33" y="35" width="34" height="10" rx="5" fill={orbMoods[4][0]} />
            </g>
            <path className="bf-happy" d="M35 44 Q41.5 36 48 44 M52 44 Q58.5 36 65 44" stroke="#111" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0" />
            <path className="orb-mouth" d={orbMouths[4]} stroke="#111" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </g>
      ) : robot ? (
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
      {act && <ActProp key={act.n} act={act.act} robot={robot} />}
    </svg>
  )
})
