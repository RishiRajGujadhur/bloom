import { useEffect, useRef } from 'react'
import { lottieIconData, segments, type LottieIconName } from './lottieIcons'

type Player = {
  playSegments: (segment: [number, number], force: boolean) => void
  goToAndStop: (frame: number, isFrame: boolean) => void
  destroy: () => void
}

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

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
  useEffect(() => {
    const node = host.current
    if (!node || typeof window === 'undefined') return
    let player: Player | null = null
    let cancelled = false
    const trigger =
      node.closest<HTMLElement>('button, a, [role="button"], label') ?? node
    const play = (segment: [number, number]) => {
      if (player && !reducedMotion()) player.playSegments(segment, true)
    }
    const onEnter = () => play(segments.in)
    const onLeave = () => play(segments.out)
    const onClick = () => play(segments.click)
    // The light SVG player is loaded on demand to keep the first paint small.
    import('lottie-web/build/player/lottie_light')
      .then(({ default: lottie }) => {
        if (cancelled) return
        player = lottie.loadAnimation({
          container: node,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData: lottieIconData(name),
        }) as unknown as Player
        player.goToAndStop(0, true)
      })
      .catch(() => {
        /* Static fallback: the host keeps its size, the button still works. */
      })
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
    }
  }, [name])
  return (
    <span
      ref={host}
      className={`lottie-icon ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
