import { useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

/** Canvas texture with a big label for one face of the coin. */
function faceTexture(label: string, bg: string, flip = false) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(200, 180, 40, 256, 256, 280)
  grad.addColorStop(0, '#fff6c8')
  grad.addColorStop(1, bg)
  g.fillStyle = grad
  g.fillRect(0, 0, 512, 512)
  g.strokeStyle = '#8a6a10'
  g.lineWidth = 18
  g.beginPath()
  g.arc(256, 256, 226, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = '#5a3f00'
  g.font = '900 60px Manrope, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const words = label.split(' ')
  const lines: string[] = []
  for (const w of words) {
    const last = lines[lines.length - 1]
    if (last && (last + ' ' + w).length < 12) lines[lines.length - 1] = `${last} ${w}`
    else lines.push(w)
  }
  lines.slice(0, 3).forEach((l, i, a) => g.fillText(l, 256, 256 + (i - (a.length - 1) / 2) * 66))
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  // Cylinder caps map the canvas sideways; turn it upright.
  t.center.set(0.5, 0.5)
  // The tails face is seen after a half-turn, so it needs the opposite rotation to read upright.
  t.rotation = flip ? -Math.PI / 2 : Math.PI / 2
  return t
}

function CoinMesh({ heads, tails, flipKey, result, onLand }: { heads: string; tails: string; flipKey: number; result: 'heads' | 'tails'; onLand: () => void }) {
  const group = useRef<THREE.Group>(null)
  const mats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: '#c9a227', metalness: 0.8, roughness: 0.3 })
    const top = new THREE.MeshStandardMaterial({ map: faceTexture(heads, '#e8b923'), metalness: 0.25, roughness: 0.45, emissive: '#3a2a00', emissiveIntensity: 0.25 })
    const bottom = new THREE.MeshStandardMaterial({ map: faceTexture(tails, '#d9a41b', true), metalness: 0.25, roughness: 0.45, emissive: '#3a2a00', emissiveIntensity: 0.25 })
    return [edge, top, bottom]
  }, [heads, tails])
  useEffect(() => {
    const g = group.current
    if (!g || !flipKey) return
    // Spin many half-turns and land showing the chosen face (heads = +y face towards camera).
    const turns = 8 + (result === 'tails' ? 1 : 0)
    const tl = gsap.timeline({ onComplete: onLand })
    g.rotation.set(0.35, 0, 0)
    g.position.y = 0
    tl.to(g.position, { y: 1.6, duration: 0.55, ease: 'power2.out' })
      .to(g.position, { y: 0, duration: 0.6, ease: 'bounce.out' })
      .to(g.rotation, { x: 0.35 + Math.PI * turns, duration: 1.15, ease: 'power2.out' }, 0)
      .to(g.rotation, { z: Math.PI * 0.1, duration: 0.3, yoyo: true, repeat: 1 }, 0.9)
    return () => void tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipKey])
  return (
    <group ref={group} rotation={[0.35, 0, 0]}>
      {/* Cylinder faces point along ±y; tilt the group so a face looks at the camera. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mats}>
        <cylinderGeometry args={[1.2, 1.2, 0.14, 64]} />
      </mesh>
    </group>
  )
}

export function Coin(props: { heads: string; tails: string; flipKey: number; result: 'heads' | 'tails'; onLand: () => void }) {
  return (
    <Canvas className="dc-coin" camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 2, 6]} intensity={2.2} />
      <pointLight position={[-3, -2, 3]} intensity={0.8} color="#ffd88a" />
      <CoinMesh {...props} />
    </Canvas>
  )
}
