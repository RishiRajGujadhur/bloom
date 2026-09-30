/**
 * CSS Houdini paint worklet: `background-image: paint(bloom-scene)`.
 * Twelve generative scenes, one per kind of page, each composed from a
 * per-page seed and gently animated by the registered `--scene-t` property.
 * Runs in the browser's paint worklet — no DOM, no canvas elements.
 */
declare function registerPaint(name: string, ctor: unknown): void
type Ctx = CanvasRenderingContext2D
type Props = { get: (name: string) => { toString: () => string } }

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => ((s = (s ^ (s << 13)) >>> 0, s = (s ^ (s >>> 17)) >>> 0, s = (s ^ (s << 5)) >>> 0) / 4294967296)
}
const TAU = Math.PI * 2

function scene(kind: string, g: Ctx, W: number, H: number, seed: number, t: number, ink: string) {
  const r = rng(seed)
  g.strokeStyle = ink
  g.fillStyle = ink
  g.lineCap = 'round'
  g.lineJoin = 'round'
  const phase = t * TAU
  switch (kind) {
    case 'rays': {
      // Sunrise: rays fan from a sun on the right.
      const cx = W * (0.72 + r() * 0.2), cy = H * 1.05
      const n = 18 + Math.floor(r() * 10)
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI + Math.sin(phase + i) * 0.01
        g.globalAlpha = 0.05 + 0.08 * ((i % 3) / 2)
        g.lineWidth = 6 + (i % 4) * 5
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * W, cy + Math.sin(a) * W); g.stroke()
      }
      g.globalAlpha = 0.18
      g.beginPath(); g.arc(cx, cy, 40 + 8 * Math.sin(phase), 0, TAU); g.fill()
      break
    }
    case 'waves': {
      for (let k = 0; k < 6; k++) {
        g.globalAlpha = 0.07 + k * 0.02
        g.lineWidth = 1.5 + k * 0.4
        const amp = 8 + r() * 14, freq = 0.006 + r() * 0.01, off = r() * TAU
        g.beginPath()
        for (let x = W * 0.25; x <= W; x += 6) {
          const y = H * (0.25 + k * 0.12) + Math.sin(x * freq + off + phase * (k % 2 ? 1 : -1)) * amp
          if (x === W * 0.25) g.moveTo(x, y); else g.lineTo(x, y)
        }
        g.stroke()
      }
      break
    }
    case 'stars': {
      const pts = Array.from({ length: 26 }, () => [W * (0.3 + r() * 0.7), H * r(), r()])
      g.globalAlpha = 0.14
      g.lineWidth = 1
      for (let i = 0; i < pts.length; i++) {
        const j = (i * 7 + 3) % pts.length
        if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 180) { g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[j][0], pts[j][1]); g.stroke() }
      }
      for (const [x, y, s] of pts) {
        g.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(phase * 2 + s * 20))
        g.beginPath(); g.arc(x, y, 1.2 + s * 2.4, 0, TAU); g.fill()
      }
      break
    }
    case 'topo': {
      const cx = W * (0.6 + r() * 0.3), cy = H * (0.3 + r() * 0.5)
      g.lineWidth = 1.2
      for (let k = 1; k < 12; k++) {
        g.globalAlpha = 0.06 + (k % 3 === 0 ? 0.08 : 0)
        g.beginPath()
        for (let a = 0; a <= TAU + 0.01; a += 0.12) {
          const rr = k * 18 * (1 + 0.18 * Math.sin(a * 3 + seed + k * 0.3 + phase * 0.5))
          const x = cx + Math.cos(a) * rr * 1.6, y = cy + Math.sin(a) * rr
          if (a === 0) g.moveTo(x, y); else g.lineTo(x, y)
        }
        g.stroke()
      }
      break
    }
    case 'pulse': {
      g.lineWidth = 2
      for (let k = 0; k < 3; k++) {
        g.globalAlpha = 0.1 + k * 0.06
        const y0 = H * (0.3 + k * 0.22)
        const beat = 90 + r() * 60
        g.beginPath()
        for (let x = W * 0.25; x <= W; x += 3) {
          const u = ((x + phase * beat * 2) % beat) / beat
          const y = u > 0.4 && u < 0.46 ? y0 - 22 : u >= 0.46 && u < 0.5 ? y0 + 14 : u > 0.6 && u < 0.7 ? y0 - 5 * Math.sin((u - 0.6) * 31) : y0
          if (x === W * 0.25) g.moveTo(x, y); else g.lineTo(x, y)
        }
        g.stroke()
      }
      break
    }
    case 'grid': {
      const hy = H * 0.35
      g.lineWidth = 1
      g.globalAlpha = 0.1
      for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(W * 0.62 + i * 12, hy); g.lineTo(W * 0.62 + i * 90, H); g.stroke() }
      for (let k = 0; k < 9; k++) {
        const f = ((k + t * 2) % 9) / 9
        const y = hy + (H - hy) * f * f
        g.globalAlpha = 0.04 + 0.12 * f
        g.beginPath(); g.moveTo(W * 0.2, y); g.lineTo(W, y); g.stroke()
      }
      break
    }
    case 'bubbles': {
      for (let i = 0; i < 22; i++) {
        const x = W * (0.3 + r() * 0.7), base = H * r(), rad = 4 + r() * 22, sp = 0.5 + r()
        const y = ((base - phase * 20 * sp) % (H + 40) + H + 40) % (H + 40) - 20
        g.globalAlpha = 0.08 + r() * 0.1
        g.lineWidth = 1.5
        g.beginPath(); g.arc(x + Math.sin(phase + i) * 6, y, rad, 0, TAU); g.stroke()
      }
      break
    }
    case 'petals': {
      for (let i = 0; i < 18; i++) {
        const x = W * (0.3 + r() * 0.7) + Math.sin(phase + i) * 12, y = (H * r() + phase * 18 * (0.5 + r())) % (H + 30) - 15
        const a = r() * TAU + phase * (r() - 0.5)
        g.save(); g.translate(x, y); g.rotate(a)
        g.globalAlpha = 0.1 + r() * 0.14
        g.beginPath(); g.ellipse(0, 0, 9 + r() * 7, 4 + r() * 3, 0, 0, TAU); g.fill()
        g.restore()
      }
      break
    }
    case 'leaves': {
      for (let i = 0; i < 9; i++) {
        const x = W * (0.35 + r() * 0.65), y = H * (0.2 + r() * 0.8), s = 18 + r() * 26, a = -0.6 + r() * 1.2 + Math.sin(phase + i) * 0.06
        g.save(); g.translate(x, y); g.rotate(a)
        g.globalAlpha = 0.09 + r() * 0.08
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.6, -s * 0.5, 0, -s * 1.6); g.quadraticCurveTo(-s * 0.6, -s * 0.5, 0, 0); g.fill()
        g.globalAlpha = 0.18; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s * 1.5); g.stroke()
        g.restore()
      }
      break
    }
    case 'notes': {
      const y0 = H * (0.3 + r() * 0.2)
      g.lineWidth = 1
      g.globalAlpha = 0.14
      for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(W * 0.3, y0 + k * 10); g.lineTo(W, y0 + k * 10); g.stroke() }
      for (let i = 0; i < 12; i++) {
        const x = W * 0.34 + ((i * 64 + phase * 30) % (W * 0.66)), line = Math.floor(r() * 9)
        const y = y0 + line * 5 + Math.sin(phase * 2 + i) * 2
        g.globalAlpha = 0.28
        g.beginPath(); g.ellipse(x, y, 5, 3.6, -0.4, 0, TAU); g.fill()
        g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 4.5, y); g.lineTo(x + 4.5, y - 22); g.stroke()
      }
      break
    }
    case 'hex': {
      const s = 16 + r() * 8
      g.lineWidth = 1
      for (let row = 0; row < H / (s * 1.5) + 1; row++) for (let col = 0; col < W / (s * 1.73) + 1; col++) {
        const x = col * s * 1.73 + (row % 2) * s * 0.87, y = row * s * 1.5
        if (x < W * 0.35) continue
        const lit = 0.5 + 0.5 * Math.sin(phase * 2 + col * 0.7 + row * 1.3 + seed)
        g.globalAlpha = 0.03 + 0.1 * lit * lit
        g.beginPath()
        for (let k = 0; k < 6; k++) { const a = TAU * k / 6 + Math.PI / 6; const px = x + Math.cos(a) * s * 0.9, py = y + Math.sin(a) * s * 0.9; if (k) g.lineTo(px, py); else g.moveTo(px, py) }
        g.closePath(); g.stroke()
      }
      break
    }
    default: {
      // 'rain': soft diagonal strokes, like writing on a rainy window.
      g.lineWidth = 1.5
      for (let i = 0; i < 40; i++) {
        const x = W * (0.25 + r() * 0.8), y = (H * r() + phase * 60 * (0.6 + r())) % (H + 40) - 20, l = 10 + r() * 22
        g.globalAlpha = 0.07 + r() * 0.1
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * 0.35, y + l); g.stroke()
      }
    }
  }
  g.globalAlpha = 1
}

registerPaint('bloom-scene', class {
  static get inputProperties() { return ['--scene-kind', '--scene-seed', '--scene-t', '--scene-ink'] }
  paint(g: Ctx, size: { width: number; height: number }, props: Props) {
    const kind = props.get('--scene-kind').toString().trim() || 'waves'
    const seed = Number(props.get('--scene-seed').toString()) || 1
    const t = Number(props.get('--scene-t').toString()) || 0
    const ink = props.get('--scene-ink').toString().trim() || '#c26a4a'
    // Painted twice for presence without per-shape alpha tuning.
    scene(kind, g, size.width, size.height, seed, t, ink)
    scene(kind, g, size.width, size.height, seed, t, ink)
  }
})
