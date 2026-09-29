import type { SceneFactory } from '../../platform/offscreen'

/**
 * Matrix glyph rain as a portable scene: it runs in a worker on an
 * OffscreenCanvas (so heavy pages never freeze the rain) or on the main thread.
 * Messages: 'visible' boolean (pauses while the tab is hidden).
 */
export const createMatrixScene: SceneFactory<null> = async (canvas, o) => {
  const ctx = (canvas as OffscreenCanvas).getContext('2d') as OffscreenCanvasRenderingContext2D
  const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789BLOOM♥✿'
  const size = 16
  let W = o.width
  let H = o.height
  let cols: number[] = []
  const resize = (w: number, h: number) => {
    W = w
    H = h
    canvas.width = w
    canvas.height = h
    cols = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -50)
  }
  resize(W, H)
  let visible = true
  let last = 0
  let raf = 0
  const draw = (t: number) => {
    raf = requestAnimationFrame(draw)
    if (t - last < 50 || !visible) return
    last = t
    ctx.fillStyle = 'rgba(3, 10, 5, 0.12)'
    ctx.fillRect(0, 0, W, H)
    ctx.font = `${size}px VT323, monospace`
    cols.forEach((y, i) => {
      ctx.fillStyle = Math.random() < 0.04 ? '#d6ffe0' : '#39ff6a'
      ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * size, y * size)
      cols[i] = y * size > H && Math.random() > 0.975 ? 0 : y + 1
    })
  }
  raf = requestAnimationFrame(draw)
  return {
    backend: '2d',
    resize,
    message: (type, p) => { if (type === 'visible') visible = p as boolean },
    dispose: () => cancelAnimationFrame(raf),
  }
}
