import { useEffect } from 'react'
import gsap from 'gsap'
import { subOn } from '../../features/subFeatures'

/**
 * GSAP controls: one delegated listener gives every button, chip, link-button
 * and switch in Bloom the same tactile feel — a quick squash on press, an
 * elastic release, and a pop when a toggle flips. Inline transforms are
 * cleared afterwards so each control's own CSS hover effects keep working.
 */
const CONTROL = 'button, [role="button"], .studio-chip, .link-chip, a.studio-btn, a.quick-next, summary'
const SKIP = '.swipe-card, .react-flow, .bk-book, canvas, [data-no-press], .wf-opt'

export function GsapControls() {
  useEffect(() => {
    if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !subOn('pointerFx', 'gsapControls', { ignoreParent: true })) return
    let pressed: HTMLElement | null = null
    const target = (e: Event) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>(CONTROL)
      if (!t || t.closest(SKIP) || (t as HTMLButtonElement).disabled) return null
      return t
    }
    const release = (el: HTMLElement) =>
      gsap.to(el, { scale: 1, duration: 0.55, ease: 'elastic.out(1.1, 0.45)', overwrite: true, onComplete: () => void gsap.set(el, { clearProps: 'scale,transform' }) })
    const down = (e: PointerEvent) => {
      const el = target(e)
      if (!el) return
      pressed = el
      gsap.to(el, { scale: el.offsetWidth > 240 ? 0.98 : 0.93, duration: 0.1, ease: 'power2.out', overwrite: true })
    }
    const up = () => {
      if (pressed) release(pressed)
      pressed = null
    }
    // Keyboard presses get the same feedback.
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const el = target(e)
      if (!el) return
      gsap.fromTo(el, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.45)', overwrite: true, onComplete: () => void gsap.set(el, { clearProps: 'scale,transform' }) })
    }
    // Switches (checkbox inputs) pop their visible track when flipped.
    const change = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (input?.type !== 'checkbox' && input?.type !== 'radio') return
      const track = input.nextElementSibling as HTMLElement | null
      const el = track && getComputedStyle(track).display !== 'none' ? track : input
      gsap.fromTo(el, { scale: 0.85 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', overwrite: true, onComplete: () => void gsap.set(el, { clearProps: 'scale,transform' }) })
    }
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('pointercancel', up, { passive: true })
    window.addEventListener('keydown', key)
    window.addEventListener('change', change)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('keydown', key)
      window.removeEventListener('change', change)
    }
  }, [])
  return null
}
