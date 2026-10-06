import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from './motion'

/** A bounded reveal for shared panels; GSAP restores inline styles on cleanup. */
export function useSurfaceReveal(
  surface: RefObject<HTMLElement | null>,
  enabled: boolean,
  revision: string | number,
) {
  useLayoutEffect(() => {
    const node = surface.current
    if (!node || !enabled || prefersReducedMotion() ||
      document.documentElement.dataset.bloomMotion === 'paused') return
    const targets = Array.from(node.children)
    if (!targets.length) return
    const context = gsap.context(() => {
      gsap.fromTo(targets, { y: 10, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.32,
        stagger: { amount: 0.16 },
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
    }, node)
    return () => context.revert()
  }, [surface, enabled, revision])
}
