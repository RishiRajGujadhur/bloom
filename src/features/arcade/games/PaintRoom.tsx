import { useCallback, useEffect, useRef, useState } from 'react'
import * as pc from 'playcanvas'
import { GameShell, useBest } from '../shell'

/**
 * Paint the Room (PlayCanvas): a tired wall and a fresh tin of paint. Dip the
 * roller in the tray, then press and roll over the wall. Too much paint drips;
 * too little leaves it patchy. One coat never quite covers — let it dry, then
 * give it a second. Three rooms, three colours.
 */
const TW = 256, TH = 128 // paint texture resolution
const ROOMS = [{ name: 'Sage', color: [134, 170, 130] }, { name: 'Terracotta', color: [204, 110, 80] }, { name: 'Ocean', color: [70, 130, 190] }]

export default function PaintRoom() {
  const [best, submit] = useBest('paint')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ room: 1, cover: 0, load: 0, wet: 0, drips: 0, coat: 1 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef({ dip: () => {}, done: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const cv = document.createElement('canvas')
    cv.className = 'co-canvas'
    el.appendChild(cv)
    const app = new pc.Application(cv, { mouse: new pc.Mouse(cv), touch: new pc.TouchDevice(cv) })
    app.setCanvasFillMode(pc.FILLMODE_NONE); app.setCanvasResolution(pc.RESOLUTION_AUTO)
    app.resizeCanvas(cv.clientWidth, cv.clientHeight)
    const mat = (hex: string) => { const m = new pc.StandardMaterial(); m.diffuse = new pc.Color().fromString(hex); m.update(); return m }
    const box = (pos: [number, number, number], scale: [number, number, number], m: pc.Material, type = 'box') => { const e = new pc.Entity(); e.addComponent('render', { type, material: m }); e.setLocalPosition(...pos); e.setLocalScale(...scale); app.root.addChild(e); return e }
    const cam = new pc.Entity(); cam.addComponent('camera', { clearColor: new pc.Color(0.95, 0.94, 0.9), fov: 50 }); cam.setPosition(0, 1.5, 4.6); cam.lookAt(0, 1.45, 0); app.root.addChild(cam)
    const light = new pc.Entity(); light.addComponent('light', { type: 'directional', intensity: 0.9 }); light.setEulerAngles(40, 20, 0); app.root.addChild(light)
    app.scene.ambientLight = new pc.Color(0.6, 0.6, 0.62)
    // The paintable wall: a canvas texture we draw paint into.
    const paint = document.createElement('canvas'); paint.width = TW; paint.height = TH
    const pctx = paint.getContext('2d')!
    const coverage = new Float32Array(TW * TH) // paint thickness 0..2
    const wetness = new Float32Array(TW * TH)
    const tex = new pc.Texture(app.graphicsDevice, { width: TW, height: TH, format: pc.PIXELFORMAT_RGBA8, mipmaps: false })
    tex.setSource(paint)
    const wallM = new pc.StandardMaterial(); wallM.diffuseMap = tex; wallM.update()
    const wall = box([0, 1.5, 0], [6, 1, 3], wallM, 'plane')
    wall.setLocalEulerAngles(90, 0, 0)
    box([0, 0, 1.5], [6, 0.02, 3], mat('#b08968'))
    box([-3, 1.5, 1.5], [0.05, 3, 3], mat('#e7e5e4')); box([3, 1.5, 1.5], [0.05, 3, 3], mat('#e7e5e4'))
    box([0, 0.02, 1.4], [5.6, 0.02, 1.6], mat('#e5e7eb')) // dust sheet
    const tray = box([2.1, 0.08, 2.2], [0.8, 0.1, 0.5], mat('#94a3b8'))
    void tray
    const roller = new pc.Entity(); app.root.addChild(roller)
    const rHead = new pc.Entity(); rHead.addComponent('render', { type: 'cylinder' }); rHead.setLocalScale(0.18, 0.5, 0.18); rHead.setLocalEulerAngles(0, 0, 90); roller.addChild(rHead)
    const rHandle = new pc.Entity(); rHandle.addComponent('render', { type: 'box', material: mat('#facc15') }); rHandle.setLocalScale(0.05, 0.9, 0.05); rHandle.setLocalPosition(0, -0.5, 0.1); roller.addChild(rHandle)
    const s = { room: 0, load: 0, drips: 0, coat: 1, painting: false, u: 0, v: 0, lastU: -1, lastV: -1, running: true, score: 0, lines: [] as string[] }
    const col = () => ROOMS[s.room].color
    const redraw = () => {
      const img = pctx.createImageData(TW, TH)
      const [r, g, b] = col()
      for (let i = 0; i < TW * TH; i++) {
        const c = Math.min(1, coverage[i] / 1.6)
        const wet = wetness[i]
        // Old wall is a tired cream; paint blends in with thickness and looks darker while wet.
        img.data[i * 4] = 225 * (1 - c) + r * c * (1 - wet * 0.15)
        img.data[i * 4 + 1] = 215 * (1 - c) + g * c * (1 - wet * 0.15)
        img.data[i * 4 + 2] = 190 * (1 - c) + b * c * (1 - wet * 0.15)
        img.data[i * 4 + 3] = 255
      }
      pctx.putImageData(img, 0, 0)
      tex.upload()
    }
    const reset = () => { coverage.fill(0); wetness.fill(0); s.load = 0; s.drips = 0; s.coat = 1; rHead.render!.meshInstances[0].material = mat('#f5f5f4'); redraw() }
    reset()
    const roll = (u: number, v: number) => {
      if (s.load <= 0.02) return
      const cx = u * TW, cy = v * TH
      const steps = s.lastU < 0 ? 1 : Math.ceil(Math.hypot(cx - s.lastU * TW, cy - s.lastV * TH) / 2)
      for (let k = 0; k < steps; k++) {
        const px = s.lastU < 0 ? cx : s.lastU * TW + (cx - s.lastU * TW) * (k / steps)
        const py = s.lastV < 0 ? cy : s.lastV * TH + (cy - s.lastV * TH) * (k / steps)
        for (let dy = -14; dy <= 14; dy++) for (let dx = -5; dx <= 5; dx++) {
          const x = Math.round(px + dx), y = Math.round(py + dy)
          if (x < 0 || y < 0 || x >= TW || y >= TH) continue
          const i = y * TW + x
          // Rolling over wet paint just smooshes it around; dry paint takes a fresh layer.
          const add = s.load * 0.12 * (wetness[i] > 0.5 && coverage[i] > 0.7 ? 0.2 : 1)
          coverage[i] = Math.min(2, coverage[i] + add)
          wetness[i] = 1
        }
        s.load = Math.max(0, s.load - 0.003)
      }
      // Overloaded rollers drip.
      if (s.load > 0.8 && Math.random() < 0.05) {
        s.drips++
        const x = Math.round(cx)
        for (let y = Math.round(cy); y < Math.min(TH, cy + 30); y++) { const i = y * TW + x; coverage[i] = 2; wetness[i] = 1 }
      }
      s.lastU = u; s.lastV = v
    }
    api.current.dip = () => { s.load = Math.min(1.2, s.load + 0.55); const m = rHead.render!.meshInstances[0].material as pc.StandardMaterial; const [r, g, b] = col(); m.diffuse = new pc.Color(r / 255, g / 255, b / 255); m.update() }
    api.current.done = () => {
      if (!s.running) return
      let covered = 0, total = 0, sum = 0, sq = 0
      for (let i = 0; i < TW * TH; i++) { total++; if (coverage[i] >= 1.2) covered++; sum += coverage[i]; sq += coverage[i] * coverage[i] }
      const mean = sum / total
      const even = Math.max(0, 1 - Math.sqrt(sq / total - mean * mean))
      const pct = Math.round((covered / total) * 100)
      const pts = Math.max(0, Math.round(pct * 0.8 + even * 30 - s.drips * 4))
      s.score += pts; s.lines.push(`${ROOMS[s.room].name}: ${pct}% covered, ${s.drips} drips`)
      if (s.room + 1 >= ROOMS.length) {
        s.running = false
        const record = submitRef.current(s.score)
        setResult({ headline: 'Fresh as new', lines: [...s.lines, `Score ${s.score}`], record })
      } else { s.room++; reset() }
    }
    const plane = new pc.Plane(new pc.Vec3(0, 0, 1), 0)
    const toUV = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      const from = cam.camera!.screenToWorld(e.clientX - r.left, e.clientY - r.top, cam.camera!.nearClip)
      const to = cam.camera!.screenToWorld(e.clientX - r.left, e.clientY - r.top, cam.camera!.farClip)
      const hit = new pc.Vec3()
      if (!plane.intersectsRay(new pc.Ray(from, to.clone().sub(from).normalize()), hit)) return null
      const u = (hit.x + 3) / 6, v = 1 - hit.y / 3
      roller.setPosition(hit.x, hit.y, 0.2)
      return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? { u, v } : null
    }
    cv.addEventListener('pointerdown', (e) => { s.painting = true; s.lastU = -1; const p = toUV(e); if (p) roll(p.u, p.v) })
    cv.addEventListener('pointermove', (e) => { const p = toUV(e); if (p && s.painting) roll(p.u, p.v) })
    const stop = () => { s.painting = false; s.lastU = -1; s.lastV = -1 }
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointerleave', stop)
    let acc = 0, hudT = 0
    app.on('update', (dt: number) => {
      // Paint dries slowly.
      for (let i = 0; i < wetness.length; i++) if (wetness[i] > 0) wetness[i] = Math.max(0, wetness[i] - dt * 0.12)
      if ((acc += dt) > 0.05) { acc = 0; redraw() }
      rHead.setLocalEulerAngles(0, 0, 90)
      if ((hudT += dt) > 0.25) {
        hudT = 0
        let covered = 0, wet = 0
        for (let i = 0; i < coverage.length; i += 7) { if (coverage[i] >= 1.2) covered++; if (wetness[i] > 0.3) wet++ }
        setHud({ room: s.room + 1, cover: Math.round((covered / (coverage.length / 7)) * 100), load: s.load, wet: Math.round((wet / (coverage.length / 7)) * 100), drips: s.drips, coat: s.coat })
      }
    })
    app.start()
    const onResize = () => app.resizeCanvas(cv.clientWidth, cv.clientHeight)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); app.destroy(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Paint the Room" score={hud.cover} best={best} result={result} onRestart={restart}
      hint={`Room ${hud.room}/3 · dip, then press and roll over the wall · ${hud.cover}% fully covered · ${hud.wet}% still wet · drips ${hud.drips}`}>
      <div ref={host} />
      <div className="cf-tray">
        <span className="dd-meter" style={{ minWidth: 140 }}><i style={{ width: `${Math.min(100, hud.load * 83)}%`, background: hud.load > 0.8 ? '#ef4444aa' : '#60a5faaa' }} />roller {hud.load > 0.8 ? 'dripping!' : hud.load > 0.1 ? 'loaded' : 'dry'}</span>
        <button type="button" onClick={() => api.current.dip()}>🪣 Dip the roller</button>
        <button type="button" className="cf-match" onClick={() => api.current.done()}>✓ Wall’s done</button>
      </div>
    </GameShell>
  )
}
