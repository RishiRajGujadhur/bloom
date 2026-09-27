import gsap from 'gsap'

/**
 * Tap feedback: an SVG ring ripples out from the pointer and a small label
 * floats up (GSAP). Works on any positioned container.
 */
export function ripple(host: HTMLElement | null, e: { clientX: number; clientY: number } | null, label = '', color = '#ffd54f', big = false) {
  if (!host || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const r = host.getBoundingClientRect()
  const x = e ? e.clientX - r.left : r.width / 2
  const y = e ? e.clientY - r.top : r.height / 2
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('class', 'fx-ripple')
  svg.setAttribute('width', '240')
  svg.setAttribute('height', '240')
  svg.style.left = `${x - 120}px`
  svg.style.top = `${y - 120}px`
  const c = document.createElementNS(ns, 'circle')
  c.setAttribute('cx', '120')
  c.setAttribute('cy', '120')
  c.setAttribute('r', '6')
  c.setAttribute('fill', 'none')
  c.setAttribute('stroke', color)
  c.setAttribute('stroke-width', big ? '6' : '3')
  svg.append(c)
  host.append(svg)
  gsap.to(c, { attr: { r: big ? 118 : 70 }, opacity: 0, duration: big ? 1.2 : 0.7, ease: 'power2.out', onComplete: () => svg.remove() })
  if (label) {
    const t = document.createElement('span')
    t.className = 'fx-float'
    t.textContent = label
    t.style.left = `${x}px`
    t.style.top = `${y}px`
    host.append(t)
    gsap.fromTo(t, { y: 0, opacity: 1 }, { y: -50, opacity: 0, duration: 0.9, ease: 'power1.out', onComplete: () => t.remove() })
  }
}
