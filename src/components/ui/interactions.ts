import { prefersReducedMotion } from '../../utils/motion'
/**
 * App-wide micro-interactions, delegated from the document so every action
 * element gets them without per-component wiring:
 *
 *   hover in   → data-hover="in"   (lift + icon pop/tilt)
 *   hover out  → data-hover="out"  (a different squash-and-settle), then cleared
 *   press      → a ripple from the pointer position
 *
 * Styles live in interactions.css. Nothing runs under reduced motion.
 */
const ACTIONS =
  'button:not(:disabled), a[href], [role="button"], [role="tab"], [role="radio"], summary, [cmdk-item]'

export function installInteractions(root: Document = document) {
  const reduced = () =>
    prefersReducedMotion() ?? false
  const outTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>()

  const onOver = (event: PointerEvent) => {
    if (reduced() || event.pointerType === 'touch') return
    const el = (event.target as Element | null)?.closest?.(ACTIONS)
    if (!el || el.contains(event.relatedTarget as Node | null)) return
    clearTimeout(outTimers.get(el))
    el.setAttribute('data-hover', 'in')
  }
  const onOut = (event: PointerEvent) => {
    const el = (event.target as Element | null)?.closest?.(ACTIONS)
    if (!el || el.contains(event.relatedTarget as Node | null)) return
    if (el.getAttribute('data-hover') !== 'in') return
    el.setAttribute('data-hover', 'out')
    outTimers.set(
      el,
      setTimeout(() => el.removeAttribute('data-hover'), 420),
    )
  }
  const onDown = (event: PointerEvent) => {
    if (reduced() || event.button !== 0) return
    const el = (event.target as Element | null)?.closest?.(ACTIONS) as HTMLElement | null
    if (!el || el.matches('[cmdk-item], summary') || el.dataset.noRipple !== undefined) return
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2.2
    // The ripple sits in a clipping layer, so the button itself never needs
    // overflow:hidden (badges and focus rings stay visible).
    const clip = document.createElement('span')
    clip.className = 'ui-ripple-clip'
    const ripple = document.createElement('span')
    ripple.className = 'ui-ripple'
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`
    clip.append(ripple)
    if (getComputedStyle(el).position === 'static') el.classList.add('ui-ripple-host')
    el.append(clip)
    ripple.addEventListener('animationend', () => clip.remove(), { once: true })
    setTimeout(() => clip.remove(), 800)
  }

  root.addEventListener('pointerover', onOver)
  root.addEventListener('pointerout', onOut)
  root.addEventListener('pointerdown', onDown)
  return () => {
    root.removeEventListener('pointerover', onOver)
    root.removeEventListener('pointerout', onOut)
    root.removeEventListener('pointerdown', onDown)
  }
}
