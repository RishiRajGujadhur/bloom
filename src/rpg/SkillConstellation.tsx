import { subOn } from '../features/subFeatures'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls, Stars } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Mesh } from 'three'
import gsap from 'gsap'
import type { Rpg } from './schema'
import { constellation, type StarNode } from './constellationModel'
import './constellation.css'
import { Scene3D } from '../components/ui/Scene3D'

const tint = { core: '#ffd166', strength: '#ff8a65', intelligence: '#7ad7ff', spirit: '#c7a6ff' } as const

function Star({ node, active, onPick }: { node: StarNode; active: boolean; onPick: () => void }) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = node.lit ? 1 + Math.sin(clock.getElapsedTime() * 2 + node.position[0]) * 0.08 : 1
    ref.current.scale.setScalar((active ? 1.5 : 1) * pulse)
  })
  return (
    <mesh
      ref={ref}
      position={node.position}
      onClick={(e) => {
        e.stopPropagation()
        onPick()
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <sphereGeometry args={[node.group === 'core' ? 0.42 : 0.3, 24, 24]} />
      <meshStandardMaterial
        color={node.lit ? tint[node.group] : '#4a4660'}
        emissive={node.lit ? tint[node.group] : '#000000'}
        emissiveIntensity={node.lit ? 1.6 : 0}
        roughness={0.3}
      />
    </mesh>
  )
}

/** Flies the camera to frame the selected star (or back to the overview). */
function Flight({ target, controls }: { target: StarNode | null; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  useLayoutEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    const [x, y, z] = target?.position ?? [0, 0, 0]
    const distance = target ? 5 : 16
    const tl = gsap.timeline({ onUpdate: () => orbit.update() })
    tl.to(orbit.target, { x, y, z, duration: 1.2, ease: 'power3.inOut' }, 0).to(
      camera.position,
      { x: x + distance * 0.55, y: y + distance * 0.35, z: z + distance * 0.8, duration: 1.2, ease: 'power3.inOut' },
      0,
    )
    return () => {
      tl.kill()
    }
  }, [target, camera, controls])
  return null
}

/**
 * RPG progress as a 3D constellation: the core skill chain in the middle and
 * a branch per stat with milestone stars. Clicking a star flies the camera
 * there while its details stagger in over the canvas.
 */
export function SkillConstellation({ rpg }: { rpg: Rpg }) {
  const branches = subOn('skillConstellation', 'statBranches')
  const nodes = useMemo(
    () => constellation(rpg).filter((n) => branches || n.group === 'core'),
    [rpg, branches],
  )
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const [selected, setSelected] = useState<StarNode | null>(null)
  const controls = useRef<OrbitControlsImpl | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const lit = nodes.filter((n) => n.lit).length
  useEffect(() => {
    if (!panel.current || !selected) return
    const tween = gsap.from(panel.current.children, {
      y: 14,
      opacity: 0,
      duration: 0.45,
      stagger: 0.07,
      delay: 0.35,
      ease: 'power2.out',
    })
    return () => {
      tween.revert()
    }
  }, [selected])
  return (
    <section className="constellation" aria-label="Skill constellation">
      <div className="constellation-head">
        <strong>Skill constellation</strong>
        <span>
          {lit} of {nodes.length} stars lit
        </span>
      </div>
      <div className="constellation-stage">
        <Scene3D>
        <Canvas camera={{ position: [8.8, 5.6, 12.8], fov: 50 }} dpr={[1, 2]}>
          <color attach="background" args={['#0d0b1a']} />
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 6, 6]} intensity={40} />
          {subOn('skillConstellation', 'starfield') && (
            <Stars radius={60} depth={30} count={1500} factor={3} fade />
          )}
          {nodes.flatMap((node) =>
            node.links.map((link) => {
              const other = byId.get(link)
              if (!other) return null
              return (
                <Line
                  key={`${node.id}-${link}`}
                  points={[node.position, other.position]}
                  color={node.lit && other.lit ? tint[node.group] : '#3a3654'}
                  lineWidth={node.lit && other.lit ? 2 : 1}
                  transparent
                  opacity={0.8}
                />
              )
            }),
          )}
          {nodes.map((node) => (
            <Star key={node.id} node={node} active={selected?.id === node.id} onPick={() => setSelected(node)} />
          ))}
          <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={3} maxDistance={30} />
          <Flight target={selected} controls={controls} />
        </Canvas>
        </Scene3D>
        {selected && (
          <div className="constellation-panel" ref={panel} aria-live="polite">
            <span className="constellation-tag" style={{ color: tint[selected.group] }}>
              {selected.group === 'core' ? 'Core skill' : selected.detail}
            </span>
            <strong>{selected.title}</strong>
            <p>{selected.group === 'core' ? selected.detail : selected.requirement}</p>
            <p className="constellation-state">{selected.lit ? '✦ Lit' : '○ Not yet lit'}</p>
            <button className="ov-secondary" onClick={() => setSelected(null)}>
              Back to the sky
            </button>
          </div>
        )}
      </div>
      <ul className="constellation-list sr-only">
        {nodes.map((n) => (
          <li key={n.id}>
            {n.title}: {n.lit ? 'lit' : 'not yet lit'}. {n.requirement}
          </li>
        ))}
      </ul>
    </section>
  )
}
