import { useEffect, useRef, useSyncExternalStore } from 'react'

/** The active theme id, live (reads html[data-theme]). */
const subscribe = (l: () => void) => {
  const mo = new MutationObserver(l)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
export const useThemeId = () => useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme ?? '', () => '')
export const useMatrix = () => useThemeId() === 'matrix'

/**
 * Matrix theme backdrop: slow falling glyph rain on a canvas behind the app.
 * Low opacity, ~20 fps, paused when the tab is hidden or motion is reduced.
 */
export function MatrixRain() {
  const on = useMatrix()
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!on || !el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789BLOOM♥✿'
    const size = 16
    let cols: number[] = []
    const resize = () => {
      el.width = window.innerWidth
      el.height = window.innerHeight
      cols = Array.from({ length: Math.ceil(el.width / size) }, () => Math.random() * -50)
    }
    resize()
    window.addEventListener('resize', resize)
    let last = 0
    let raf = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < 50 || document.hidden) return
      last = t
      ctx.fillStyle = 'rgba(3, 10, 5, 0.12)'
      ctx.fillRect(0, 0, el.width, el.height)
      ctx.font = `${size}px VT323, monospace`
      cols.forEach((y, i) => {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)]
        ctx.fillStyle = Math.random() < 0.04 ? '#d6ffe0' : '#39ff6a'
        ctx.fillText(ch, i * size, y * size)
        cols[i] = y * size > el.height && Math.random() > 0.975 ? 0 : y + 1
      })
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [on])
  if (!on) return null
  return <canvas ref={canvas} className="matrix-rain" aria-hidden="true" />
}
