import { useEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import confetti from 'canvas-confetti'
import { subOn } from '../subFeatures'
import { chest, pickSprite, type Sprite } from './sprites'
import './juice.css'

export const JUICE_EVENT = 'bloom:juice'
export type JuiceDetail = { x: number; y: number; big?: boolean; label?: string; seed?: number }

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Fire from anywhere: a habit tick, a finished quest… */
export function juice(detail: JuiceDetail) {
  window.dispatchEvent(new CustomEvent<JuiceDetail>(JUICE_EVENT, { detail }))
}

/** Remembers where the last click happened so juice can burst from it. */
let lastPointer = { x: innerWidth / 2, y: innerHeight / 2 }
if (typeof window !== 'undefined')
  window.addEventListener('pointerdown', (e) => (lastPointer = { x: e.clientX, y: e.clientY }), { capture: true, passive: true })
export const pointer = () => lastPointer

/** Pixel sprite in three layers; the highlight and shadow shift with the cursor. */
export function PixelSprite({ sprite, size = 64, parallax = true, style }: { sprite: Sprite; size?: number; parallax?: boolean; style?: CSSProperties }) {
  const ref = useRef<SVGSVGElement>(null)
  const w = sprite.rows[0].length
  const h = sprite.rows.length
  useEffect(() => {
    const svg = ref.current
    if (!svg || !parallax || reduced()) return
    const move = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect()
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 240))
      const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 240))
      svg.style.setProperty('--px', String(dx))
      svg.style.setProperty('--py', String(dy))
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [parallax])
  const layer = (filter: (c: string) => boolean, colour?: string) =>
    sprite.rows.flatMap((row, y) =>
      [...row].map((c, x) => (c !== '.' && filter(c) ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={colour ?? sprite.palette[c]} /> : null)),
    )
  return (
    <svg ref={ref} className="px-sprite" viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={sprite.name} style={style}>
      <g className="px-shadow">{layer(() => true, '#0000002e')}</g>
      <g className="px-body">{layer((c) => c !== 'w')}</g>
      <g className="px-shine">{layer((c) => c === 'w')}</g>
    </svg>
  )
}

/** Tiny chiptune: a coin blip, or a level-up arpeggio for big wins. */
function chiptune(big: boolean) {
  try {
    const ac = new AudioContext()
    const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [987.77, 1318.5]
    const step = big ? 0.09 : 0.07
    notes.forEach((f, i) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'square'
      o.frequency.value = f
      const t = ac.currentTime + i * step
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + step * (i === notes.length - 1 ? 3 : 1.4))
      o.connect(g).connect(ac.destination)
      o.start(t)
      o.stop(t + step * 3.2)
    })
    setTimeout(() => void ac.close(), 1500)
  } catch {
    /* Sound is optional. */
  }
}

/** Square "pixel" sparks. */
function sparks(x: number, y: number, big: boolean) {
  const square = confetti.shapeFromPath?.({ path: 'M0 0 L10 0 L10 10 L0 10 Z' })
  void confetti({
    particleCount: big ? 90 : 26,
    spread: big ? 360 : 70,
    startVelocity: big ? 32 : 22,
    gravity: 1.1,
    ticks: big ? 160 : 90,
    scalar: big ? 0.9 : 0.7,
    origin: { x: x / innerWidth, y: y / innerHeight },
    colors: ['#f2c14e', '#e27396', '#7fd1e8', '#6bbf7a', '#ffffff'],
    shapes: square ? [square] : ['square'],
    flat: true,
    disableForReducedMotion: true,
  })
}

type Pop = JuiceDetail & { id: number; sprite: Sprite }

function PopView({ pop, onDone }: { pop: Pop; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const tl = gsap.timeline({ onComplete: onDone })
    tl.fromTo(el, { scale: 0, rotation: -30, y: 0 }, { scale: pop.big ? 1.6 : 1, rotation: 0, y: -40, duration: 0.45, ease: 'back.out(3)' })
      .to(el.querySelectorAll('.px-ring i'), { scale: 1, opacity: 0, x: (i) => Math.cos(i * 0.785) * 60, y: (i) => Math.sin(i * 0.785) * 60, duration: 0.6, ease: 'power2.out' }, 0.05)
      .fromTo(el.querySelector('.px-label'), { y: 6, opacity: 0 }, { y: -8, opacity: 1, duration: 0.3 }, 0.2)
      .to(el, { y: -90, opacity: 0, duration: 0.7, ease: 'power1.in' }, pop.big ? 1.6 : 0.9)
    return () => void tl.kill()
  }, [pop.big, onDone])
  return (
    <div ref={root} className="px-pop" data-big={pop.big} style={{ left: pop.x, top: pop.y }}>
      <span className="px-ring" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <PixelSprite sprite={pop.sprite} size={pop.big ? 72 : 52} parallax={false} />
      {pop.label && <span className="px-label">{pop.label}</span>}
    </div>
  )
}

/** Mounted once; listens for juice and plays sprite + sound + sparks. */
export function JuiceLayer() {
  const [pops, setPops] = useState<Pop[]>([])
  const next = useRef(1)
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<JuiceDetail>).detail
      if (subOn('pixelJuice', 'sound')) chiptune(!!d.big)
      if (reduced()) return
      if (subOn('pixelJuice', 'sparks')) sparks(d.x, d.y, !!d.big)
      if (!subOn('pixelJuice', 'sprites')) return
      const sprite = d.big && subOn('pixelJuice', 'chest') ? chest : pickSprite(d.seed ?? next.current)
      setPops((p) => [...p.slice(-4), { ...d, id: next.current++, sprite }])
    }
    window.addEventListener(JUICE_EVENT, on)
    return () => window.removeEventListener(JUICE_EVENT, on)
  }, [])
  return (
    <div className="px-layer" aria-hidden="true">
      {pops.map((p) => (
        <PopView key={p.id} pop={p} onDone={() => setPops((list) => list.filter((x) => x.id !== p.id))} />
      ))}
    </div>
  )
}
