import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Seasonal Market (Three.js): a round market turns through the year —
 * blossoms, sun, falling leaves, snow. Stalls pass by piled with produce. Tap
 * what's naturally in season right now to fill your basket; it's cheaper,
 * tastier and fresher. Out-of-season crates cost more and taste of cardboard.
 */
type Season = 'spring' | 'summer' | 'autumn' | 'winter'
const PRODUCE: { glyph: string; name: string; seasons: Season[] }[] = [
  { glyph: '🍓', name: 'strawberries', seasons: ['summer'] }, { glyph: '🌽', name: 'sweetcorn', seasons: ['summer'] }, { glyph: '🍅', name: 'tomatoes', seasons: ['summer'] },
  { glyph: '🍎', name: 'apples', seasons: ['autumn'] }, { glyph: '🎃', name: 'pumpkins', seasons: ['autumn'] }, { glyph: '🍄', name: 'mushrooms', seasons: ['autumn'] },
  { glyph: '🥕', name: 'carrots', seasons: ['autumn', 'winter'] }, { glyph: '🥬', name: 'kale', seasons: ['winter'] }, { glyph: '🍊', name: 'clementines', seasons: ['winter'] },
  { glyph: '🥦', name: 'purple sprouting broccoli', seasons: ['spring'] }, { glyph: '🌿', name: 'wild garlic', seasons: ['spring'] }, { glyph: '🌱', name: 'pea shoots', seasons: ['spring', 'summer'] },
]
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
const SKY: Record<Season, number> = { spring: 0xcdeccf, summer: 0xbfe3ff, autumn: 0xf6d6b2, winter: 0xdde6f0 }
const GROUND: Record<Season, number> = { spring: 0x8fd18a, summer: 0x7cc36a, autumn: 0xb08950, winter: 0xf1f5f9 }
const SEASON_S = 14

const emojiSprite = (glyph: string) => {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!; g.font = '100px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(glyph, 64, 72)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })); s.scale.set(1.3, 1.3, 1)
  return s
}

export default function SeasonalMarket() {
  const [best, submit] = useBest('seasonal')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ season: 'spring' as Season, basket: [] as string[], score: 0, msg: 'Tap what’s in season!' })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const w = el.clientWidth, h = Math.min(520, Math.round(window.innerHeight * 0.62))
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100); cam.position.set(0, 9, 12); cam.lookAt(0, 0.5, 0)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.3))
    const sun = new THREE.DirectionalLight(0xffffff, 1); sun.position.set(5, 10, 5); scene.add(sun)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: GROUND.spring })); ground.rotation.x = -Math.PI / 2; scene.add(ground)
    const carousel = new THREE.Group(); scene.add(carousel)
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 3, 16), new THREE.MeshStandardMaterial({ color: 0xa16207 })); hub.position.y = 1.5; scene.add(hub)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2, 1.6, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide })); roof.position.y = 4.3; scene.add(roof)
    type Stall = { g: THREE.Group; sprite: THREE.Sprite; item: typeof PRODUCE[number] }
    const stalls: Stall[] = []
    const colors = [0xfde68a, 0xbbf7d0, 0xfecaca, 0xbfdbfe, 0xe9d5ff, 0xfed7aa]
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      const g = new THREE.Group()
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1), new THREE.MeshStandardMaterial({ color: colors[i % colors.length] })); counter.position.y = 0.4
      const awning = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.7), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffffff : 0xef4444 })); awning.position.set(0, 2.3, -0.4)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3), new THREE.MeshStandardMaterial({ color: 0x57534e })); pole.position.set(0, 1.45, -0.4)
      const item = PRODUCE[Math.floor(Math.random() * PRODUCE.length)]
      const sprite = emojiSprite(item.glyph); sprite.position.y = 1.4
      g.add(counter, awning, pole, sprite)
      g.position.set(Math.cos(a) * 5.5, 0, Math.sin(a) * 5.5); g.lookAt(0, 0, 0); g.rotateY(Math.PI)
      carousel.add(g)
      stalls.push({ g, sprite, item })
    }
    // Seasonal particles.
    const pg = new THREE.BufferGeometry(); const pp = new Float32Array(300 * 3)
    for (let i = 0; i < 300; i++) { pp[i * 3] = (Math.random() - 0.5) * 30; pp[i * 3 + 1] = Math.random() * 12; pp[i * 3 + 2] = (Math.random() - 0.5) * 20 }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3))
    const pmat = new THREE.PointsMaterial({ size: 0.18, color: 0xffc0cb })
    const particles = new THREE.Points(pg, pmat); scene.add(particles)
    const s = { t: 0, season: 0, score: 0, basket: [] as string[], good: 0, bad: 0, running: true, cooldown: new Map<Stall, number>() }
    const applySeason = () => {
      const se = SEASONS[s.season]
      scene.background = new THREE.Color(dark ? 0x001a08 : SKY[se]); (ground.material as THREE.MeshStandardMaterial).color.set(dark ? 0x003314 : GROUND[se])
      pmat.color.set(se === 'spring' ? 0xffc0cb : se === 'summer' ? 0xfff59d : se === 'autumn' ? 0xd97706 : 0xffffff)
      pmat.size = se === 'summer' ? 0.08 : 0.18
    }
    applySeason()
    const restock = (st2: Stall) => {
      const se = SEASONS[s.season]
      // Stalls lean toward in-season produce, but not always.
      const pool = Math.random() < 0.55 ? PRODUCE.filter((p) => p.seasons.includes(se)) : PRODUCE
      st2.item = pool[Math.floor(Math.random() * pool.length)]
      const m = st2.sprite.material as THREE.SpriteMaterial
      m.map?.dispose(); m.map = emojiSprite(st2.item.glyph).material.map; m.needsUpdate = true
    }
    stalls.forEach(restock)
    const ray = new THREE.Raycaster()
    const cv = renderer.domElement
    const onDown = (e: PointerEvent) => {
      if (!s.running) return
      const r = cv.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam)
      let bestS: Stall | null = null, bestD = 1.2
      for (const st2 of stalls) { const d = ray.ray.distanceToPoint(st2.sprite.getWorldPosition(new THREE.Vector3())); if (d < bestD) { bestD = d; bestS = st2 } }
      if (!bestS || (s.cooldown.get(bestS) ?? 0) > 0) return
      const se = SEASONS[s.season]
      const inSeason = bestS.item.seasons.includes(se)
      if (inSeason) { s.good++; s.score += 10 } else { s.bad++; s.score = Math.max(0, s.score - 6) }
      s.basket = [...s.basket.slice(-9), bestS.item.glyph]
      setHud({ season: se, basket: s.basket, score: s.score, msg: inSeason ? `${bestS.item.name}: fresh and cheap!` : `${bestS.item.name} are flown in this time of year…` })
      s.cooldown.set(bestS, 1.2)
      bestS.sprite.scale.set(0.2, 0.2, 1)
      restock(bestS)
    }
    cv.addEventListener('pointerdown', onDown)
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      if (s.running) {
        s.t += dt
        if (s.t >= SEASON_S) {
          s.t = 0; s.season++
          if (s.season >= SEASONS.length) {
            s.running = false
            const record = submitRef.current(s.score)
            setResult({ headline: 'A year of good eating', lines: [`${s.good} in-season picks`, `${s.bad} out-of-season`, `Score ${s.score}`], record })
          } else { applySeason(); stalls.forEach(restock); setHud((hh) => ({ ...hh, season: SEASONS[s.season], msg: `It’s ${SEASONS[s.season]} now!` })) }
        }
      }
      carousel.rotation.y += dt * 0.35
      for (const st2 of stalls) { const cd = (s.cooldown.get(st2) ?? 0) - dt; s.cooldown.set(st2, cd); const k = Math.min(1.3, st2.sprite.scale.x + dt * 2); st2.sprite.scale.set(k, k, 1); st2.sprite.position.y = 1.35 + Math.sin(clock.elapsedTime * 3 + st2.g.position.x) * 0.06 }
      const pos = pg.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < 300; i++) { let y = pos.getY(i) - dt * (SEASONS[s.season] === 'winter' ? 1.2 : 0.6); if (y < 0) y = 12; pos.setY(i, y); pos.setX(i, pos.getX(i) + Math.sin(clock.elapsedTime + i) * dt * 0.3) }
      pos.needsUpdate = true
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', onDown); renderer.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setHud({ season: 'spring', basket: [], score: 0, msg: 'Tap what’s in season!' }); setRound((r) => r + 1) }, [])
  const icon = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }[hud.season]
  return (
    <GameShell title="Seasonal Market" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`${icon} ${hud.season} · tap stalls with in-season produce · basket ${hud.basket.join('')} · ${hud.msg}`}>
      <div ref={host} className="fl-host" style={{ cursor: 'pointer' }} />
    </GameShell>
  )
}
