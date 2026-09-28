import gsap from 'gsap'
import './cardGlow.css'
import { pathLength } from '../../utils/svgLength'

/**
 * Cards glow where the pointer is (Composio-style): blurred multicolour blobs
 * orbit the pointer and a conic rainbow edge rotates while hovered, eased with GSAP.
 * Buttons get a small springy press.
 */
const CARD = '.studio-card, .card, .en-unit-head, .avatar-option'
export function installCardGlow() {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  let current: HTMLElement | null = null
  let setX: ((v: number) => void) | null = null
  let setY: ((v: number) => void) | null = null
  let spin: gsap.core.Tween | null = null
  const track = (el: HTMLElement) => {
    current = el
    const px = { x: 50, y: 50 }
    const apply = () => {
      el.style.setProperty('--mx', `${px.x}%`)
      el.style.setProperty('--my', `${px.y}%`)
    }
    setX = gsap.quickTo(px, 'x', { duration: 0.6, ease: 'power3', onUpdate: apply })
    setY = gsap.quickTo(px, 'y', { duration: 0.6, ease: 'power3', onUpdate: apply })
  }
  document.addEventListener('pointermove', (e) => {
    const el = (e.target as Element | null)?.closest?.(CARD) as HTMLElement | null
    if (el !== current) {
      current?.classList.remove('is-glowing')
      spin?.kill()
      current = null
      if (el) {
        track(el)
        el.classList.add('is-glowing')
        // Rotate the colours round the card while it is hovered.
        const st = { a: 0 }
        spin = gsap.to(st, { a: 360, duration: 6, repeat: -1, ease: 'none', onUpdate: () => el.style.setProperty('--ang', `${st.a}deg`) })
      }
    }
    if (!el || !setX || !setY) return
    const r = el.getBoundingClientRect()
    setX(((e.clientX - r.left) / r.width) * 100)
    setY(((e.clientY - r.top) / r.height) * 100)
  }, { passive: true })
  document.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element | null)?.closest?.('button:not(:disabled), [role="button"]')
    if (b) gsap.fromTo(b, { scale: 0.96 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.45)', clearProps: 'scale' })
  }, { passive: true })
}

/** Page titles sweep in (clip + letter-spacing) on every page change; no DOM rewriting, so React stays in charge. */
export function installTitleReveal() {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const run = () =>
    window.setTimeout(() => {
      const h = document.querySelector<HTMLElement>('main h1')
      if (!h) return
      gsap.fromTo(h, { clipPath: 'inset(0 100% 0 0)', letterSpacing: '0.12em', opacity: 0.2 }, { clipPath: 'inset(0 0% 0 0)', letterSpacing: 'normal', opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'clipPath,letterSpacing,opacity' })
    }, 120)
  window.addEventListener('hashchange', run)
  run()
}

/** Cards on a newly opened page rise in with a short stagger and their heading icons draw in, so every page enters the same way. */
export function installCardEntrance() {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const run = () =>
    window.setTimeout(() => {
      const cards = [...document.querySelectorAll<HTMLElement>('main :is(.studio-card, .card)')].filter((c) => c.getBoundingClientRect().top < window.innerHeight).slice(0, 14)
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
  window.addEventListener('hashchange', run)
}
