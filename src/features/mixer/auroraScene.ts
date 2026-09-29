import type { SceneFactory } from '../../platform/offscreen'

/**
 * Soundscape aurora: flowing ribbons whose height follows the live spectrum
 * of the mix, drawn on a 2D OffscreenCanvas in a worker. Messages:
 * 'spectrum' Uint8Array, 'quality' 'high' | 'low' (from Compute Pressure).
 */
export const createAuroraScene: SceneFactory<null> = async (canvas, o) => {
  const ctx = (canvas as OffscreenCanvas).getContext('2d') as OffscreenCanvasRenderingContext2D
  let W = o.width
  let H = o.height
  const size = (w: number, h: number) => { W = w; H = h; canvas.width = Math.round(w * o.dpr); canvas.height = Math.round(h * o.dpr); ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0) }
  size(W, H)
  let spec: Uint8Array = new Uint8Array(64)
  let smooth = new Float32Array(64)
  let quality: 'high' | 'low' = 'high'
  let raf = 0
  let last = 0
  const hues = [168, 190, 270, 320]
  const draw = (t: number) => {
    raf = requestAnimationFrame(draw)
    // Under CPU pressure: 20 fps, fewer ribbons and points.
    if (quality === 'low' && t - last < 50) return
    last = t
    const bands = quality === 'low' ? 24 : 64
    for (let i = 0; i < bands; i++) {
      const src = spec[Math.floor((i / bands) * spec.length * 0.7)] / 255
      smooth[i] = smooth[i] * 0.85 + src * 0.15
    }
    ctx.fillStyle = 'rgba(6, 10, 26, 0.35)'
    ctx.fillRect(0, 0, W, H)
    const ribbons = quality === 'low' ? 2 : 4
    ctx.globalCompositeOperation = 'screen'
    for (let r = 0; r < ribbons; r++) {
      const g = ctx.createLinearGradient(0, H * 0.2, 0, H)
      g.addColorStop(0, `hsla(${hues[r]}, 90%, 65%, 0)`)
      g.addColorStop(0.5, `hsla(${hues[r]}, 90%, 58%, 0.16)`)
      g.addColorStop(1, `hsla(${hues[r] + 20}, 90%, 55%, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let i = 0; i <= bands; i++) {
        const x = (i / bands) * W
        const e = smooth[Math.min(bands - 1, i)]
        const wave = Math.sin(i * 0.25 + t / (1400 + r * 500) + r) * 0.08 + Math.sin(i * 0.07 - t / 2600) * 0.06
        const y = H * (0.78 - r * 0.07) - (e * 0.55 + wave + 0.08) * H * 0.6
        ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
    // Rising sparks on the loudest bands.
    const sparks = quality === 'low' ? 6 : 18
    for (let s = 0; s < sparks; s++) {
      const i = (s * 7 + Math.floor(t / 90)) % bands
      const e = smooth[i]
      if (e < 0.25) continue
      const x = (i / bands) * W
      const y = H * (0.7 - ((t / 20 + s * 37) % 100) / 180)
      ctx.fillStyle = `hsla(${190 + e * 120}, 100%, 80%, ${e * 0.8})`
      ctx.beginPath()
      ctx.arc(x, y, 1.5 + e * 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  raf = requestAnimationFrame(draw)
  return {
    backend: '2d',
    resize: (w, h) => size(w, h),
    message: (type, p) => {
      if (type === 'spectrum') { spec = p as Uint8Array; if (smooth.length !== 64) smooth = new Float32Array(64) }
      if (type === 'quality') quality = p as 'high' | 'low'
    },
    dispose: () => cancelAnimationFrame(raf),
  }
}
