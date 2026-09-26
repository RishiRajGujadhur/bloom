import { subOn } from '../subFeatures'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Group, Mesh, PointLight } from 'three'
import gsap from 'gsap'
import type { DistrictId, WorldState } from './worldModel'

type Vec3 = [number, number, number]

/** Where each district sits on the island, and where the camera looks from. */
export const districtAnchors: Record<DistrictId, Vec3> = {
  home: [0, 0, 0.5],
  garden: [-4.2, 0, 3.8],
  library: [4.4, 0, 3.6],
  town: [4, 0, -3.8],
  monument: [-4.6, 0, -4.2],
  trophies: [-0.2, 0, -5.2],
}

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'
export const timeOfDay = (hour = new Date().getHours()): TimeOfDay =>
  hour < 5 || hour >= 21
    ? 'night'
    : hour < 8
      ? 'dawn'
      : hour < 18
        ? 'day'
        : 'dusk'

const lighting: Record<
  TimeOfDay,
  { sun: string; sunIntensity: number; ambient: number; hemi: [string, string] }
> = {
  dawn: { sun: '#ffc9a3', sunIntensity: 1.6, ambient: 0.5, hemi: ['#ffd9c2', '#6b5a7a'] },
  day: { sun: '#fff4dd', sunIntensity: 2.3, ambient: 0.6, hemi: ['#dff1ff', '#7a6a4f'] },
  dusk: { sun: '#ff9d6b', sunIntensity: 1.4, ambient: 0.45, hemi: ['#ffb38a', '#4b3b5c'] },
  night: { sun: '#b8c6ff', sunIntensity: 1.1, ambient: 0.55, hemi: ['#8a9ae0', '#3a2f55'] },
}

/** Deterministic jitter so the island looks the same on every visit. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function Box({
  p,
  s,
  c,
  emissive,
  rot,
}: {
  p: Vec3
  s: Vec3
  c: string
  emissive?: number
  rot?: Vec3
}) {
  return (
    <mesh
      position={[p[0], p[1] + s[1] / 2, p[2]]}
      rotation={rot}
      castShadow
      receiveShadow
    >
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        flatShading
        emissive={emissive ? c : '#000000'}
        emissiveIntensity={emissive ?? 0}
      />
    </mesh>
  )
}

/** Pyramid roof: a 4-sided cone turned to sit square on a box. */
function Roof({ p, w, d, h, c }: { p: Vec3; w: number; d: number; h: number; c: string }) {
  return (
    <mesh
      position={[p[0], p[1] + h / 2, p[2]]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[w / Math.SQRT2, 1, d / Math.SQRT2]}
      castShadow
    >
      <coneGeometry args={[1, h, 4]} />
      <meshStandardMaterial color={c} flatShading />
    </mesh>
  )
}

/** Pops its children into the world with a springy GSAP scale. */
function Grow({
  children,
  delay = 0,
  position,
  reduced,
}: {
  children: ReactNode
  delay?: number
  position?: Vec3
  reduced: boolean
}) {
  const ref = useRef<Group>(null)
  useLayoutEffect(() => {
    const group = ref.current
    if (!group || reduced) return
    const tween = gsap.fromTo(
      group.scale,
      { x: 0.001, y: 0.001, z: 0.001 },
      { x: 1, y: 1, z: 1, duration: 0.9, delay, ease: 'back.out(2.2)' },
    )
    return () => {
      tween.kill()
    }
  }, [delay, reduced])
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

function Island() {
  const drips = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const side = i % 4
        const t = -6.6 + rand(i) * 13.2
        const len = 0.3 + rand(i + 99) * 0.9
        const x = side === 0 ? t : side === 1 ? 6.95 : side === 2 ? t : -6.95
        const z = side === 0 ? 6.95 : side === 1 ? t : side === 2 ? -6.95 : t
        return { x, z, len }
      }),
    [],
  )
  return (
    <group>
      <Box p={[0, -0.5, 0]} s={[14, 0.5, 14]} c="#7cc444" />
      <Box p={[0, -1.9, 0]} s={[13.8, 1.4, 13.8]} c="#c9a97a" />
      <Box p={[0, -3.1, 0]} s={[13.4, 1.2, 13.4]} c="#b08d62" />
      <Box p={[0, -4.1, 0]} s={[12.4, 1, 12.4]} c="#8f6f4c" />
      <Box p={[0, -4.8, 0]} s={[10, 0.7, 10]} c="#6f5238" />
      {drips.map((d, i) => (
        <Box key={i} p={[d.x, -0.5 - d.len, d.z]} s={[0.35, d.len, 0.35]} c="#6fb83b" />
      ))}
      {/* Starter scenery, so even a brand-new island feels alive. */}
      {[
        [-6.2, -6.2],
        [6.2, 6.2],
        [-6.3, 1.2],
        [6.3, -1.6],
        [1.8, -6.4],
        [-2.6, 6.3],
      ].map(([x, z], i) => (
        <group key={`b${i}`} position={[x, 0, z]}>
          <Box p={[0, 0, 0]} s={[0.7, 0.45, 0.7]} c={i % 2 ? '#4f9e3a' : '#5fb24a'} />
          <Box p={[0.1, 0.4, -0.05]} s={[0.4, 0.25, 0.4]} c="#6cc257" />
        </group>
      ))}
      {[
        [2.4, 5.8],
        [-6, -2.6],
        [5.6, 1.9],
      ].map(([x, z], i) => (
        <Box key={`r${i}`} p={[x, 0, z]} s={[0.45, 0.28, 0.35]} c="#a9a49a" />
      ))}
      {/* Sandy path from the front edge to the front door. */}
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={i}
          p={[0.15 * Math.sin(i), 0, 6.4 - i * 0.95]}
          s={[1, 0.04, 0.8]}
          c="#e8d3a2"
        />
      ))}
    </group>
  )
}

function Home({ tier, reduced }: { tier: number; reduced: boolean }) {
  const [x, , z] = districtAnchors.home
  const wall = '#f4e6cf'
  return (
    <Grow key={tier} position={[x, 0, z]} reduced={reduced}>
      {tier === 0 ? (
        <>
          <Box p={[0, 0, 0]} s={[1.4, 0.9, 1.4]} c={wall} />
          <Roof p={[0, 0.9, 0]} w={1.8} d={1.8} h={0.9} c="#d9574a" />
          <Box p={[0, 0, 0.71]} s={[0.35, 0.55, 0.02]} c="#7a4b2a" />
        </>
      ) : (
        <>
          <Box p={[0, 0, 0]} s={[2.2, 1.3, 1.8]} c={wall} />
          <Roof p={[0, 1.3, 0]} w={2.8} d={2.4} h={1.1} c="#d9574a" />
          <Box p={[0, 0, 0.91]} s={[0.45, 0.8, 0.02]} c="#7a4b2a" />
          {[-0.7, 0.7].map((wx) => (
            <Box key={wx} p={[wx, 0.55, 0.91]} s={[0.4, 0.4, 0.02]} c="#9fd6ff" emissive={0.25} />
          ))}
          <Box p={[0.7, 1.5, -0.3]} s={[0.3, 0.9, 0.3]} c="#9b6b52" />
        </>
      )}
      {tier >= 2 && (
        <>
          <Box p={[1.7, 0, -0.1]} s={[1.2, 0.9, 1.4]} c="#efdcbc" />
          <Roof p={[1.7, 0.9, -0.1]} w={1.6} d={1.8} h={0.6} c="#c44a3f" />
          {Array.from({ length: 7 }, (_, i) => (
            <Box key={i} p={[-1.8 + i * 0.6, 0, 1.7]} s={[0.12, 0.45, 0.12]} c="#a0703f" />
          ))}
          <Box p={[0, 0.3, 1.7]} s={[3.8, 0.08, 0.06]} c="#a0703f" />
        </>
      )}
      {tier >= 3 && (
        <>
          <Box p={[-0.3, 1.3, 0]} s={[1.4, 0.9, 1.4]} c={wall} />
          <Roof p={[-0.3, 2.2, 0]} w={1.9} d={1.9} h={0.9} c="#b83f36" />
          <Box p={[-0.3, 1.6, 0.71]} s={[0.35, 0.35, 0.02]} c="#9fd6ff" emissive={0.3} />
        </>
      )}
      {tier >= 4 && (
        <>
          <Box p={[-1.6, 0, -0.6]} s={[0.8, 2.8, 0.8]} c="#e3d2b4" />
          <Roof p={[-1.6, 2.8, -0.6]} w={1.1} d={1.1} h={1} c="#6a5acd" />
          <Box p={[-1.6, 3.8, -0.6]} s={[0.04, 0.7, 0.04]} c="#555" />
          <Box p={[-1.4, 4.2, -0.6]} s={[0.4, 0.25, 0.02]} c="#ff5a7a" />
        </>
      )}
    </Grow>
  )
}

const leafGreens = ['#3f9a3a', '#4fb248', '#2f8a4a', '#62c255', '#3a8f5c']

function Garden({
  trees,
  flowers,
  reduced,
}: {
  trees: number
  flowers: number
  reduced: boolean
}) {
  const [gx, , gz] = districtAnchors.garden
  const flowerColors = ['#ff7eb6', '#ffd23f', '#9b8cff', '#ff8a5b', '#ffffff', '#7ad7ff']
  return (
    <group position={[gx, 0, gz]}>
      {/* Tilled soil beds */}
      {[-1.2, 0, 1.2].map((bz) => (
        <Box key={bz} p={[0, 0, bz - 0.05]} s={[4.3, 0.08, 0.7]} c="#8a5a36" />
      ))}
      {Array.from({ length: trees }, (_, i) => {
        const col = i % 6
        const row = Math.floor(i / 6)
        const x = -1.8 + col * 0.72 + (rand(i) - 0.5) * 0.2
        const z = -1.2 + row * 1.15 + (rand(i + 7) - 0.5) * 0.2
        const h = 0.7 + rand(i + 3) * 0.5
        const leaf = leafGreens[i % leafGreens.length]
        return (
          <Grow key={i} position={[x, 0, z]} delay={i * 0.05} reduced={reduced}>
            <Box p={[0, 0, 0]} s={[0.16, h * 0.55, 0.16]} c="#7a4b2a" />
            <Box p={[0, h * 0.45, 0]} s={[0.55, 0.45, 0.55]} c={leaf} />
            <Box p={[0, h * 0.45 + 0.4, 0]} s={[0.36, 0.3, 0.36]} c={leaf} />
          </Grow>
        )
      })}
      {Array.from({ length: flowers }, (_, i) => {
        // Flowers spill outside the beds into the lawn around the garden.
        const angle = rand(i + 50) * Math.PI * 2
        const radius = 2.1 + rand(i + 80) * 1.1
        return (
          <Grow
            key={`f${i}`}
            position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.8]}
            delay={0.4 + i * 0.02}
            reduced={reduced}
          >
            <Box p={[0, 0, 0]} s={[0.04, 0.18, 0.04]} c="#3f8a2e" />
            <Box p={[0, 0.18, 0]} s={[0.14, 0.1, 0.14]} c={flowerColors[i % flowerColors.length]} />
          </Grow>
        )
      })}
    </group>
  )
}

const bookColors = ['#c0392b', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#e67e22', '#34495e']

function Library({ books, reduced }: { books: number; reduced: boolean }) {
  const [x, , z] = districtAnchors.library
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 4, 0]}>
      <Box p={[0, 0, 0]} s={[2.6, 0.12, 2]} c="#b98b5a" />
      <Box p={[0, 0.12, -0.95]} s={[2.6, 1.8, 0.1]} c="#e9dcc6" />
      <Box p={[-1.25, 0.12, 0]} s={[0.1, 1.8, 2]} c="#e9dcc6" />
      <Box p={[1.25, 0.12, 0]} s={[0.1, 1.8, 2]} c="#e9dcc6" />
      <Roof p={[0, 1.92, 0]} w={3.2} d={2.6} h={0.9} c="#3d6fb6" />
      {/* Two bookcases, three shelves each, eight books per shelf. */}
      {[-0.6, 0.6].map((sx, caseIndex) => (
        <group key={sx} position={[sx, 0.12, -0.72]}>
          <Box p={[0, 0, 0]} s={[1.05, 1.55, 0.35]} c="#8b5a2b" />
          {[0.35, 0.8, 1.25].map((sy) => (
            <Box key={sy} p={[0, sy - 0.04, 0.1]} s={[0.95, 0.04, 0.3]} c="#6d4420" />
          ))}
          {Array.from({ length: 24 }, (_, i) => {
            const n = caseIndex * 24 + i
            if (n >= books) return null
            const shelf = Math.floor(i / 8)
            const slot = i % 8
            const h = 0.26 + rand(n) * 0.1
            return (
              <Grow
                key={i}
                position={[-0.4 + slot * 0.115, 0.35 + shelf * 0.45, 0.1]}
                delay={n * 0.03}
                reduced={reduced}
              >
                <Box p={[0, 0, 0]} s={[0.09, h, 0.24]} c={bookColors[n % bookColors.length]} />
              </Grow>
            )
          })}
        </group>
      ))}
      {/* Reading nook */}
      <Box p={[0.3, 0.12, 0.3]} s={[0.7, 0.35, 0.45]} c="#c46b4a" />
      <Box p={[-0.5, 0.12, 0.4]} s={[0.4, 0.45, 0.4]} c="#a0703f" />
    </group>
  )
}

const townRoofs = ['#e0664f', '#4f8fe0', '#e0b24f', '#7a5ae0', '#4fc49a', '#e04f8f']

function Town({ buildings, reduced }: { buildings: number; reduced: boolean }) {
  const [x, , z] = districtAnchors.town
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0, 0]} s={[4.2, 0.05, 4.2]} c="#cfc6b8" />
      {buildings === 0 && (
        // An empty plot with a sign, so the district reads as "waiting to grow".
        <>
          <Box p={[0, 0, 0]} s={[0.08, 0.6, 0.08]} c="#8b5a2b" />
          <Box p={[0, 0.5, 0.05]} s={[0.6, 0.35, 0.05]} c="#e8d3a2" />
        </>
      )}
      {Array.from({ length: buildings }, (_, i) => {
        const bx = -1.35 + (i % 3) * 1.35
        const bz = -1.35 + Math.floor(i / 3) * 1.35
        const h = 0.7 + rand(i + 11) * 1.2
        const w = 0.8 + rand(i + 21) * 0.25
        return (
          <Grow key={i} position={[bx, 0, bz]} delay={i * 0.08} reduced={reduced}>
            <Box p={[0, 0, 0]} s={[w, h, w]} c={i % 2 ? '#f2e8da' : '#e9ddcb'} />
            <Roof p={[0, h, 0]} w={w + 0.25} d={w + 0.25} h={0.5} c={townRoofs[i % townRoofs.length]} />
            <Box p={[0, h * 0.5, w / 2 + 0.01]} s={[0.22, 0.22, 0.02]} c="#ffe8a3" emissive={0.5} />
            <Box p={[0, 0, w / 2 + 0.01]} s={[0.22, 0.34, 0.02]} c="#6b4226" />
          </Grow>
        )
      })}
    </group>
  )
}

function Flame({ reduced }: { reduced: boolean }) {
  const mesh = useRef<Mesh>(null)
  const light = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    if (reduced) return
    const t = clock.getElapsedTime()
    const flicker = 1 + Math.sin(t * 11) * 0.08 + Math.sin(t * 17.3) * 0.05
    mesh.current?.scale.set(flicker, flicker * 1.15, flicker)
    if (mesh.current) mesh.current.rotation.y = t * 1.5
    if (light.current) light.current.intensity = 6 * flicker
  })
  return (
    <group>
      <mesh ref={mesh}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#ff8a1f" emissive="#ff6a00" emissiveIntensity={2.5} flatShading />
      </mesh>
      <pointLight ref={light} color="#ffa040" intensity={6} distance={5} />
    </group>
  )
}

function Monument({
  blocks,
  flame,
  reduced,
}: {
  blocks: number
  flame: boolean
  reduced: boolean
}) {
  const [x, , z] = districtAnchors.monument
  let y = 0.4
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0, 0]} s={[1.6, 0.2, 1.6]} c="#b8b2a7" />
      <Box p={[0, 0.2, 0]} s={[1.2, 0.2, 1.2]} c="#cfc9bd" />
      {Array.from({ length: blocks }, (_, i) => {
        const size = 0.8 - i * 0.035
        const h = 0.28
        const at = y
        y += h
        return (
          <Grow key={i} position={[0, at, 0]} delay={i * 0.06} reduced={reduced}>
            <Box p={[0, 0, 0]} s={[size, h, size]} c={i % 2 ? '#d9d2c3' : '#e8e1d2'} />
          </Grow>
        )
      })}
      <group position={[0, y + 0.3, 0]}>
        {flame ? (
          <Flame reduced={reduced} />
        ) : (
          <Box p={[0, -0.3, 0]} s={[0.35, 0.12, 0.35]} c="#4a4a4a" />
        )}
      </group>
    </group>
  )
}

function Trophy({ c }: { c: string }) {
  return (
    <group>
      <Box p={[0, 0, 0]} s={[0.34, 0.4, 0.34]} c="#f2efe8" />
      <Box p={[0, 0.4, 0]} s={[0.18, 0.06, 0.18]} c={c} emissive={0.25} />
      <Box p={[0, 0.46, 0]} s={[0.05, 0.12, 0.05]} c={c} emissive={0.25} />
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.08, 0.24, 8]} />
        <meshStandardMaterial color={c} metalness={0.7} roughness={0.25} emissive={c} emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

function TrophyHall({ trophies, reduced }: { trophies: number; reduced: boolean }) {
  const [x, , z] = districtAnchors.trophies
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0, 0]} s={[3.4, 0.2, 1.8]} c="#e8e1d2" />
      {[-1.5, -0.5, 0.5, 1.5].map((cx) =>
        [-0.75, 0.75].map((cz) => (
          <Box key={`${cx}${cz}`} p={[cx, 0.2, cz]} s={[0.16, 1.5, 0.16]} c="#f6f1e6" />
        )),
      )}
      <Box p={[0, 1.7, 0]} s={[3.6, 0.18, 2]} c="#e0d6c2" />
      <Roof p={[0, 1.88, 0]} w={3.8} d={2.2} h={0.5} c="#c9a227" />
      {Array.from({ length: trophies }, (_, i) => (
        <Grow
          key={i}
          position={[-1.2 + (i % 4) * 0.8, 0.2, -0.35 + Math.floor(i / 4) * 0.7]}
          delay={i * 0.1}
          reduced={reduced}
        >
          <Trophy c={i % 3 === 2 ? '#c0c0c0' : i % 3 === 1 ? '#cd7f32' : '#ffcf40'} />
        </Grow>
      ))}
    </group>
  )
}

function Windmill({ reduced }: { reduced: boolean }) {
  const blades = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!reduced && blades.current) blades.current.rotation.z += delta * 1.2
  })
  return (
    <group position={[6, 0, 0.6]}>
      <Box p={[0, 0, 0]} s={[0.7, 1.9, 0.7]} c="#efe4d0" />
      <Roof p={[0, 1.9, 0]} w={0.95} d={0.95} h={0.5} c="#8b5a2b" />
      <group ref={blades} position={[0, 1.7, 0.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.14, 1.5, 0.03]} />
            <meshStandardMaterial color="#f7f3ea" flatShading />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Balloon({ reduced }: { reduced: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (reduced || !ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.y = 6.5 + Math.sin(t * 0.7) * 0.35
    ref.current.position.x = -2 + Math.sin(t * 0.15) * 1.5
  })
  return (
    <group ref={ref} position={[-2, 6.5, 1]}>
      <mesh castShadow>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshStandardMaterial color="#ff6b6b" flatShading />
      </mesh>
      <Box p={[0, -1.25, 0]} s={[0.4, 0.3, 0.4]} c="#8b5a2b" />
    </group>
  )
}

function Clouds({ reduced }: { reduced: boolean }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.children.forEach((cloud, i) => {
      cloud.position.x += delta * (0.25 + i * 0.05)
      if (cloud.position.x > 11) cloud.position.x = -11
    })
  })
  const clouds: Vec3[] = [
    [-7, 5.5, -5],
    [3, 7, -7],
    [8, 5, 3],
  ]
  return (
    <group ref={ref}>
      {clouds.map((p, i) => (
        <group key={i} position={p}>
          <Box p={[0, 0, 0]} s={[1.6, 0.5, 0.9]} c="#ffffff" />
          <Box p={[0.3, 0.35, 0]} s={[0.8, 0.45, 0.7]} c="#ffffff" />
          <Box p={[-0.5, 0.2, 0.1]} s={[0.6, 0.35, 0.6]} c="#f4f7ff" />
        </group>
      ))}
    </group>
  )
}

function Decorations({
  world,
  reduced,
  night,
}: {
  world: WorldState
  reduced: boolean
  night: boolean
}) {
  const has = (id: string) => world.decorations.find((d) => d.id === id)?.unlocked
  return (
    <>
      {has('lanterns') &&
        [
          [-0.9, 5.4],
          [1.1, 4.2],
          [-0.9, 3],
          [1.1, 1.9],
        ].map(([lx, lz], i) => (
          <Grow key={i} position={[lx, 0, lz]} delay={0.2 + i * 0.1} reduced={reduced}>
            <Box p={[0, 0, 0]} s={[0.07, 0.8, 0.07]} c="#3b3b3b" />
            <Box p={[0, 0.8, 0]} s={[0.2, 0.22, 0.2]} c="#ffd27a" emissive={night ? 2 : 0.6} />
            {night && <pointLight position={[0, 0.9, 0]} color="#ffcf7a" intensity={3} distance={3} />}
          </Grow>
        ))}
      {has('pond') && (
        <Grow position={[-5.3, 0, -0.4]} reduced={reduced}>
          <Box p={[0, 0, 0]} s={[2.2, 0.03, 1.6]} c="#9a8f80" />
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.8, 12]} />
            <meshStandardMaterial color="#4fb3e8" metalness={0.3} roughness={0.1} />
          </mesh>
          <Box p={[0.3, 0.05, 0.2]} s={[0.25, 0.02, 0.25]} c="#4caf50" />
          <Box p={[0.3, 0.07, 0.2]} s={[0.08, 0.06, 0.08]} c="#ffb3d1" />
        </Grow>
      )}
      {has('windmill') && (
        <Grow reduced={reduced}>
          <Windmill reduced={reduced} />
        </Grow>
      )}
      {has('fountain') && (
        <Grow position={[2.2, 0, 2.2]} reduced={reduced}>
          <Box p={[0, 0, 0]} s={[1, 0.25, 1]} c="#cfc9bd" />
          <Box p={[0, 0.25, 0]} s={[0.8, 0.02, 0.8]} c="#6fc8f0" />
          <Box p={[0, 0.25, 0]} s={[0.15, 0.55, 0.15]} c="#cfc9bd" />
          <Box p={[0, 0.8, 0]} s={[0.12, 0.2, 0.12]} c="#9fe0ff" emissive={0.4} />
        </Grow>
      )}
      {has('balloon') && <Balloon reduced={reduced} />}
      {has('rainbow') &&
        ['#ff6b6b', '#ffb36b', '#ffe66b', '#6bdc8b', '#6bb8ff', '#9b8cff'].map((c, i) => (
          <mesh key={c} position={[0, 0, -9]} rotation={[0, 0, 0]}>
            <torusGeometry args={[9 - i * 0.35, 0.17, 6, 40, Math.PI]} />
            <meshStandardMaterial color={c} transparent opacity={0.55} emissive={c} emissiveIntensity={0.3} />
          </mesh>
        ))}
    </>
  )
}

function SelectionRing({ id, reduced }: { id: DistrictId | null; reduced: boolean }) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return
    const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.06
    ref.current.scale.set(s, s, s)
  })
  if (!id) return null
  const [x, , z] = districtAnchors[id]
  return (
    <mesh ref={ref} position={[x, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.3, 2.5, 48]} />
      <meshBasicMaterial color="#fff6a8" transparent opacity={0.85} />
    </mesh>
  )
}

/** Flies OrbitControls to the selected district with GSAP. */
function CameraRig({
  focus,
  controls,
  reduced,
}: {
  focus: DistrictId | null
  controls: RefObject<OrbitControlsImpl | null>
  reduced: boolean
}) {
  const { camera } = useThree()
  useLayoutEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    const target: Vec3 = focus ? districtAnchors[focus] : [0, 0, 0]
    const distance = focus ? 12 : 30
    const position: Vec3 = [
      target[0] + distance * 0.62,
      target[1] + distance * 0.58,
      target[2] + distance * 0.62,
    ]
    if (reduced) {
      orbit.target.set(...target)
      camera.position.set(...position)
      orbit.update()
      return
    }
    const timeline = gsap.timeline({ onUpdate: () => orbit.update() })
    timeline
      .to(orbit.target, { x: target[0], y: target[1], z: target[2], duration: 1.2, ease: 'power3.inOut' }, 0)
      .to(camera.position, { x: position[0], y: position[1], z: position[2], duration: 1.2, ease: 'power3.inOut' }, 0)
    return () => {
      timeline.kill()
    }
  }, [focus, camera, controls, reduced])
  return null
}

/* ------------------------------------------------------------------ */
/* Petal-shop decorations and the avatar                               */
/* ------------------------------------------------------------------ */
export type WorldShop = {
  owned: string[]
  equipped: { hat: string | null; outfit: string | null; pet: string | null }
  outfitColor?: string
}

function ShopDecor({ owned, reduced, night }: { owned: string[]; reduced: boolean; night: boolean }) {
  const has = (id: string) => owned.includes(id)
  return (
    <>
      {has('cherry-tree') && (
        <Grow position={[-2.7, 0, -2.1]} reduced={reduced}>
          <Box p={[0, 0, 0]} s={[0.24, 1.1, 0.24]} c="#6b4226" />
          <Box p={[0, 1, 0]} s={[1.1, 0.7, 1.1]} c="#f7b3cf" />
          <Box p={[0.2, 1.55, -0.1]} s={[0.7, 0.45, 0.7]} c="#f9c7dc" />
          <Box p={[-0.4, 0.9, 0.3]} s={[0.4, 0.35, 0.4]} c="#f29cc0" />
        </Grow>
      )}
      {has('lamp-posts') &&
        ([
          [2.8, -0.9],
          [-1.6, -3.0],
        ] as const).map(([x, z], i) => (
          <Grow key={i} position={[x, 0, z]} reduced={reduced} delay={i * 0.1}>
            <Box p={[0, 0, 0]} s={[0.1, 1.3, 0.1]} c="#2f2f36" />
            <Box p={[0, 1.3, 0]} s={[0.3, 0.3, 0.3]} c="#ffe19a" emissive={night ? 2 : 0.5} />
            {night && <pointLight position={[0, 1.4, 0]} color="#ffd98a" intensity={3} distance={3.5} />}
          </Grow>
        ))}
      {has('bench') && (
        <Grow position={[1.9, 0, -2.3]} reduced={reduced}>
          <Box p={[0, 0.3, 0]} s={[1.1, 0.08, 0.4]} c="#a0703f" />
          <Box p={[0, 0.38, -0.18]} s={[1.1, 0.35, 0.06]} c="#a0703f" />
          <Box p={[-0.45, 0, 0]} s={[0.08, 0.3, 0.35]} c="#3b3b3b" />
          <Box p={[0.45, 0, 0]} s={[0.08, 0.3, 0.35]} c="#3b3b3b" />
        </Grow>
      )}
      {has('campfire') && (
        <Grow position={[-2.8, 0, 0.7]} reduced={reduced}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} p={[Math.cos(i * 1.57) * 0.3, 0, Math.sin(i * 1.57) * 0.3]} s={[0.22, 0.15, 0.22]} c="#8c8c8c" />
          ))}
          <Box p={[0, 0, 0]} s={[0.5, 0.08, 0.12]} c="#6b4226" rot={[0, 0.6, 0]} />
          <group position={[0, 0.35, 0]}>
            <Flame reduced={reduced} />
          </group>
        </Grow>
      )}
      {has('well') && (
        <Grow position={[6.2, 0, -6.2]} reduced={reduced}>
          <Box p={[0, 0, 0]} s={[0.9, 0.5, 0.9]} c="#a9a49a" />
          <Box p={[0, 0.5, 0]} s={[0.6, 0.02, 0.6]} c="#4fb3e8" />
          <Box p={[-0.4, 0.5, 0]} s={[0.08, 0.7, 0.08]} c="#8b5a2b" />
          <Box p={[0.4, 0.5, 0]} s={[0.08, 0.7, 0.08]} c="#8b5a2b" />
          <Roof p={[0, 1.2, 0]} w={1.1} d={1.1} h={0.4} c="#b83f36" />
        </Grow>
      )}
      {has('statue') && (
        <Grow position={[-6.2, 0, -2.4]} reduced={reduced}>
          <Box p={[0, 0, 0]} s={[0.7, 0.4, 0.7]} c="#cfc9bd" />
          <Box p={[0, 0.4, 0]} s={[0.36, 0.7, 0.3]} c="#e3ddd0" />
          <Box p={[0, 1.1, 0]} s={[0.3, 0.3, 0.3]} c="#e3ddd0" />
          <Box p={[0.25, 0.8, 0]} s={[0.1, 0.5, 0.1]} c="#e3ddd0" rot={[0, 0, -0.5]} />
        </Grow>
      )}
      {has('arch') && (
        <Grow position={[0.1, 0, 6.2]} reduced={reduced}>
          <Box p={[-0.7, 0, 0]} s={[0.14, 1.5, 0.14]} c="#6fb83b" />
          <Box p={[0.7, 0, 0]} s={[0.14, 1.5, 0.14]} c="#6fb83b" />
          <Box p={[0, 1.45, 0]} s={[1.6, 0.16, 0.18]} c="#6fb83b" />
          {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
            <Box key={x} p={[x, 1.55, 0.05]} s={[0.16, 0.14, 0.16]} c={['#ff7eb6', '#ffd23f', '#ffffff', '#9b8cff'][i]} />
          ))}
        </Grow>
      )}
      {has('lighthouse') && (
        <Grow position={[6.4, 0, 5.1]} reduced={reduced}>
          <Box p={[0, 0, 0]} s={[0.8, 0.8, 0.8]} c="#f4f1ea" />
          <Box p={[0, 0.8, 0]} s={[0.7, 0.8, 0.7]} c="#d9574a" />
          <Box p={[0, 1.6, 0]} s={[0.6, 0.8, 0.6]} c="#f4f1ea" />
          <Box p={[0, 2.4, 0]} s={[0.5, 0.35, 0.5]} c="#ffe19a" emissive={night ? 2.5 : 0.8} />
          <Roof p={[0, 2.75, 0]} w={0.7} d={0.7} h={0.4} c="#d9574a" />
          {night && <pointLight position={[0, 2.6, 0]} color="#ffe19a" intensity={6} distance={6} />}
        </Grow>
      )}
    </>
  )
}

/** The player's avatar, standing by the front door wearing equipped items. */
function Avatar({ shop, reduced }: { shop: WorldShop; reduced: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (reduced || !ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.06
    ref.current.rotation.y = Math.sin(t * 0.6) * 0.4
  })
  const body = shop.outfitColor ?? '#d0643f'
  const hat = shop.equipped.hat
  return (
    <group position={[0.7, 0, 2.9]}>
      <group ref={ref}>
        <Box p={[-0.09, 0, 0]} s={[0.12, 0.3, 0.12]} c="#4a3a2e" />
        <Box p={[0.09, 0, 0]} s={[0.12, 0.3, 0.12]} c="#4a3a2e" />
        <Box p={[0, 0.3, 0]} s={[0.38, 0.4, 0.26]} c={body} />
        <Box p={[0, 0.7, 0]} s={[0.32, 0.32, 0.3]} c="#f6c9a6" />
        {!hat && <Box p={[0, 0.98, 0]} s={[0.34, 0.08, 0.32]} c="#6b4226" />}
        {hat === 'hat-straw' && (
          <>
            <Box p={[0, 1.0, 0]} s={[0.6, 0.04, 0.6]} c="#e8c872" />
            <Box p={[0, 1.02, 0]} s={[0.3, 0.14, 0.3]} c="#e8c872" />
          </>
        )}
        {hat === 'hat-beanie' && <Box p={[0, 0.98, 0]} s={[0.34, 0.16, 0.32]} c="#d9574a" />}
        {hat === 'hat-wizard' && (
          <mesh position={[0, 1.2, 0]} castShadow>
            <coneGeometry args={[0.22, 0.45, 6]} />
            <meshStandardMaterial color="#6a5acd" flatShading />
          </mesh>
        )}
        {hat === 'hat-crown' && <Box p={[0, 1.0, 0]} s={[0.3, 0.12, 0.28]} c="#ffcf40" emissive={0.3} />}
      </group>
      {shop.equipped.pet && (
        <group position={[0.45, 0, 0.2]}>
          <Box
            p={[0, 0, 0]}
            s={[0.3, 0.18, 0.18]}
            c={shop.equipped.pet === 'pet-fox' ? '#e8743b' : '#6b6b6b'}
          />
          <Box
            p={[0.14, 0.12, 0]}
            s={[0.14, 0.14, 0.14]}
            c={shop.equipped.pet === 'pet-fox' ? '#e8743b' : '#6b6b6b'}
          />
        </group>
      )}
    </group>
  )
}

export function WorldScene({
  world,
  focus,
  onSelect,
  reduced,
  time,
  shop,
}: {
  world: WorldState
  focus: DistrictId | null
  onSelect: (id: DistrictId) => void
  reduced: boolean
  time: TimeOfDay
  /** Items bought with petals (decor + avatar). */
  shop?: WorldShop
}) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const light = lighting[time]
  const pick = (id: DistrictId) => (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    onSelect(id)
  }
  const hover = (on: boolean) => () => {
    document.body.style.cursor = on ? 'pointer' : ''
  }
  const target = (id: DistrictId) => ({
    onClick: pick(id),
    onPointerOver: hover(true),
    onPointerOut: hover(false),
  })
  const { scene } = world
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [18.6, 17.4, 18.6], fov: 32, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
    >
      <ambientLight intensity={light.ambient} />
      <hemisphereLight args={[light.hemi[0], light.hemi[1], 0.7]} />
      <directionalLight
        position={[10, 16, 6]}
        intensity={light.sunIntensity}
        color={light.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <Island />
      <group {...target('home')}>
        <Home tier={scene.homeTier} reduced={reduced} />
      </group>
      <group {...target('garden')}>
        <Garden trees={scene.trees} flowers={scene.flowers} reduced={reduced} />
      </group>
      <group {...target('library')}>
        <Library books={scene.books} reduced={reduced} />
      </group>
      <group {...target('town')}>
        <Town buildings={scene.buildings} reduced={reduced} />
      </group>
      <group {...target('monument')}>
        <Monument blocks={scene.monumentBlocks} flame={scene.flame} reduced={reduced} />
      </group>
      <group {...target('trophies')}>
        <TrophyHall trophies={scene.trophies} reduced={reduced} />
      </group>
      {subOn('bloomWorld', 'decorations') && (
        <Decorations world={world} reduced={reduced} night={time === 'night' || time === 'dusk'} />
      )}
      {shop && (
        <>
          <ShopDecor owned={shop.owned} reduced={reduced} night={time === 'night' || time === 'dusk'} />
          <Avatar shop={shop} reduced={reduced} />
        </>
      )}
      {subOn('bloomWorld', 'clouds') && <Clouds reduced={reduced} />}
      <SelectionRing id={focus} reduced={reduced} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableZoom={false}
        minDistance={7}
        maxDistance={34}
        minPolarAngle={0.35}
        maxPolarAngle={1.2}
        autoRotate={!reduced && !focus}
        autoRotateSpeed={0.35}
      />
      <CameraRig focus={focus} controls={controls} reduced={reduced} />
    </Canvas>
  )
}
