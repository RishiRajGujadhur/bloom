import { gsap } from 'gsap'

export function morphActionIcon(
  element: SVGPathElement | null,
  nextPath: string,
): gsap.core.Tween | undefined {
  if (!element) return undefined
  return gsap.to(element, {
    attr: { d: nextPath },
    duration: 0.28,
    ease: 'power2.out',
  })
}
