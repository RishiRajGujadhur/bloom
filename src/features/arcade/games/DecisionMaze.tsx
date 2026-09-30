import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Decision Maze (Three.js): a garden maze where every fork offers two gates.
 * One sign promises something shiny now; the other promises something later.
 * Walk through a gate and you find out what it really cost — shortcuts through
 * the brambles slow you down later, the long way round sometimes finds a
 * key. Reach the fountain at the heart with as much as you can carry.
 */
type Choice = { now: string; nowGold: number; nowTime: number; later: string; laterGold: number; laterTime: number; twist: string }
const FORKS: Choice[] = [
  { now: 'Gold on the path', nowGold: 5, nowTime: 3, later: 'Mossy steps', laterGold: 0, laterTime: 2, twist: 'the mossy steps hid a key worth 12 later' },
  { now: 'Shortcut through brambles', nowGold: 0, nowTime: -3, later: 'Long way round', laterGold: 4, laterTime: 4, twist: 'the brambles tore your bag: −6 later' },
  { now: 'Sweets stall', nowGold: -3, nowTime: 1, later: 'Save your coins', laterGold: 0, laterTime: 0, twist: 'the sweets were gone in a minute' },
  { now: 'Lend a hand to a gardener', nowGold: 0, nowTime: 4, later: 'Hurry past', laterGold: 0, laterTime: -1, twist: 'the gardener showed you a hidden gate: −5 time later' },
  { now: 'Glittering pond coins', nowGold: 8, nowTime: 2, later: 'Plain gravel path', laterGold: 2, laterTime: 1, twist: 'the pond coins were chocolate…' },
  { now: 'Rest on the bench', nowGold: 0, nowTime: 3, later: 'Keep walking tired', laterGold: 0, laterTime: -1, twist: 'tired legs slowed the last stretch: +6 time' },
]
const LATER: Record<number, { nowBonus: number; laterBonus: number; nowTime: number; laterTime: number }> = {
  0: { nowBonus: 0, laterBonus: 12, nowTime: 0, laterTime: 0 }, 1: { nowBonus: -6, laterBonus: 0, nowTime: 0, laterTime: 0 },
  2: { nowBonus: 0, laterBonus: 0, nowTime: 0, laterTime: 0 }, 3: { nowBonus: 0, laterBonus: 0, nowTime: -5, laterTime: 0 },
  4: { nowBonus: -8, laterBonus: 0, nowTime: 0, laterTime: 0 }, 5: { nowBonus: 0, laterBonus: 0, nowTime: 0, laterTime: 6 },
}

export default function DecisionMaze() {
  const host = useRef<HTMLDivElement>(null)
  const [best, submit] = useBest('maze')
  const [fork, setFork] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [gold, setGold] = useState(10)
  const [time, setTime] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ walk: (side: -1 | 1, done: () => void) => void }>({ walk: () => {} })
  const busy = useRef(false)
  const st = useRef({ gold: 10, time: 0, picks: [] as ('now' | 'later')[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { gold: 10, time: 0, picks: [] }; setFork(0); setLog([]); setGold(10); setTime(0); busy.current = false }, [round])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const w = el.clientWidth, h = Math.min(480, Math.round(window.innerHeight * 0.58))
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.background = new THREE.Color(dark ? 0x001a08 : 0xbfe3ff); scene.fog = new THREE.Fog(scene.background as THREE.Color, 12, 40)
    const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 1.2))
    const sun = new THREE.DirectionalLight(0xffffff, 1); sun.position.set(4, 10, 6); scene.add(sun)
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: dark ? 0x004a1c : 0x7cc36a })); grass.rotation.x = -Math.PI / 2; scene.add(grass)
    const hedgeM = new THREE.MeshStandardMaterial({ color: dark ? 0x00661f : 0x2f7d3b, roughness: 1 })
    const pathM = new THREE.MeshStandardMaterial({ color: 0xd6c08f })
    const world = new THREE.Group(); scene.add(world)
    // Build a straight corridor that splits into two gates at z = -8 for each fork.
    const buildFork = () => {
      world.clear()
      const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 10), pathM); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, -3); world.add(path)
      for (const x of [-2.2, 2.2]) { const hedge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 10), hedgeM); hedge.position.set(x, 1.2, -3); world.add(hedge) }
      const back = new THREE.Mesh(new THREE.BoxGeometry(12, 2.4, 1.2), hedgeM); back.position.set(0, 1.2, -14); world.add(back)
      for (const side of [-1, 1]) {
        const p2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6), pathM); p2.rotation.x = -Math.PI / 2; p2.rotation.z = side * 0.6; p2.position.set(side * 2.5, 0.011, -10); world.add(p2)
        const arch = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.14, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: side < 0 ? 0xf59e0b : 0x60a5fa, emissive: side < 0 ? 0x5a3a00 : 0x0a2a5a }))
        arch.position.set(side * 2.8, 0, -11.5); arch.rotation.y = -side * 0.5; world.add(arch)
      }
      for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshStandardMaterial({ color: [0xf472b6, 0xfacc15, 0xffffff][i % 3] })); f.position.set((i % 2 ? 1 : -1) * 1.5, 0.15, -1 - i * 1.4); world.add(f) }
    }
    buildFork()
    const cp = { x: 0, z: 4, yaw: 0 }
    api.current.walk = (side, done) => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1600)
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        cp.z = 4 - e * 15; cp.x = e > 0.5 ? side * (e - 0.5) * 6 : 0; cp.yaw = e > 0.4 ? side * -0.5 * Math.min(1, (e - 0.4) * 3) : 0
        if (t < 1) requestAnimationFrame(tick)
        else { cp.x = 0; cp.z = 4; cp.yaw = 0; buildFork(); done() }
      }
      requestAnimationFrame(tick)
    }
    let raf = 0
    const clock = new THREE.Clock()
    const loop = () => {
      const t = clock.getElapsedTime()
      cam.position.set(cp.x, 1.7 + Math.sin(t * 6) * 0.02, cp.z)
      cam.rotation.set(0, cp.yaw, 0)
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); renderer.dispose(); el.replaceChildren() }
  }, [round])

  const choose = (pick: 'now' | 'later') => {
    if (busy.current || result) return
    busy.current = true
    const f = FORKS[fork]
    const s = st.current
    s.picks.push(pick)
    s.gold += pick === 'now' ? f.nowGold : f.laterGold
    s.time += pick === 'now' ? f.nowTime : f.laterTime
    api.current.walk(pick === 'now' ? -1 : 1, () => {
      // Consequences from earlier forks show up now.
      const lines: string[] = []
      const back = fork - 1
      if (back >= 0) {
        const L = LATER[back], p = s.picks[back]
        const dg = p === 'now' ? L.nowBonus : L.laterBonus, dt = p === 'now' ? L.nowTime : L.laterTime
        if (dg || dt) { s.gold += dg; s.time += dt; lines.push(`Earlier, ${FORKS[back].twist}.`) }
      }
      setGold(s.gold); setTime(s.time)
      setLog((l) => [...l, `${pick === 'now' ? f.now : f.later}`, ...lines])
      if (fork + 1 >= FORKS.length) {
        const L = LATER[fork], p = s.picks[fork]
        s.gold += p === 'now' ? L.nowBonus : L.laterBonus; s.time += p === 'now' ? L.nowTime : L.laterTime
        const score = Math.max(0, s.gold * 5 - s.time * 3 + 60)
        const record = submitRef.current(score)
        setResult({ headline: 'You reached the fountain ⛲', lines: [`Carrying ${s.gold} coins`, `Journey time ${s.time} (lower is better)`, `Chose “later” ${s.picks.filter((x) => x === 'later').length} of ${FORKS.length} times`, `Score ${score}`], record })
      } else { setFork(fork + 1); busy.current = false }
    })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const f = FORKS[Math.min(fork, FORKS.length - 1)]
  return (
    <GameShell title="Decision Maze" score={Math.max(0, gold * 5 - time * 3 + 60)} best={best} result={result} onRestart={restart}
      hint={`Fork ${fork + 1}/${FORKS.length} · ${gold} coins · time ${time} · choices can pay off (or cost you) at the next fork`}>
      <div ref={host} className="fl-host" />
      <div className="dm-gates">
        <button type="button" className="dm-now" onClick={() => choose('now')}>🟠 {f.now}<small>{f.nowGold ? `${f.nowGold > 0 ? '+' : ''}${f.nowGold} coins` : ''}{f.nowTime ? ` · ${f.nowTime > 0 ? '+' : ''}${f.nowTime} time` : ''}</small></button>
        <button type="button" className="dm-later" onClick={() => choose('later')}>🔵 {f.later}<small>{f.laterGold ? `${f.laterGold > 0 ? '+' : ''}${f.laterGold} coins` : ''}{f.laterTime ? ` · ${f.laterTime > 0 ? '+' : ''}${f.laterTime} time` : ''}</small></button>
      </div>
      {log.length > 0 && <p className="ar-hint" style={{ padding: '0 12px 10px' }}>Journey so far: {log.slice(-4).join(' → ')}</p>}
    </GameShell>
  )
}
