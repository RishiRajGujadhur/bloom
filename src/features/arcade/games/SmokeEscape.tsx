import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Smoke Escape (Three.js): the flat is filling with smoke. Click the tile next
 * to you to move. Standing is quick but the smoke up high hurts; crawl
 * (Space / the button) to stay under it. Before walking through a door, click
 * it once to feel it with the back of your hand — a hot door means fire on
 * the other side. Reach the green door. Three flats.
 */
const COLS = 9, ROWS = 7
const LEVELS = 3
type Cell = { walls: [boolean, boolean, boolean, boolean]; door: number | null } // N E S W; door on one wall index
type Door = { a: [number, number]; b: [number, number]; hot: boolean; felt: boolean; mesh: THREE.Mesh }

const maze = () => {
  const cells: Cell[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ walls: [true, true, true, true] as [boolean, boolean, boolean, boolean], door: null })))
  const seen = new Set<string>()
  const stack: [number, number][] = [[0, 0]]
  seen.add('0,0')
  const D: [number, number, number, number][] = [[0, -1, 0, 2], [1, 0, 1, 3], [0, 1, 2, 0], [-1, 0, 3, 1]]
  while (stack.length) {
    const [x, y] = stack[stack.length - 1]
    const opts = D.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !seen.has(`${nx},${ny}`) })
    if (!opts.length) { stack.pop(); continue }
    const [dx, dy, w, ow] = opts[Math.floor(Math.random() * opts.length)]
    cells[y][x].walls[w] = false; cells[y + dy][x + dx].walls[ow] = false
    seen.add(`${x + dx},${y + dy}`); stack.push([x + dx, y + dy])
  }
  // Knock through a few extra walls so there's more than one route.
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * (COLS - 1)), y = Math.floor(Math.random() * ROWS)
    cells[y][x].walls[1] = false; cells[y][x + 1].walls[3] = false
  }
  return cells
}

export default function SmokeEscape() {
  const [best, submit] = useBest('smoke')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ level: 1, health: 100, crawl: false, msg: 'Crawl low, feel doors, find the green exit.' })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef({ crawl: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const w = el.clientWidth, h = Math.min(540, Math.round(window.innerHeight * 0.64))
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(2, devicePixelRatio))
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.background = new THREE.Color(dark ? 0x001a08 : 0x1c1c22)
    const cam = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
    cam.position.set(COLS / 2 - 0.5, 9.5, ROWS / 2 + 6)
    cam.lookAt(COLS / 2 - 0.5, 0, ROWS / 2 - 0.2)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1))
    const lamp = new THREE.DirectionalLight(0xffffff, 1.2); lamp.position.set(3, 10, 6); lamp.castShadow = true; scene.add(lamp)
    const world = new THREE.Group(); scene.add(world)
    const s = { level: 1, health: 100, crawl: false, x: 0, y: 0, moving: 0, smoke: 0.2, running: true, cells: maze(), doors: [] as Door[], exit: [COLS - 1, ROWS - 1] as [number, number], total: 0, hotHits: 0, t0: performance.now() }
    const tiles: THREE.Mesh[] = []
    const player = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.4, 4, 10), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }))
    body.castShadow = true
    player.add(body)
    scene.add(player)
    // Smoke: a stack of translucent planes whose opacity rises over time.
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x9aa0a6, transparent: true, opacity: 0.2, depthWrite: false })
    const smokeLayers = [1.0, 1.25, 1.5].map((y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(COLS + 2, ROWS + 2), smokeMat); m.rotation.x = -Math.PI / 2; m.position.set(COLS / 2 - 0.5, y, ROWS / 2 - 0.5); scene.add(m); return m })

    const build = () => {
      world.clear(); tiles.length = 0; s.doors = []
      const floorM = new THREE.MeshStandardMaterial({ color: dark ? 0x003314 : 0xc8b89a })
      const wallM = new THREE.MeshStandardMaterial({ color: dark ? 0x00661f : 0xe8e2d6 })
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.1, 0.98), x === s.exit[0] && y === s.exit[1] ? new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x0a5a2a }) : floorM)
        t.position.set(x, -0.05, y); t.receiveShadow = true; t.userData = { x, y }
        world.add(t); tiles.push(t)
        const c = s.cells[y][x]
        if (c.walls[0]) { const wm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 0.08), wallM); wm.position.set(x, 0.45, y - 0.5); world.add(wm) }
        if (c.walls[3]) { const wm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1), wallM); wm.position.set(x - 0.5, 0.45, y); world.add(wm) }
        if (y === ROWS - 1) { const wm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 0.08), wallM); wm.position.set(x, 0.45, y + 0.5); world.add(wm) }
        if (x === COLS - 1) { const wm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1), wallM); wm.position.set(x + 0.5, 0.45, y); world.add(wm) }
      }
      // Doors on some open passages; about a third are hot.
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS - 1; x++) {
        if (s.cells[y][x].walls[1] || Math.random() > 0.22 || (x === 0 && y === 0)) continue
        const hot = Math.random() < 0.38
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.9), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }))
        m.position.set(x + 0.5, 0.43, y); m.userData = { door: true }
        world.add(m)
        s.doors.push({ a: [x, y], b: [x + 1, y], hot, felt: false, mesh: m })
        if (hot) { const glow = new THREE.PointLight(0xff5a1f, 0.8, 1.6); glow.position.set(x + 1, 0.3, y); world.add(glow) }
      }
      s.x = 0; s.y = 0
      player.position.set(0, 0.35, 0)
    }
    build()
    const doorBetween = (ax: number, ay: number, bx: number, by: number) => s.doors.find((d) => (d.a[0] === ax && d.a[1] === ay && d.b[0] === bx && d.b[1] === by) || (d.b[0] === ax && d.b[1] === ay && d.a[0] === bx && d.a[1] === by))
    const canStep = (dx: number, dy: number) => {
      const c = s.cells[s.y][s.x]
      const wi = dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0
      return !c.walls[wi]
    }
    const say = (msg: string) => setHud((hh) => ({ ...hh, msg }))
    const finish = (headline: string) => {
      s.running = false
      const score = Math.max(0, Math.round(s.total))
      const record = submitRef.current(score)
      setResult({ headline, lines: [`${s.level - (headline.startsWith('Out') ? 0 : 1)} of ${LEVELS} flats escaped`, `${s.hotHits} hot doors opened`, `Score ${score}`], record })
    }
    api.current.crawl = () => { s.crawl = !s.crawl; setHud((hh) => ({ ...hh, crawl: s.crawl })) }
    const ray = new THREE.Raycaster()
    const cv = renderer.domElement
    const onDown = (e: PointerEvent) => {
      if (!s.running || s.moving > 0) return
      const r = cv.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam)
      const doorHit = ray.intersectObjects(s.doors.map((d) => d.mesh))[0]
      if (doorHit) {
        const d = s.doors.find((x) => x.mesh === doorHit.object)!
        const near = (d.a[0] === s.x && d.a[1] === s.y) || (d.b[0] === s.x && d.b[1] === s.y)
        if (near && !d.felt) {
          d.felt = true
          ;(d.mesh.material as THREE.MeshStandardMaterial).color.set(d.hot ? 0xdc2626 : 0x60a5fa)
          say(d.hot ? 'Ouch — that door is hot! Find another way.' : 'Cool to the touch. Safe to go through.')
          return
        }
      }
      const hit = ray.intersectObjects(tiles)[0]
      if (!hit) return
      const { x, y } = hit.object.userData as { x: number; y: number }
      const dx = x - s.x, dy = y - s.y
      if (Math.abs(dx) + Math.abs(dy) !== 1 || !canStep(dx, dy)) return
      const door = doorBetween(s.x, s.y, x, y)
      if (door && !door.felt) say('You rushed through without feeling the door…')
      if (door && door.hot) { s.health -= 40; s.hotHits++; say('A wall of heat! Never open a hot door.') }
      s.x = x; s.y = y
      s.moving = s.crawl ? 0.6 : 0.3
    }
    cv.addEventListener('pointerdown', onDown)
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); api.current.crawl() } }
    window.addEventListener('keydown', onKey)

    const clock = new THREE.Clock()
    let raf = 0
    let hudT = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      if (s.running) {
        s.smoke = Math.min(1, s.smoke + dt * 0.012)
        s.health -= dt * s.smoke * (s.crawl ? 1.5 : 9)
        if (s.moving > 0) s.moving = Math.max(0, s.moving - dt)
        if (s.health <= 0) finish('Overcome by smoke')
        else if (s.x === s.exit[0] && s.y === s.exit[1] && s.moving === 0) {
          s.total += s.health + Math.max(0, 60 - (performance.now() - s.t0) / 1000)
          if (s.level >= LEVELS) finish('Out safe! 🚒')
          else { s.level++; s.health = Math.min(100, s.health + 40); s.smoke = 0.2 + s.level * 0.08; s.cells = maze(); build(); s.t0 = performance.now(); say(`Flat ${s.level}: stay low, feel the doors.`) }
        }
      }
      // Animate player toward its tile, low when crawling.
      const target = new THREE.Vector3(s.x, s.crawl ? 0.18 : 0.42, s.y)
      player.position.lerp(target, 0.2)
      body.rotation.x = s.crawl ? Math.PI / 2 : 0
      smokeMat.opacity = 0.15 + s.smoke * 0.55
      smokeLayers.forEach((m, i) => { m.position.x = COLS / 2 - 0.5 + Math.sin(clock.elapsedTime * 0.4 + i) * 0.2 })
      if ((hudT += dt) > 0.2) { hudT = 0; setHud((hh) => ({ ...hh, level: s.level, health: Math.max(0, Math.round(s.health)), crawl: s.crawl })) }
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); renderer.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Smoke Escape" score={hud.health} best={best} result={result} onRestart={restart}
      hint={`Flat ${hud.level}/${LEVELS} · health ${hud.health} · ${hud.crawl ? 'crawling low' : 'standing'} · ${hud.msg}`}>
      <div ref={host} className="fl-host" />
      <div className="cf-tray">
        <button type="button" className={hud.crawl ? 'on' : ''} onClick={() => api.current.crawl()}>{hud.crawl ? '🐢 Crawling (Space)' : '🧍 Standing (Space to crawl)'}</button>
      </div>
    </GameShell>
  )
}
