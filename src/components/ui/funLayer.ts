import gsap from 'gsap'
import './funLayer.css'
import { pathLength } from '../../utils/svgLength'

/**
 * App-wide playful touches, all GSAP + SVG, so every feature feels alive:
 *   - ticking any checkbox / switch pops an SVG burst (ring, rays, a check)
 *   - nav and card-heading icons wiggle on hover
 *   - a hand-drawn squiggle sweeps across the top on every page change
 */
const NS = 'http://www.w3.org/2000/svg'
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const colors = ['#58cc02', '#ffc800', '#1cb0f6', '#ff4b4b', '#ce82ff', '#ff9600']

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

/** A celebratory SVG burst centred on an element. */
export function checkBurst(target: Element) {
  const r = target.getBoundingClientRect()
  const size = 90
  const svg = svgEl('svg', { width: size, height: size, viewBox: '-45 -45 90 90', class: 'fun-burst' })
  svg.style.left = `${r.left + r.width / 2 - size / 2}px`
  svg.style.top = `${r.top + r.height / 2 - size / 2}px`
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#58cc02'
  const ring = svgEl('circle', { r: 10, fill: 'none', stroke: accent, 'stroke-width': 3 })
  svg.appendChild(ring)
  const rays: SVGElement[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const ray = svgEl(i % 2 ? 'circle' : 'line', i % 2 ? { cx: Math.cos(a) * 14, cy: Math.sin(a) * 14, r: 3, fill: colors[i % colors.length] } : { x1: Math.cos(a) * 12, y1: Math.sin(a) * 12, x2: Math.cos(a) * 18, y2: Math.sin(a) * 18, stroke: colors[i % colors.length], 'stroke-width': 3, 'stroke-linecap': 'round' })
    svg.appendChild(ray)
    rays.push(ray)
  }
  const tick = svgEl('path', { d: 'M-8 0 L-2 6 L9 -7', fill: 'none', stroke: accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 30, 'stroke-dashoffset': 30 })
  svg.appendChild(tick)
  document.body.appendChild(svg)
  const tl = gsap.timeline({ onComplete: () => svg.remove() })
  tl.fromTo(ring, { attr: { r: 6 }, opacity: 1 }, { attr: { r: 34 }, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0)
    .fromTo(rays, { x: 0, y: 0, opacity: 1, scale: 0.5 }, {
      x: (i) => Math.cos((i / 10) * Math.PI * 2) * 22,
      y: (i) => Math.sin((i / 10) * Math.PI * 2) * 22,
      opacity: 0, scale: 1.2, duration: 0.7, ease: 'power3.out',
    }, 0)
    .to(tick, { attr: { 'stroke-dashoffset': 0 }, duration: 0.25, ease: 'power2.out' }, 0.05)
    .to(tick, { opacity: 0, scale: 1.4, transformOrigin: '50% 50%', duration: 0.3 }, 0.5)
}

/** Draw a squiggle across the top of the page. */
function pageSquiggle() {
  const w = window.innerWidth
  const svg = svgEl('svg', { width: w, height: 16, viewBox: `0 0 ${w} 16`, class: 'fun-squiggle' })
  let d = 'M0 8'
  for (let x = 0; x < w; x += 40) d += ` q 10 -7 20 0 t 20 0`
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#58cc02'
  const path = svgEl('path', { d, fill: 'none', stroke: accent, 'stroke-width': 3, 'stroke-linecap': 'round' })
  svg.appendChild(path)
  document.body.appendChild(svg)
  const len = pathLength(path, w * 1.3)
  gsap.timeline({ onComplete: () => svg.remove() })
    .fromTo(path, { attr: { 'stroke-dasharray': len, 'stroke-dashoffset': len } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.7, ease: 'power2.inOut' })
    .to(svg, { opacity: 0, y: -8, duration: 0.35 }, '+=0.1')
}

export function installFunLayer() {
  if (typeof window === 'undefined' || reduced()) return
  document.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement | null
    if (t?.type === 'checkbox' && t.checked) checkBurst(t.closest('label, li, button') ?? t)
  })
  // Completing a to-do or checking in a habit (these are buttons) bursts too.
  document.addEventListener('click', (e) => {
    const b = (e.target as Element | null)?.closest?.('button[aria-label^="Complete "], button[aria-label^="Complete scheduled"], button[aria-label^="Check in:"]')
    if (b) checkBurst(b)
  })
  // Delegated hover wiggle for nav and card-heading icons.
  const wiggling = new WeakSet<Element>()
  document.addEventListener('pointerover', (e) => {
    const host = (e.target as Element | null)?.closest?.('nav a, nav button, .studio-card > h3, .studio-tabs [role="tab"]')
    const icon = host?.querySelector('svg')
    if (!icon || wiggling.has(icon)) return
    wiggling.add(icon)
    gsap.fromTo(icon, { rotate: 0 }, { keyframes: [{ rotate: -14 }, { rotate: 10 }, { rotate: -6 }, { rotate: 0 }], duration: 0.5, ease: 'sine.inOut', transformOrigin: '50% 50%', onComplete: () => void wiggling.delete(icon) })
  }, { passive: true })
  window.addEventListener('hashchange', pageSquiggle)
  // Easter egg: clicking a page title throws sparkles.
  document.addEventListener('click', (e) => {
    const h = (e.target as Element | null)?.closest?.('main h1')
    if (!h) return
    const r = h.getBoundingClientRect()
    for (let i = 0; i < 12; i++) {
      const star = svgEl('svg', { width: 18, height: 18, viewBox: '-9 -9 18 18', class: 'fun-burst' })
      star.appendChild(svgEl('path', { d: 'M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z', fill: colors[i % colors.length] }))
      star.style.left = `${r.left + Math.random() * r.width}px`
      star.style.top = `${r.top + r.height / 2}px`
      document.body.appendChild(star)
      gsap.to(star, { y: gsap.utils.random(-70, -20), x: gsap.utils.random(-30, 30), rotate: gsap.utils.random(-180, 180), opacity: 0, scale: gsap.utils.random(0.6, 1.4), duration: gsap.utils.random(0.7, 1.2), ease: 'power2.out', onComplete: () => star.remove() })
    }
  })
}
