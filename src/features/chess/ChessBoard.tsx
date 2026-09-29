import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGesture } from '@use-gesture/react'
import { FILES, fr, glyph, sq, type PieceCode } from './chessModel'

/**
 * An SVG chessboard: click or drag pieces, legal-move dots pop in, the moved
 * piece glides (GSAP), stars and the king-in-check square glow, and the whole
 * board tilts gently towards the pointer (an Awwwards-style depth effect).
 */
const S = 60
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function ChessBoard({ position, targets = [], selected, onSelect, onMove, stars = [], lastMove, check, flipped = false, disabled = false }: {
  position: Record<string, PieceCode>
  targets?: string[]
  selected?: string | null
  onSelect: (square: string | null) => void
  onMove: (from: string, to: string) => void
  stars?: string[]
  lastMove?: { from: string; to: string } | null
  check?: string | null
  flipped?: boolean
  disabled?: boolean
}) {
  const svg = useRef<SVGSVGElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const xy = (s: string) => {
    const [f, r] = fr(s)
    return flipped ? [(7 - f) * S, r * S] : [f * S, (7 - r) * S]
  }
  const squareAt = (clientX: number, clientY: number) => {
    const r = svg.current!.getBoundingClientRect()
    const x = Math.floor(((clientX - r.left) / r.width) * 8)
    const y = Math.floor(((clientY - r.top) / r.height) * 8)
    if (x < 0 || x > 7 || y < 0 || y > 7) return null
    return flipped ? sq(7 - x, y) : sq(x, 7 - y)
  }

  // The moved piece glides from its old square.
  useLayoutEffect(() => {
    if (!lastMove || !svg.current || reduced()) return
    const el = svg.current.querySelector(`[data-piece="${lastMove.to}"]`)
    if (!el) return
    const [x0, y0] = xy(lastMove.from)
    const [x1, y1] = xy(lastMove.to)
    gsap.fromTo(el, { x: x0 - x1, y: y0 - y1 }, { x: 0, y: 0, duration: 0.42, ease: 'power3.out' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMove?.from, lastMove?.to])
  // Legal-move dots pop in.
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    gsap.fromTo(svg.current.querySelectorAll('.cb-dot'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, stagger: 0.015, ease: 'back.out(3)' })
  }, [selected])
  // Stars twinkle.
  const starKey = stars.join()
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const tw = gsap.to(svg.current.querySelectorAll('.cb-star'), { scale: 1.2, rotate: 20, transformOrigin: '50% 50%', duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    return () => void tw.kill()
  }, [starKey])

  const bind = useGesture(
    {
      onMove: ({ xy: [x, y] }) => {
        if (!wrap.current || reduced()) return
        const r = wrap.current.getBoundingClientRect()
        gsap.to(wrap.current, { rotateY: ((x - r.left) / r.width - 0.5) * 6, rotateX: -((y - r.top) / r.height - 0.5) * 6, duration: 0.6, ease: 'power2.out' })
      },
      onHover: ({ hovering }) => {
        if (!hovering && wrap.current) gsap.to(wrap.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
      },
      onDrag: ({ first, last, xy: [x, y], movement: [mx, my], event, tap }) => {
        if (disabled || tap) return
        const target = (event.target as Element).closest('[data-piece]')
        if (first) {
          const from = target?.getAttribute('data-piece')
          if (!from) return
          setDragging(from)
          onSelect(from)
        }
        const from = dragging ?? target?.getAttribute('data-piece')
        if (!from || !svg.current) return
        const el = svg.current.querySelector(`[data-piece="${from}"]`)
        const scale = 480 / svg.current.getBoundingClientRect().width
        if (el) gsap.set(el, { x: mx * scale, y: my * scale })
        if (last) {
          setDragging(null)
          const to = squareAt(x, y)
          if (el) gsap.set(el, { x: 0, y: 0 })
          if (to && to !== from && targets.includes(to)) onMove(from, to)
        }
      },
    },
    { drag: { filterTaps: true, pointer: { capture: false } } },
  )

  const click = (s: string) => {
    if (disabled) return
    if (selected && targets.includes(s)) onMove(selected, s)
    else onSelect(position[s] ? s : null)
  }
  const ranks = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <div className="cb-wrap" ref={wrap} {...bind()}>
      <svg ref={svg} className="cb-board" viewBox="0 0 480 480" role="grid" aria-label="Chessboard" data-matrix-native>
        <defs>
          <radialGradient id="cb-check"><stop offset="0" stopColor="#ff4b4b" /><stop offset="1" stopColor="#ff4b4b00" /></radialGradient>
        </defs>
        {ranks.map((r) =>
          ranks.map((f) => {
            const s = sq(f, r)
            const [x, y] = xy(s)
            const dark = (f + r) % 2 === 0
            const isLast = lastMove && (lastMove.from === s || lastMove.to === s)
            return (
              <g key={s} role="gridcell" aria-label={`${s}${position[s] ? ` ${position[s]}` : ''}`} onClick={() => click(s)}>
                <rect x={x} y={y} width={S} height={S} className={`cb-sq ${dark ? 'dark' : 'light'} ${isLast ? 'last' : ''} ${selected === s ? 'sel' : ''}`} />
                {check === s && <circle cx={x + S / 2} cy={y + S / 2} r={S * 0.55} fill="url(#cb-check)" />}
              </g>
            )
          }),
        )}
        {/* coordinates */}
        {ranks.map((i) => (
          <g key={`c${i}`} className="cb-coord">
            <text x={i * S + S - 6} y={476} textAnchor="end">{flipped ? FILES[7 - i] : FILES[i]}</text>
            <text x={4} y={i * S + 14}>{flipped ? i + 1 : 8 - i}</text>
          </g>
        ))}
        {stars.map((s) => {
          const [x, y] = xy(s)
          return <path key={`star${s}`} className="cb-star" d="M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4 Z" transform={`translate(${x + S / 2} ${y + S / 2})`} />
        })}
        {targets.map((s) => {
          const [x, y] = xy(s)
          return position[s] ? <circle key={`t${s}`} className="cb-dot cap" cx={x + S / 2} cy={y + S / 2} r={S * 0.44} /> : <circle key={`t${s}`} className="cb-dot" cx={x + S / 2} cy={y + S / 2} r={S * 0.14} />
        })}
        {Object.entries(position).map(([s, p]) => {
          const [x, y] = xy(s)
          return (
            <text key={`${s}${p}`} data-piece={s} className={`cb-piece ${p[0] === 'w' ? 'white' : 'black'} ${dragging === s ? 'drag' : ''}`} x={x + S / 2} y={y + S * 0.78} textAnchor="middle" onClick={(e) => { e.stopPropagation(); click(s) }}>
              {glyph[p]}{'︎'}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
