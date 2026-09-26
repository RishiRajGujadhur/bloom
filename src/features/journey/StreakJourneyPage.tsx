import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3 } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { FeaturePageProps } from '../shared/pageProps'
import { Scene3D } from '../../components/ui/Scene3D'
import { habitStats } from '../habits'
import { dayKey } from '../../dates'
import { journeySteps, pathPoints, type JourneyStep } from './journeyModel'
import './journey.css'

gsap.registerPlugin(ScrollTrigger)

/** Moves the camera along the curve according to `progress.value` (0–1). */
function Rig({ curve, progress }: { curve: CatmullRomCurve3; progress: { value: number } }) {
  const { camera } = useThree()
  const look = useMemo(() => new Vector3(), [])
  useFrame(() => {
    const p = Math.min(0.98, Math.max(0, progress.value))
    const point = curve.getPointAt(p)
    look.copy(curve.getPointAt(Math.min(1, p + 0.02)))
    camera.position.set(point.x, point.y + 2.4, point.z + 5)
    camera.lookAt(look.x, look.y + 0.6, look.z)
  })
  return null
}

function Path({ steps, curve }: { steps: JourneyStep[]; curve: CatmullRomCurve3 }) {
  const tiles = useMemo(() => steps.map((_, i) => curve.getPointAt(steps.length > 1 ? i / (steps.length - 1) : 0)), [steps, curve])
  return (
    <group>
      <mesh position={[0, -0.6, -steps.length * 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, steps.length * 3 + 40]} />
        <meshStandardMaterial color="#5c9e4f" />
      </mesh>
      {tiles.map((p, i) => (
        <group key={i} position={[p.x, p.y - 0.5, p.z]}>
          <mesh>
            <boxGeometry args={[1.6, 0.2, 1.6]} />
            <meshStandardMaterial color={steps[i].milestone ? '#ffd166' : '#e8d3a2'} />
          </mesh>
          {steps[i].milestone && (
            <group position={[1.6, 0, 0]}>
              <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[0.5, 1.8, 0.5]} />
                <meshStandardMaterial color="#f4efe4" />
              </mesh>
              <mesh position={[0, 2.05, 0]}>
                <coneGeometry args={[0.36, 0.5, 4]} />
                <meshStandardMaterial color="#d0643f" emissive="#d0643f" emissiveIntensity={0.6} />
              </mesh>
            </group>
          )}
          {i % 3 === 1 && (
            <mesh position={[-2.2, 0.6, 0]}>
              <coneGeometry args={[0.6, 1.4, 6]} />
              <meshStandardMaterial color="#3f8a3a" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/**
 * Scroll the page and the camera walks the path of your longest streak for a
 * habit; each tile is a day, with a monument every 7 days.
 */
export function StreakJourneyPage({ data, today }: FeaturePageProps) {
  const ranked = [...data.habits].sort(
    (a, b) => habitStats(b.dates, today).best - habitStats(a.dates, today).best,
  )
  const [habitId, setHabitId] = useState(ranked[0]?.id ?? '')
  const habit = data.habits.find((h) => h.id === habitId)
  const steps = useMemo(() => (habit ? journeySteps(habit.dates, today) : []), [habit, today])
  const curve = useMemo(
    () => new CatmullRomCurve3(pathPoints(steps.length).map(([x, y, z]) => new Vector3(x, y, z))),
    [steps.length],
  )
  const progress = useRef({ value: 0 }).current
  const list = useRef<HTMLOListElement>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!list.current || steps.length < 2) return
    const trigger = ScrollTrigger.create({
      trigger: list.current,
      start: 'top 60%',
      end: 'bottom 70%',
      scrub: 0.6,
      onUpdate: (self) => {
        progress.value = self.progress
        setCurrent(Math.round(self.progress * (steps.length - 1)))
      },
    })
    return () => trigger.kill()
  }, [steps.length, progress])

  const notes = (date: string) =>
    data.sessions
      .filter((s) => dayKey(new Date(s.metadata.date)) === date)
      .flatMap((s) => s.messages.filter((m) => m.sender === 'user').map((m) => m.text))
      .join(' ')

  if (!data.habits.length)
    return <p className="wb-muted">Add a habit and check in a few days in a row to start your journey.</p>

  return (
    <section className="journey-page" aria-label="Streak journey">
      <div className="journey-sticky">
        <div className="journey-toolbar">
          <label>
            Habit{' '}
            <select value={habitId} onChange={(e) => setHabitId(e.target.value)}>
              {ranked.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </label>
          <strong>
            {steps.length} day{steps.length === 1 ? '' : 's'} · day {Math.min(current + 1, steps.length)}
          </strong>
        </div>
        <div className="journey-stage">
          {steps.length >= 2 ? (
            <Scene3D>
              <Canvas camera={{ position: [0, 2.4, 5], fov: 55 }} dpr={[1, 2]}>
                <color attach="background" args={['#bfe3ff']} />
                <fog attach="fog" args={['#bfe3ff', 10, 40]} />
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 10, 5]} intensity={1.6} />
                <Path steps={steps} curve={curve} />
                <Rig curve={curve} progress={progress} />
              </Canvas>
            </Scene3D>
          ) : (
            <div className="scene-fallback">Check in two days in a row to lay the first stones of your path.</div>
          )}
        </div>
      </div>
      <ol className="journey-steps" ref={list}>
        {steps.map((step) => (
          <li key={step.date} data-milestone={step.milestone} data-active={step.index === current}>
            <span className="journey-day">Day {step.index + 1}</span>
            <strong>
              {new Date(`${step.date}T12:00:00`).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </strong>
            {step.milestone && <span className="journey-badge">🏛️ {step.index + 1}-day monument</span>}
            {notes(step.date) && <p>“{notes(step.date).slice(0, 180)}”</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}
