import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef } from 'react'
import { lottieIconData, segments, type LottieIconName } from './lottieIcons'
import { ArrowRight, Check, Heart, Play, Plus, Sparkles } from 'lucide-react'

type Player = {
  playSegments: (segment: [number, number], force: boolean) => void
  goToAndStop: (frame: number, isFrame: boolean) => void
  destroy: () => void
}

const reducedMotion = () => prefersReducedMotion() ?? false

/**
 * Animated SVG icon (Lottie). It listens on its closest action element, so a
 * whole button triggers it: hover in, hover out and click each play their
 * own segment. Falls back to a static frame without animation support.
 */
export function LottieIcon({
  name,
  size = 18,
  className = '',
}: {
  name: LottieIconName
  size?: number
  className?: string
}) {
  const host = useRef<HTMLSpanElement>(null)
  const Fallback =
    (
      {
        check: Check,
        plus: Plus,
        heart: Heart,
        play: Play,
        arrow: ArrowRight,
      } as Record<string, typeof Sparkles>
    )[name] ?? Sparkles
  useEffect(() => {
    const node = host.current
    if (!node || typeof window === 'undefined') return
    let player: Player | null = null
    let cancelled = false
    let loading = false
    let requested: [number, number] = segments.in
    const trigger =
      node.closest<HTMLElement>('button, a, [role="button"], label') ?? node
    const play = (segment: [number, number]) => {
      if (reducedMotion() || document.hidden) return
      requested = segment
      if (player) {
        player.playSegments(segment, true)
        return
      }
      if (loading) return
      loading = true
      void import('lottie-web/build/player/lottie_light')
        .then(({ default: lottie }) => {
          if (cancelled || reducedMotion() || document.hidden) {
            loading = false
            return
          }
          const container = node.querySelector<HTMLElement>('.lottie-player')!
          player = lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: lottieIconData(name),
          }) as unknown as Player
          node.classList.add('is-loaded')
          player.playSegments(requested, true)
        })
        .catch(() => {
          loading = false
        })
    }
    const onEnter = () => play(segments.in)
    const onLeave = () => play(segments.out)
    const onClick = () => play(segments.click)
    // The static SVG is visible immediately; the player loads on first intent.
    trigger.addEventListener('pointerenter', onEnter)
    trigger.addEventListener('pointerleave', onLeave)
    trigger.addEventListener('focus', onEnter)
    trigger.addEventListener('blur', onLeave)
    trigger.addEventListener('click', onClick)
    return () => {
      cancelled = true
      trigger.removeEventListener('pointerenter', onEnter)
      trigger.removeEventListener('pointerleave', onLeave)
      trigger.removeEventListener('focus', onEnter)
      trigger.removeEventListener('blur', onLeave)
      trigger.removeEventListener('click', onClick)
      player?.destroy()
      node.classList.remove('is-loaded')
    }
  }, [name])
  return (
    <span
      ref={host}
      className={`lottie-icon ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Fallback className="lottie-fallback" size={size} />
      <span className="lottie-player" />
    </span>
  )
}
