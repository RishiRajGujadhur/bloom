import gsap from 'gsap'
import './cardGlow.css'

/**
 * Cards glow where the pointer is: a soft accent gradient (and a lit border)
 * follows the mouse inside any card, eased with GSAP so it trails smoothly.
 * Buttons get a small springy press.
 */
const CARD = '.studio-card, .card, .en-unit-head, .avatar-option'
export function installCardGlow() {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  let current: HTMLElement | null = null
  let setX: ((v: number) => void) | null = null
  let setY: ((v: number) => void) | null = null
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
      current = null
      if (el) {
        track(el)
        el.classList.add('is-glowing')
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
