import { useEffect, useRef } from 'react'
import { Application, Container, Graphics } from 'pixi.js'

/**
 * A square grid drawn with PixiJS (WebGL/Canvas). Lit cells glow and pulse;
 * taps send a ripple out from the cell. Used by n-back, memory grid and
 * reaction. One Graphics per cell is redrawn each frame (no allocations).
 */
export type CellState = 'off' | 'lit' | 'hit' | 'miss' | 'go' | 'wait'
const colors: Record<CellState, number> = { off: 0xeee8f7, lit: 0x8f7ae5, hit: 0x3f8a5a, miss: 0xe2553f, go: 0x3fbf6a, wait: 0xe2553f }
const PX = 480
const GAP = 10

export function PixiBoard({ size, cells, onTap, label }: { size: number; cells: CellState[]; onTap?: (i: number) => void; label: string }) {
  const host = useRef<HTMLDivElement>(null)
  const state = useRef({ cells, size, onTap })
  state.current = { cells, size, onTap }

  useEffect(() => {
    let cancelled = false
    let app: Application | null = null
    const a = new Application()
    void a.init({ width: PX, height: PX, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, devicePixelRatio || 1), autoDensity: true }).then(() => {
      if (cancelled) {
        a.destroy(true)
        return
      }
      app = a
      host.current?.appendChild(a.canvas)
      Object.assign(a.canvas.style, { width: '100%', height: '100%' })
      const tiles = new Container()
      const fx = new Container()
      a.stage.addChild(tiles, fx)
      let pool: Graphics[] = []
      let poolSize = 0
      const cellPx = () => (PX - GAP * (state.current.size + 1)) / state.current.size
      const origin = (i: number) => {
        const n = state.current.size
        const c = cellPx()
        return [GAP + (i % n) * (c + GAP), GAP + Math.floor(i / n) * (c + GAP)]
      }
      const build = () => {
        tiles.removeChildren().forEach((g) => g.destroy())
        poolSize = state.current.size
        pool = Array.from({ length: poolSize * poolSize }, (_, i) => {
          const g = new Graphics()
          g.eventMode = 'static'
          g.on('pointertap', () => {
            state.current.onTap?.(i)
            const [x, y] = origin(i)
            const c = cellPx()
            const r = new Graphics().circle(0, 0, c / 2).stroke({ color: 0xffffff, width: 5 })
            r.position.set(x + c / 2, y + c / 2)
            fx.addChild(r)
          })
          tiles.addChild(g)
          return g
        })
      }
      let t = 0
      a.ticker.add((tk) => {
        t += tk.deltaTime / 60
        if (state.current.size !== poolSize) build()
        const c = cellPx()
        pool.forEach((g, i) => {
          const s = state.current.cells[i] ?? 'off'
          const [x, y] = origin(i)
          const pulse = s === 'lit' || s === 'go' ? 1 + Math.sin(t * 6) * 0.05 : 1
          const w = c * pulse
          const o = (w - c) / 2
          g.clear()
          if (s !== 'off') g.roundRect(x - o - 6, y - o - 6, w + 12, w + 12, 22).fill({ color: colors[s], alpha: 0.2 })
          g.roundRect(x - o, y - o, w, w, 16).fill({ color: colors[s] })
          g.cursor = state.current.onTap ? 'pointer' : 'default'
        })
        for (const r of [...fx.children]) {
          r.alpha -= 0.05
          r.scale.set(r.scale.x + 0.025)
          if (r.alpha <= 0) r.destroy()
        }
      })
    })
    return () => {
      cancelled = true
      app?.destroy(true, { children: true })
    }
  }, [])
  return <div ref={host} className="bg-board" role="application" aria-label={label} />
}
