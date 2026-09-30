import { useCallback, useEffect, useRef, useState } from 'react'
import { ArcRotateCamera, Color3, Color4, DynamicTexture, Engine, GlowLayer, HemisphericLight, Mesh, MeshBuilder, PointLight, Scene, StandardMaterial, Vector3 } from '@babylonjs/core'
import { GameShell, useBest } from '../shell'

/**
 * Password Forge (Babylon.js): a vault door with six rune slots. Pick rune
 * words from the tray to forge its lock, then let the imps have a go. Imps
 * know every popular word and every trick of swapping letters for symbols —
 * but a string of odd, unrelated words leaves them scratching their heads.
 * Five vaults.
 */
const COMMON = ['password', 'dragon', 'sunshine', 'princess', 'football', 'monkey', 'letmein', 'shadow', 'master', 'qwerty', 'welcome', 'summer']
const RARE = ['walrus', 'teapot', 'glacier', 'banjo', 'pickle', 'lantern', 'meadow', 'trumpet', 'violet', 'marble', 'noodle', 'pebble', 'cactus', 'thimble', 'saddle', 'orbit', 'velvet', 'harbour', 'compass', 'juniper']
const VAULTS = 5
const bitsOf = (words: string[], twist: boolean, digit: boolean) => {
  let bits = 0
  const seen = new Set<string>()
  for (const w of words) {
    if (seen.has(w)) { bits += 1; continue }
    seen.add(w)
    bits += COMMON.includes(w) ? 4 : 11
  }
  if (twist) bits += 1 // swapping a→@ is the first thing imps try
  if (digit) bits += 3
  return bits
}
const crackTime = (bits: number) => Math.pow(2, bits) / 1e8 // seconds at a hundred million guesses a second
const human = (secs: number) => secs < 1 ? 'instantly' : secs < 3600 ? `${Math.round(secs / 60)} minutes` : secs < 86400 * 365 ? `${Math.round(secs / 86400)} days` : secs < 86400 * 365 * 1e4 ? `${Math.round(secs / (86400 * 365))} years` : 'longer than the stars'

export default function PasswordForge() {
  const [best, submit] = useBest('forge-pass')
  const host = useRef<HTMLDivElement>(null)
  const [words, setWords] = useState<string[]>([])
  const [tray, setTray] = useState<string[]>([])
  const [twist, setTwist] = useState(false)
  const [digit, setDigit] = useState(false)
  const [phase, setPhase] = useState<'forge' | 'attack'>('forge')
  const [vault, setVault] = useState(0)
  const [verdict, setVerdict] = useState('')
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ setRunes: (w: string[], strength: number) => void; attack: (holds: boolean) => void }>({ setRunes: () => {}, attack: () => {} })
  const st = useRef({ score: 0, held: 0, lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const deal = () => setTray([...[...COMMON].sort(() => Math.random() - 0.5).slice(0, 5), ...[...RARE].sort(() => Math.random() - 0.5).slice(0, 7)].sort(() => Math.random() - 0.5))
  useEffect(() => { st.current = { score: 0, held: 0, lines: [] }; setScore(0); setVault(0); setWords([]); setTwist(false); setDigit(false); setPhase('forge'); setVerdict(''); deal() }, [round])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const cv = document.createElement('canvas')
    cv.className = 'co-canvas'
    cv.style.height = 'min(52vh, 440px)'
    el.appendChild(cv)
    const engine = new Engine(cv, true)
    engine.resize()
    const scene = new Scene(engine)
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.clearColor = dark ? new Color4(0, 0.05, 0.02, 1) : new Color4(0.1, 0.09, 0.14, 1)
    const cam = new ArcRotateCamera('c', -Math.PI / 2, 1.35, 12, new Vector3(0, 1.4, 0), scene)
    cam.lowerRadiusLimit = 9; cam.upperRadiusLimit = 16
    cam.attachControl(cv, true)
    new HemisphericLight('h', new Vector3(0, 1, 0), scene).intensity = 0.5
    const torch = new PointLight('t', new Vector3(0, 3, -4), scene); torch.diffuse = new Color3(1, 0.7, 0.4); torch.intensity = 0.9
    const glow = new GlowLayer('g', scene); glow.intensity = 0.9
    const mat = (c: Color3, e?: Color3) => { const m = new StandardMaterial('m', scene); m.diffuseColor = c; if (e) m.emissiveColor = e; return m }
    const wall = MeshBuilder.CreateBox('wall', { width: 14, height: 8, depth: 0.5 }, scene); wall.position = new Vector3(0, 2, 0.6); wall.material = mat(new Color3(0.28, 0.26, 0.3))
    const door = MeshBuilder.CreateCylinder('door', { diameter: 5.2, height: 0.4, tessellation: 48 }, scene)
    door.rotation.x = Math.PI / 2; door.position = new Vector3(0, 1.6, 0.2)
    door.material = mat(new Color3(0.45, 0.42, 0.38))
    const ring = MeshBuilder.CreateTorus('ring', { diameter: 5.2, thickness: 0.25, tessellation: 64 }, scene)
    ring.rotation.x = Math.PI / 2; ring.position = new Vector3(0, 1.6, 0)
    const ringM = mat(new Color3(0.6, 0.5, 0.2), new Color3(0.1, 0.08, 0))
    ring.material = ringM
    const floor = MeshBuilder.CreateGround('f', { width: 20, height: 12 }, scene); floor.position.y = -1.2; floor.material = mat(new Color3(0.2, 0.18, 0.2))
    // Six rune slots around the door.
    const slots: { mesh: Mesh; tex: DynamicTexture; mat: StandardMaterial }[] = []
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 2
      const plate = MeshBuilder.CreatePlane(`slot${i}`, { width: 1.5, height: 0.55 }, scene)
      plate.position = new Vector3(Math.cos(a) * 1.7, 1.6 + Math.sin(a) * 1.7, -0.02)
      const tex = new DynamicTexture(`tx${i}`, { width: 256, height: 96 }, scene, false)
      const m = new StandardMaterial(`sm${i}`, scene); m.diffuseTexture = tex; m.emissiveColor = new Color3(0.2, 0.15, 0.05); m.backFaceCulling = false
      plate.material = m
      slots.push({ mesh: plate, tex, mat: m })
    }
    const draw = (i: number, text: string, strong: boolean) => {
      const ctx = slots[i].tex.getContext() as CanvasRenderingContext2D
      ctx.fillStyle = text ? (strong ? '#0f3d2e' : '#3d0f0f') : '#1c1917'; ctx.fillRect(0, 0, 256, 96)
      ctx.fillStyle = text ? (strong ? '#6ee7b7' : '#fca5a5') : '#57534e'; ctx.font = 'bold 40px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(text || '·', 128, 50)
      slots[i].tex.update()
      slots[i].mat.emissiveColor = text ? (strong ? new Color3(0.1, 0.6, 0.35) : new Color3(0.6, 0.15, 0.1)) : new Color3(0.05, 0.05, 0.05)
    }
    for (let i = 0; i < 6; i++) draw(i, '', false)
    // Imps.
    const imps: { m: Mesh; a: number; r: number }[] = []
    const impM = mat(new Color3(0.8, 0.2, 0.3), new Color3(0.5, 0.05, 0.1))
    for (let i = 0; i < 7; i++) {
      const m = MeshBuilder.CreateSphere('imp', { diameter: 0.55 }, scene)
      m.material = impM; m.setEnabled(false)
      const hornL = MeshBuilder.CreateCylinder('h', { diameterTop: 0, diameterBottom: 0.12, height: 0.25 }, scene); hornL.parent = m; hornL.position = new Vector3(-0.15, 0.28, 0)
      const hornR = hornL.clone('h2'); hornR.parent = m; hornR.position = new Vector3(0.15, 0.28, 0)
      imps.push({ m, a: (i / 7) * Math.PI * 2, r: 3.2 })
    }
    let attacking = 0, holds = true, t = 0
    api.current.setRunes = (w, strength) => {
      for (let i = 0; i < 6; i++) draw(i, w[i] ?? '', !COMMON.includes(w[i] ?? ''))
      ringM.emissiveColor = new Color3(0.1 + strength * 0.5, 0.08 + strength * 0.4, strength * 0.1)
    }
    api.current.attack = (h) => { attacking = 5; holds = h; imps.forEach((p) => p.m.setEnabled(true)) }
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000
      t += dt
      door.rotation.y = attacking > 0 && !holds && attacking < 1.5 ? Math.min(1.4, door.rotation.y + dt * 2) : Math.max(0, door.rotation.y - dt * 2)
      if (attacking > 0) {
        attacking -= dt
        imps.forEach((p, i) => {
          p.a += dt * (1.5 + i * 0.1)
          const lunge = Math.max(0, Math.sin(t * 6 + i)) * (holds ? 0.6 : 1.4)
          p.m.position = new Vector3(Math.cos(p.a) * (p.r - lunge), 1.6 + Math.sin(p.a) * (p.r - lunge), -0.6 - Math.abs(Math.sin(t * 5 + i)) * 0.4)
        })
        if (attacking <= 0) imps.forEach((p) => p.m.setEnabled(false))
      }
      cam.alpha = -Math.PI / 2 + Math.sin(t * 0.2) * 0.25
    })
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); scene.dispose(); engine.dispose(); el.replaceChildren() }
  }, [round])

  const bits = bitsOf(words, twist, digit)
  useEffect(() => { api.current.setRunes(words, Math.min(1, bits / 60)) }, [words, bits])
  const add = (w: string) => { if (phase === 'forge' && words.length < 6) setWords([...words, w]) }
  const attack = () => {
    if (phase !== 'forge' || !words.length) return
    const secs = crackTime(bits)
    const holds = secs > 86400 * 365 * 10
    setPhase('attack')
    setVerdict(holds ? `The imps give up. It would take them ${human(secs)}.` : `Cracked ${human(secs)}!`)
    api.current.attack(holds)
    const s = st.current
    const pts = holds ? 40 + Math.max(0, (6 - words.length) * 8) : Math.min(20, Math.round(bits / 3))
    s.score += pts; if (holds) s.held++
    s.lines.push(`Vault ${vault + 1}: ${words.join('-')}${twist ? ' (with symbols)' : ''} — ${holds ? 'held' : 'cracked'}`)
    setScore(s.score)
    setTimeout(() => {
      if (vault + 1 >= VAULTS) {
        const record = submitRef.current(s.score)
        setResult({ headline: `${s.held} of ${VAULTS} vaults held`, lines: [...s.lines.slice(-3), `Score ${s.score}`], record })
      } else { setVault(vault + 1); setWords([]); setTwist(false); setDigit(false); setPhase('forge'); setVerdict(''); deal() }
    }, 5200)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Password Forge" score={score} best={best} result={result} onRestart={restart}
      hint={`Vault ${vault + 1}/${VAULTS} · pick rune words, then unleash the imps · fewer runes that still hold score more · ${verdict || `strength ${bits} bits`}`}>
      <div ref={host} />
      <div className="cf-tray">
        {tray.map((w) => <button key={w} type="button" disabled={phase !== 'forge' || words.length >= 6} onClick={() => add(w)}>{w}</button>)}
      </div>
      <div className="cf-tray">
        <button type="button" className={twist ? 'on' : ''} disabled={phase !== 'forge'} onClick={() => setTwist(!twist)}>a→@ swap</button>
        <button type="button" className={digit ? 'on' : ''} disabled={phase !== 'forge'} onClick={() => setDigit(!digit)}>+ a number</button>
        <button type="button" disabled={phase !== 'forge' || !words.length} onClick={() => setWords(words.slice(0, -1))}>↶ remove rune</button>
        <button type="button" className="cf-match" disabled={phase !== 'forge' || !words.length} onClick={attack}>👹 Let the imps try</button>
      </div>
    </GameShell>
  )
}
