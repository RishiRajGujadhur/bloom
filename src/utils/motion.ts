/** One motion preference for CSS, GSAP, and feature scenes. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return document.documentElement.dataset.reduceMotion === 'true' ||
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
