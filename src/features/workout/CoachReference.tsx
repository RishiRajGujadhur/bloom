import { useEffect, useRef, useState } from 'react'
import { jointCallouts, BONES, referencePose, RULES, UPPER_BONES, type Exercise, type Lineage } from './formModel'
import { arcadeReferencePose } from './arcadeReference'
import { COMBAT_MODES, type CombatMode } from './cameraCombatModel'
import { prefersReducedMotion } from '../../utils/motion'

/** An illustrative 3D movement guide, not a body-shape or range-of-motion target. */
export function CoachReference({ exercise, anglesVisible = true, lineage = 'Yang', paused = false, battery = false, activity }: { activity?: CombatMode; exercise: Exercise; anglesVisible?: boolean; lineage?: Lineage; paused?: boolean; battery?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [available, setAvailable] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [angles, setAngles] = useState(() => jointCallouts(referencePose(exercise, 0, lineage)))
  useEffect(() => {
    let cancelled = false, raf = 0, release = () => {}
    setAvailable(true)
    void import('three').then((THREE) => {
      if (cancelled || !canvas.current) return
      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try { renderer = new THREE.WebGLRenderer({ canvas: canvas.current, alpha: true, antialias: true }) } catch { setAvailable(false); return }
      renderer.setSize(240, 200, false); renderer.setPixelRatio(battery ? 1 : Math.min(2, window.devicePixelRatio))
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1.2, .1, 100)
      camera.position.set(1.15, .25, 3.4); camera.lookAt(0, .15, 0)
      const group = new THREE.Group(); scene.add(group)
      scene.add(new THREE.HemisphereLight(0xffffff, 0x1b4f40, 2.8))
      const bones = RULES[exercise].upper ? [...UPPER_BONES, [0, 33], [33, 34]] : BONES
      const jointGeometry = new THREE.SphereGeometry(.035, 12, 10), boneGeometry = new THREE.CylinderGeometry(.018, .018, 1, 10)
      const green = new THREE.MeshStandardMaterial({ color: '#5dffc0' }), cyan = new THREE.MeshStandardMaterial({ color: '#7df9ff' })
      const skin = new THREE.MeshStandardMaterial({ color: '#dca477', roughness: .78 }), shirt = new THREE.MeshStandardMaterial({ color: '#58a993', roughness: .85 }), trousers = new THREE.MeshStandardMaterial({ color: '#33445c', roughness: .9 })
      const bodyGeometry = new THREE.SphereGeometry(1, 24, 16), limbGeometry = new THREE.CylinderGeometry(.065, .055, 1, 16)
      const head = new THREE.Mesh(bodyGeometry, skin), torso = new THREE.Mesh(bodyGeometry, shirt)
      head.scale.set(.13, .16, .12); group.add(head, torso)
      const limbs = [[11,13],[13,15],[12,14],[14,16], ...(!RULES[exercise].upper ? [[23,25],[25,27],[24,26],[26,28]] : [])].map(([a,b]) => { const mesh = new THREE.Mesh(limbGeometry, a < 23 ? skin : trousers); group.add(mesh); return { a,b,mesh } })
      const hands = [15,16].map(i => { const mesh = new THREE.Mesh(bodyGeometry, skin); mesh.scale.set(.05,.08,.04); group.add(mesh); return {i,mesh} })
      const ids = [...new Set([0, ...bones.flat()])]
      const joints = ids.map((i) => { const mesh = new THREE.Mesh(jointGeometry, i % 2 ? green : cyan); group.add(mesh); return { i, mesh } })
      const links = bones.map(([a, b]) => { const mesh = new THREE.Mesh(boneGeometry, a % 2 ? green : cyan); group.add(mesh); return { a, b, mesh } })
      const seatGeometry = new THREE.BoxGeometry(.8, .045, .55), seatMaterial = new THREE.MeshStandardMaterial({ color: '#375d55', transparent: true, opacity: .65 })
      if (RULES[exercise].upper) { const seat = new THREE.Mesh(seatGeometry, seatMaterial); seat.position.set(0, -.8, 0); group.add(seat) }
      const axis = new THREE.Vector3(0, 1, 0)
      let renderedAt = 0, phaseTime = 0
      const loop = (now: number) => {
        if (cancelled) return
        if (document.hidden) { renderedAt = now; raf = requestAnimationFrame(loop); return }
        if (now - renderedAt < (battery ? 125 : 50)) { raf = requestAnimationFrame(loop); return }
        if (!paused && renderedAt) phaseTime += now - renderedAt
        renderedAt = now
        const phase = prefersReducedMotion() ? .25 : phaseTime / 4000 % 1
        const pose = activity ? arcadeReferencePose(activity, phase, lineage) : referencePose(exercise, phase, lineage)
        setAngles(jointCallouts(pose))
        if (RULES[exercise].upper) { pose.push({ x: (pose[11].x + pose[12].x) / 2, y: (pose[11].y + pose[12].y) / 2, z: 0 }, { x: .5, y: .69, z: 0 }) }
        const positions = pose.map((p) => new THREE.Vector3((p.x - .5) * 2.7, (.58 - p.y) * 2.7, (p.z ?? 0) * 2.7))
        joints.forEach(({ i, mesh }) => { mesh.position.copy(positions[i]); mesh.visible = wireframe })
        links.forEach(({ mesh }) => { mesh.visible = wireframe })
        head.visible = torso.visible = !wireframe
        head.position.copy(positions[0]); head.position.y += .07
        const shoulders = positions[11].clone().add(positions[12]).multiplyScalar(.5), hips = RULES[exercise].upper ? positions[34] : positions[23].clone().add(positions[24]).multiplyScalar(.5)
        const trunk = shoulders.clone().sub(hips); torso.position.copy(shoulders).add(hips).multiplyScalar(.5); torso.scale.set(.23, trunk.length() * .62, .13); torso.quaternion.setFromUnitVectors(axis, trunk.normalize())
        limbs.forEach(({a,b,mesh}) => { const delta = positions[b].clone().sub(positions[a]); mesh.visible = !wireframe; mesh.position.copy(positions[a]).add(positions[b]).multiplyScalar(.5); mesh.scale.y = delta.length(); mesh.quaternion.setFromUnitVectors(axis, delta.normalize()) })
        hands.forEach(({i,mesh}) => { mesh.visible = !wireframe; mesh.position.copy(positions[i]) })
        links.forEach(({ a, b, mesh }) => {
          const delta = positions[b].clone().sub(positions[a]); mesh.position.copy(positions[a]).add(positions[b]).multiplyScalar(.5)
          mesh.scale.y = delta.length(); mesh.quaternion.setFromUnitVectors(axis, delta.normalize())
        })
        renderer.render(scene, camera)
        if (!prefersReducedMotion()) raf = requestAnimationFrame(loop)
      }
      release = () => { renderer.dispose(); bodyGeometry.dispose(); limbGeometry.dispose(); skin.dispose(); shirt.dispose(); trousers.dispose(); jointGeometry.dispose(); boneGeometry.dispose(); green.dispose(); cyan.dispose(); seatGeometry.dispose(); seatMaterial.dispose() }
      raf = requestAnimationFrame(loop)
    }).catch(() => { if (!cancelled) setAvailable(false) })
    return () => { cancelled = true; cancelAnimationFrame(raf); release() }
  }, [exercise, lineage, paused, battery, activity, wireframe])
  return <div className="fc-reference"><label className="fc-reference-style">Reference style <select aria-label="Reference style" value={wireframe ? "skeleton" : "person"} onChange={event => setWireframe(event.target.value === "skeleton")}><option value="person">3D person</option><option value="skeleton">Skeletal guide</option></select></label><span>{activity ? COMBAT_MODES.find(mode => mode.id === activity)?.name : "3D movement reference"}</span>{available ? <canvas ref={canvas} aria-label={`Illustrative ${RULES[exercise].name} movement`} /> : <p>3D preview unavailable. Use the exercise cue and demo.</p>}{anglesVisible && <dl className="fc-reference-angles"><div><dt>Left elbow</dt><dd>{angles.left}°</dd></div><div><dt>Right elbow</dt><dd>{angles.right}°</dd></div><div><dt>Wrist L / R</dt><dd>{angles.leftWrist ?? '—'}° / {angles.rightWrist ?? '—'}°</dd></div>{!RULES[exercise].upper && <div><dt>Knee L / R</dt><dd>{angles.leftKnee ?? '—'}° / {angles.rightKnee ?? '—'}°</dd></div>}<div><dt>Spine cue</dt><dd>Comfortably upright</dd></div></dl>}<small>{activity && <>{COMBAT_MODES.find(mode => mode.id === activity)?.cue} · </>}{exercise === 'taiChi' ? `${lineage}-inspired illustrative flow` : 'Illustrative motion'} · follow your own comfortable range.</small></div>
}
