import { useEffect, useRef, useState } from 'react'
import { angle, BONES, demoPose, RULES, UPPER_BONES, type Exercise } from './formModel'
import { prefersReducedMotion } from '../../utils/motion'

/** An illustrative 3D movement guide, not a body-shape or range-of-motion target. */
export function CoachReference({ exercise }: { exercise: Exercise }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [available, setAvailable] = useState(true)
  const [angles, setAngles] = useState({left: 0, right: 0})
  useEffect(() => {
    let cancelled = false, raf = 0, release = () => {}
    setAvailable(true)
    void import('three').then((THREE) => {
      if (cancelled || !canvas.current) return
      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try { renderer = new THREE.WebGLRenderer({ canvas: canvas.current, alpha: true, antialias: true }) } catch { setAvailable(false); return }
      renderer.setSize(240, 200, false); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1.2, .1, 100)
      camera.position.set(1.15, .25, 3.4); camera.lookAt(0, .15, 0)
      const group = new THREE.Group(); scene.add(group)
      scene.add(new THREE.HemisphereLight(0xffffff, 0x1b4f40, 2.8))
      const bones = RULES[exercise].upper ? UPPER_BONES : BONES
      const jointGeometry = new THREE.SphereGeometry(.035, 12, 10), boneGeometry = new THREE.CylinderGeometry(.018, .018, 1, 10)
      const green = new THREE.MeshStandardMaterial({ color: '#5dffc0' }), cyan = new THREE.MeshStandardMaterial({ color: '#7df9ff' })
      const ids = [...new Set([0, ...bones.flat()])]
      const joints = ids.map((i) => { const mesh = new THREE.Mesh(jointGeometry, i % 2 ? green : cyan); group.add(mesh); return { i, mesh } })
      const links = bones.map(([a, b]) => { const mesh = new THREE.Mesh(boneGeometry, a % 2 ? green : cyan); group.add(mesh); return { a, b, mesh } })
      const seatGeometry = new THREE.BoxGeometry(.8, .045, .55), seatMaterial = new THREE.MeshStandardMaterial({ color: '#375d55', transparent: true, opacity: .65 })
      if (RULES[exercise].upper) { const seat = new THREE.Mesh(seatGeometry, seatMaterial); seat.position.set(0, -.8, 0); group.add(seat) }
      const axis = new THREE.Vector3(0, 1, 0)
      let renderedAt = 0
      const loop = (now: number) => {
        if (cancelled) return
        if (now - renderedAt < 50) { raf = requestAnimationFrame(loop); return }
        renderedAt = now
        const pose = demoPose(exercise, prefersReducedMotion() ? .25 : now / 4000 % 1)
        setAngles({ left: Math.round(angle(pose[11], pose[13], pose[15])), right: Math.round(angle(pose[12], pose[14], pose[16])) })
        const positions = pose.map((p) => new THREE.Vector3((p.x - .5) * 2.7, (.58 - p.y) * 2.7, (p.z ?? 0) * 2.7))
        joints.forEach(({ i, mesh }) => { mesh.position.copy(positions[i]) })
        links.forEach(({ a, b, mesh }) => {
          const delta = positions[b].clone().sub(positions[a]); mesh.position.copy(positions[a]).add(positions[b]).multiplyScalar(.5)
          mesh.scale.y = delta.length(); mesh.quaternion.setFromUnitVectors(axis, delta.normalize())
        })
        renderer.render(scene, camera)
        if (!prefersReducedMotion()) raf = requestAnimationFrame(loop)
      }
      release = () => { renderer.dispose(); jointGeometry.dispose(); boneGeometry.dispose(); green.dispose(); cyan.dispose(); seatGeometry.dispose(); seatMaterial.dispose() }
      raf = requestAnimationFrame(loop)
    }).catch(() => { if (!cancelled) setAvailable(false) })
    return () => { cancelled = true; cancelAnimationFrame(raf); release() }
  }, [exercise])
  return <div className="fc-reference"><span>3D movement reference</span>{available ? <canvas ref={canvas} aria-label={`Illustrative ${RULES[exercise].name} movement`} /> : <p>3D preview unavailable. Use the exercise cue and demo.</p>}<dl className="fc-reference-angles"><div><dt>Left elbow</dt><dd>{angles.left}°</dd></div><div><dt>Right elbow</dt><dd>{angles.right}°</dd></div><div><dt>Spine cue</dt><dd>Comfortably upright</dd></div></dl><small>Illustrative motion Â· follow your own comfortable range.</small></div>
}
