import { prefersReducedMotion } from '../../utils/motion'
import gsap from 'gsap'
import './cardGlow.css'
import { pathLength } from '../../utils/svgLength'
import { frameThrottle } from '../../utils/frameThrottle'

/**
 * Cards glow where the pointer is (Composio-style): blurred multicolour blobs
 * orbit the pointer and a conic rainbow edge rotates while hovered, eased with GSAP.
 * Buttons get a small springy press.
 */
const CARD = '.studio-card, .card, .en-unit-head, .avatar-option'
export function installCardGlow() {
  if (typeof window === 'undefined' || prefersReducedMotion() || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return
  let current: HTMLElement | null = null
  const clear = () => {
    update.cancel()
    current?.classList.remove('is-glowing')
    current = null
  }
  const update = frameThrottle((e: PointerEvent) => {
    if (document.hidden || prefersReducedMotion()) { clear(); return }
    const el = (e.target as Element | null)?.closest?.(CARD) as HTMLElement | null
    // Read geometry before any class/style writes to avoid forced layout.
    const r = el?.isConnected ? el.getBoundingClientRect() : null
    if (el !== current) {
      current?.classList.remove('is-glowing')
      current = el
      el?.classList.add('is-glowing')
    }
    if (!el || !r || !r.width || !r.height) return
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    el.style.setProperty('--ang', `${((e.clientX - r.left) / r.width) * 360}deg`)
  })
  const press = (e: PointerEvent) => {
    if (document.hidden || prefersReducedMotion()) return
    const b = (e.target as Element | null)?.closest?.('button:not(:disabled), [role="button"]')
    if (b) gsap.fromTo(b, { scale: 0.96 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.45)', clearProps: 'scale', overwrite: 'auto' })
  }
  document.addEventListener('pointermove', update, { passive: true })
  document.addEventListener('pointerdown', press, { passive: true })
  document.addEventListener('pointerleave', clear)
  document.addEventListener('visibilitychange', clear)
  window.addEventListener('hashchange', clear)
  return () => {
    clear()
    document.removeEventListener('pointermove', update)
    document.removeEventListener('pointerdown', press)
    document.removeEventListener('pointerleave', clear)
    document.removeEventListener('visibilitychange', clear)
    window.removeEventListener('hashchange', clear)
  }
}

/** Compositor-friendly title entrance; coalesce rapid navigation. */
export function installTitleReveal() {
  if (typeof window === 'undefined' || prefersReducedMotion()) return
  let timer = 0
  const run = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (document.hidden || prefersReducedMotion()) return
      const h = document.querySelector<HTMLElement>('main h1')
      if (!h) return
      gsap.fromTo(h, { y: 8, opacity: 0.2 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity', overwrite: 'auto' })
    }, 120)
  }
  window.addEventListener('hashchange', run)
  run()
  return () => { window.clearTimeout(timer); window.removeEventListener('hashchange', run) }
}

/** Cards on a newly opened page rise in with a short stagger and their heading icons draw in, so every page enters the same way. */
export function installCardEntrance() {
  if (typeof window === 'undefined' || prefersReducedMotion()) return
  let timer = 0
  const run = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (document.hidden || prefersReducedMotion()) return
      const cards = [...document.querySelectorAll<HTMLElement>('main :is(.studio-card, .card)')].slice(0, 14).filter((c) => { const r = c.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 })
      if (cards.length) gsap.from(cards, { y: 16, opacity: 0, duration: 0.5, stagger: 0.045, ease: 'power3.out', clearProps: 'transform,opacity' })
      // Heading icons draw themselves in (the same stroke-draw as page emblems).
      cards.forEach((card, i) => {
        const parts = card.querySelectorAll<SVGGeometryElement>(':scope > :is(h2, h3) svg :is(path, circle, rect, line, polyline, polygon)')
        parts.forEach((p) => {
          const len = pathLength(p, 40)
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, delay: 0.15 + i * 0.045, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' })
        })
      })
    }, 180)
  }
  window.addEventListener('hashchange', run)
  return () => { window.clearTimeout(timer); window.removeEventListener('hashchange', run) }
}
