import { prefersReducedMotion } from '../../utils/motion'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { Feather, X } from 'lucide-react'
import { subOn } from '../subFeatures'
import './monk.css'

/**
 * Monk mode — a sand mandala for thoughts. Words stay solid for a few
 * seconds, then crumble into grains from the exact pixels they occupied.
 * Nothing is written to storage, not even a count.
 */
type Word = { id: number; text: string; born: number }
type Grain = { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }

const reduced = () => prefersReducedMotion()

/** Sample the word's glyph pixels into grains positioned where the word sat. */
function grainsFor(el: HTMLElement, smoke: boolean): Grain[] {
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  const w = Math.ceil(rect.width)
  const h = Math.ceil(rect.height)
  if (!w || !h) return []
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#000'
  ctx.fillText(el.textContent ?? '', 0, h / 2)
  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return []
  }
  const out: Grain[] = []
  const step = 2
  const palette = smoke ? ['#b9b3c9', '#d7d1e4', '#9d97ad'] : ['#c9a36b', '#e0c08f', '#b58a52', '#f0d9b0']
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step)
      if (data[(y * w + x) * 4 + 3] > 120)
        out.push({
          x: rect.left + x,
          y: rect.top + y,
          vx: (Math.random() - 0.3) * (smoke ? 0.6 : 1.2),
          vy: smoke ? -Math.random() * 0.8 - 0.2 : -Math.random() * 1.6,
          life: 1,
          size: smoke ? 2 + Math.random() * 2 : 1.4 + Math.random() * 1.2,
          color: palette[(x + y) % palette.length],
        })
  return out
}

/** Slowly drawn, slowly turning mandala behind the words. */
function Mandala() {
  const root = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    if (!root.current || reduced()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.monk-petal', { strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: 6, stagger: 0.15, ease: 'sine.inOut' })
      gsap.to('.monk-ring-a', { rotation: 360, duration: 240, repeat: -1, ease: 'none', transformOrigin: '50% 50%' })
      gsap.to('.monk-ring-b', { rotation: -360, duration: 320, repeat: -1, ease: 'none', transformOrigin: '50% 50%' })
    }, root)
    return () => ctx.revert()
  }, [])
  const petals = (n: number, r: number, len: number) =>
    Array.from({ length: n }, (_, i) => (
      <path
        key={i}
        className="monk-petal"
        strokeDasharray="400"
        transform={`rotate(${(360 / n) * i} 300 300)`}
        d={`M300 ${300 - r} C ${300 + len * 0.45} ${300 - r - len * 0.5}, ${300 + len * 0.2} ${300 - r - len}, 300 ${300 - r - len} C ${300 - len * 0.2} ${300 - r - len}, ${300 - len * 0.45} ${300 - r - len * 0.5}, 300 ${300 - r}`}
      />
    ))
  return (
    <svg ref={root} className="monk-mandala" viewBox="0 0 600 600" aria-hidden="true">
      <g className="monk-ring-a">{petals(16, 70, 90)}</g>
      <g className="monk-ring-b">{petals(24, 170, 70)}</g>
      <circle cx="300" cy="300" r="40" />
      <circle cx="300" cy="300" r="250" />
      <circle cx="300" cy="300" r="280" strokeDasharray="2 10" />
    </svg>
  )
}

function chime() {
  try {
    const ac = new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.frequency.value = 528
    o.type = 'sine'
    g.gain.setValueAtTime(0.0001, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 3)
    o.connect(g).connect(ac.destination)
    o.start()
    o.stop(ac.currentTime + 3)
    setTimeout(() => void ac.close(), 3200)
  } catch {
    /* Sound is optional. */
  }
}

function MonkSession({ onExit }: { onExit: () => void }) {
  const [words, setWords] = useState<Word[]>([])
  const [draft, setDraft] = useState('')
  const [released, setReleased] = useState(0)
  const canvas = useRef<HTMLCanvasElement>(null)
  const grains = useRef<Grain[]>([])
  const raf = useRef(0)
  const nextId = useRef(1)
  const spans = useRef(new Map<number, HTMLSpanElement>())
  const input = useRef<HTMLInputElement>(null)
  const smoke = !subOn('monkMode', 'sand')
  const ttl = subOn('monkMode', 'quick') ? 10000 : 20000

  const loop = useCallback(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    const g = grains.current
    for (let i = g.length - 1; i >= 0; i--) {
      const p = g[i]
      if (smoke) {
        p.vx += (Math.random() - 0.5) * 0.08
        p.vy -= 0.01
        p.life -= 0.006
      } else {
        p.vy += 0.06
        p.vx += 0.015 + (Math.random() - 0.5) * 0.05
        p.life -= 0.005
      }
      p.x += p.vx
      p.y += p.vy
      if (p.life <= 0 || p.y > c.height + 10) {
        g.splice(i, 1)
        continue
      }
      ctx.globalAlpha = Math.max(0, p.life) * (smoke ? 0.5 : 0.9)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (smoke ? 1 + (1 - p.life) * 2 : 1), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    raf.current = g.length ? requestAnimationFrame(loop) : 0
  }, [smoke])

  useEffect(() => {
    const resize = () => {
      if (canvas.current) {
        canvas.current.width = innerWidth
        canvas.current.height = innerHeight
      }
    }
    resize()
    addEventListener('resize', resize)
    input.current?.focus()
    if (subOn('monkMode', 'bell')) chime()
    return () => {
      removeEventListener('resize', resize)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  // Crumble words whose time has come.
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const due = words.filter((w) => now - w.born >= ttl)
      if (!due.length) return
      if (!reduced())
        for (const w of due) {
          const el = spans.current.get(w.id)
          if (el) grains.current.push(...grainsFor(el, smoke))
        }
      if (!raf.current && grains.current.length) raf.current = requestAnimationFrame(loop)
      setWords((list) => list.filter((w) => !due.includes(w)))
      setReleased((n) => n + due.length)
    }, 250)
    return () => clearInterval(timer)
  }, [words, ttl, smoke, loop])

  const commit = (text: string) => {
    const t = text.trim()
    if (!t) return
    setWords((list) => [...list, { id: nextId.current++, text: t, born: Date.now() }])
  }
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') onExit()
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      commit(draft)
      setDraft('')
    } else if (e.key === 'Backspace' && !draft) e.preventDefault() // written words can't be taken back, only let go
  }

  return (
    <div className="monk-session" data-zen={subOn('monkMode', 'zen')} onClick={() => input.current?.focus()}>
      {subOn('monkMode', 'mandala') && <Mandala />}
      <canvas ref={canvas} className="monk-canvas" aria-hidden="true" />
      <button className="monk-exit" type="button" onClick={onExit} aria-label="Leave Monk mode">
        <X size={18} />
      </button>
      <div className="monk-page">
        <p className="monk-flow" aria-live="off">
          {words.map((w) => (
            <span
              key={w.id}
              ref={(el) => {
                if (el) spans.current.set(w.id, el)
                else spans.current.delete(w.id)
              }}
              className="monk-word"
              style={{ ['--ttl' as string]: `${ttl}ms` }}
            >
              {w.text}
            </span>
          ))}
          <input
            ref={input}
            className="monk-input"
            aria-label="Write what you need to let go of"
            value={draft}
            autoComplete="off"
            spellCheck={false}
            placeholder={words.length ? '' : 'Write what weighs on you…'}
            onChange={(e) => {
              const v = e.target.value
              if (/\s$/.test(v)) {
                commit(v)
                setDraft('')
              } else setDraft(v)
            }}
            onKeyDown={onKey}
            style={{ width: `${Math.max(draft.length, words.length ? 2 : 22)}ch` }}
          />
        </p>
      </div>
      <p className="monk-foot">
        {released ? `${released} ${released === 1 ? 'word' : 'words'} returned to the wind` : `Each word stays ${ttl / 1000}s, then crumbles. Nothing is saved.`} · Esc to leave
      </p>
    </div>
  )
}

export function MonkModePage() {
  const [on, setOn] = useState(false)
  const session = on && <MonkSession onExit={() => setOn(false)} />
  return (
    <div className="monk-intro">
      <div className="monk-intro-art" aria-hidden="true">
        {subOn('monkMode', 'mandala') && <Mandala />}
      </div>
      <div>
        <h3>Sand mandala</h3>
        <p>
          Monks spend days building a mandala from coloured sand, then sweep it away. Write the anger, the worry, the thought
          that won’t leave. Each word crumbles to {subOn('monkMode', 'sand') ? 'sand' : 'smoke'} after a few seconds.
        </p>
        <ul>
          <li>Nothing is stored. Not in this browser, not anywhere.</li>
          <li>You can’t delete a word. You can only let it go.</li>
        </ul>
        <button className="ov-primary" type="button" onClick={() => setOn(true)}>
          <Feather size={16} aria-hidden="true" /> Enter Monk mode
        </button>
      </div>
      {session && (subOn('monkMode', 'zen') ? createPortal(session, document.body) : session)}
    </div>
  )
}
