import { subOn } from '../subFeatures'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Color, Object3D, type Group, type InstancedMesh } from 'three'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import type { JournalEntry } from '../../components/daybook/types'
import { angleForIndex, facingIndex, palaceDays, type PalaceDay } from './palaceModel'
import './palace.css'
import { YearRibbon } from '../showcase/YearRibbon'
import { usePageActions } from '../../components/ui/PageMenu'
import { Scene3D } from '../../components/ui/Scene3D'

gsap.registerPlugin(Observer)

const RADIUS = 16
const moodColors = ['#6b7fd7', '#8f7ae5', '#e3a857', '#f2a65a', '#f27b50']

function readDaybook() {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]')
    return Array.isArray(value)
      ? (value as JournalEntry[]).map((e) => ({ date: e.createdAt.slice(0, 10), title: e.modeTitle }))
      : []
  } catch {
    return []
  }
}

/** 365 blocks drawn with a single InstancedMesh; rotation comes from `spin`. */
function Ring({
  days,
  spin,
  selected,
  onPick,
}: {
  days: PalaceDay[]
  spin: { angle: number }
  selected: number
  onPick: (index: number) => void
}) {
  const mesh = useRef<InstancedMesh>(null)
  const group = useRef<Group>(null)
  const dummy = useMemo(() => new Object3D(), [])
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const color = new Color()
    days.forEach((day, i) => {
      const theta = (i / days.length) * Math.PI * 2
      const h = 0.3 + day.intensity * 3.2
      dummy.position.set(Math.sin(theta) * RADIUS, h / 2 - 1.5, Math.cos(theta) * RADIUS)
      dummy.rotation.set(0, theta, 0)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      color.set(
        i === selected
          ? '#ffffff'
          : day.mood !== null && subOn('memoryPalace', 'moodColors')
            ? moodColors[Math.round(day.mood) - 1]
            : day.intensity > 0
              ? '#d0643f'
              : '#3a3550',
      )
      m.setColorAt(i, color)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [days, dummy, selected])
  useFrame(() => {
    if (group.current) group.current.rotation.y = -spin.angle
  })
  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, days.length]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (e.instanceId !== undefined) onPick(e.instanceId)
        }}
      >
        <boxGeometry args={[0.22, 1, 0.5]} />
        <meshStandardMaterial emissive="#ff9a5c" emissiveIntensity={0.35} roughness={0.4} />
      </instancedMesh>
      {/* Month markers on the floor ring */}
      {subOn('memoryPalace', 'monthMarkers') && Array.from({ length: 12 }, (_, m) => {
        const theta = (m / 12) * Math.PI * 2
        return (
          <mesh key={m} position={[Math.sin(theta) * (RADIUS + 1.4), -1.5, Math.cos(theta) * (RADIUS + 1.4)]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#fff6a8" />
          </mesh>
        )
      })}
    </group>
  )
}

function CameraZoom({ zoomed }: { zoomed: boolean }) {
  const { camera } = useThree()
  useEffect(() => {
    const target = zoomed ? { x: 0, y: 1.2, z: RADIUS + 4.5 } : { x: 0, y: 7, z: RADIUS + 16 }
    const tween = gsap.to(camera.position, {
      ...target,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => camera.lookAt(0, zoomed ? 0.5 : 0, zoomed ? RADIUS : 0),
    })
    return () => {
      tween.kill()
    }
  }, [zoomed, camera])
  return null
}

export function MemoryPalacePage({ data, today }: FeaturePageProps) {
  const year = Number(today.slice(0, 4))
  const days = useMemo(() => palaceDays(data, year, readDaybook()), [data, year])
  const todayIndex = Math.max(0, days.findIndex((d) => d.date === today))
  const spin = useRef({ angle: angleForIndex(todayIndex, days.length, 0) }).current
  const [selected, setSelected] = useState(todayIndex)
  const [zoomed, setZoomed] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const goTo = (index: number) => {
    const target = angleForIndex(((index % days.length) + days.length) % days.length, days.length, spin.angle)
    gsap.to(spin, {
      angle: target,
      duration: reduced ? 0 : 0.8,
      ease: 'power3.out',
      onUpdate: () => setSelected(facingIndex(spin.angle, days.length)),
    })
  }

  // Drag / wheel / touch spin the ring with inertia, then snap to a day.
  useEffect(() => {
    const target = stage.current
    if (!target || !subOn('memoryPalace', 'inertia')) return
    let velocity = 0
    const observer = Observer.create({
      target,
      type: 'wheel,touch,pointer',
      wheelSpeed: -1,
      tolerance: 4,
      preventDefault: true,
      onChange: (self) => {
        gsap.killTweensOf(spin)
        const delta = (self.deltaX || self.deltaY) * 0.0035
        velocity = delta
        spin.angle += self.event.type === 'wheel' ? delta : -delta
        setSelected(facingIndex(spin.angle, days.length))
      },
      onStop: () => {
        const coast = spin.angle + velocity * 18
        gsap.to(spin, {
          angle: angleForIndex(facingIndex(coast, days.length), days.length, coast),
          duration: reduced ? 0 : 1.1,
          ease: 'power3.out',
          onUpdate: () => setSelected(facingIndex(spin.angle, days.length)),
        })
      },
    })
    return () => observer.kill()
  }, [days.length, reduced, spin])

  const day = days[selected]
  usePageActions([
    { id: 'pl-today', label: 'Back to today', icon: '📍', run: () => goTo(todayIndex) },
    { id: 'pl-prev', label: 'Previous day', icon: '⬅️', run: () => goTo(selected - 1) },
    { id: 'pl-next', label: 'Next day', icon: '➡️', run: () => goTo(selected + 1) },
    { id: 'pl-zoom', label: zoomed ? 'Zoom out' : 'Zoom in', icon: '🔍', run: () => setZoomed((z) => !z) },
  ])
  return (
    <section className="palace-page" aria-label="Memory palace">
      <div
        className="palace-stage"
        ref={stage}
        tabIndex={0}
        aria-label="Year ring. Use left and right arrows to move between days, Enter to zoom."
        onKeyDown={(e) => {
          if (!subOn('memoryPalace', 'keyboard')) return
          if (e.key === 'ArrowRight') goTo(selected + 1)
          if (e.key === 'ArrowLeft') goTo(selected - 1)
          if (e.key === 'Enter') setZoomed((z) => !z)
        }}
      >
        <Scene3D>
        <Canvas camera={{ position: [0, 7, RADIUS + 16], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={['#15121f']} />
          {subOn('memoryPalace', 'fog') && <fog attach="fog" args={['#15121f', 20, 55]} />}
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 8, RADIUS + 6]} intensity={60} color="#ffd9b0" />
          <Ring
            days={days}
            spin={spin}
            selected={selected}
            onPick={(i) => {
              goTo(i)
              if (subOn('memoryPalace', 'zoom')) setZoomed(true)
            }}
          />
          <CameraZoom zoomed={zoomed} />
        </Canvas>
        </Scene3D>
        <div className="palace-hud">
          <button className="icon-button" aria-label="Previous day" onClick={() => goTo(selected - 1)}>
            <ChevronLeft size={18} />
          </button>
          <strong>
            {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
            })}
          </strong>
          <button className="icon-button" aria-label="Next day" onClick={() => goTo(selected + 1)}>
            <ChevronRight size={18} />
          </button>
          <button className="ov-secondary" onClick={() => setZoomed((z) => !z)}>
            {zoomed ? 'Step back' : 'Zoom in'}
          </button>
          <button className="ov-secondary" onClick={() => goTo(todayIndex)}>
            Today
          </button>
        </div>
      </div>
      {subOn('memoryPalace', 'ribbon') && <YearRibbon days={days} selected={selected} onPick={(i) => goTo(Math.max(0, Math.min(days.length - 1, i)))} />}
      <div className="palace-detail" aria-live="polite">
        {day.intensity === 0 && day.mood === null ? (
          <p className="wb-muted">A quiet day. Nothing recorded.</p>
        ) : (
          <ul>
            {day.mood !== null && <li>😊 Mood {day.mood.toFixed(1)} / 5</li>}
            {day.tasks > 0 && <li>✅ {day.tasks} tasks done</li>}
            {day.habits > 0 && <li>🌱 {day.habits} habit check-ins</li>}
            {day.focus > 0 && <li>⏱️ {day.focus} focus minutes</li>}
            {day.journals > 0 && <li>📓 {day.journals} journal entries</li>}
            {day.pages.map((p, i) => (
              <li key={i}>📄 {p}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
