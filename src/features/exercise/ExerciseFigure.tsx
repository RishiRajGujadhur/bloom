import { useEffect, useRef } from 'react'
import { createTimeline, type Timeline } from 'animejs'
import type { Exercise, Joint, Pose } from './exercises'

/**
 * Side-view figure animated with anime.js. Every limb is a nested <g> that
 * rotates about its joint, so a pose is just a set of angles; the timeline
 * eases start → end → start at the exercise's tempo. Each loop is one rep.
 */
const joints: Joint[] = ['root', 'drop', 'shift', 'torso', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR']
const at = (p: Pose, j: Joint) => p[j] ?? 0
const origin = (x: number, y: number) => ({ transformBox: 'view-box', transformOrigin: `${x}px ${y}px` }) as const
const transformOf = (j: Joint, v: number) => (j === 'drop' ? `translateY(${v}px)` : j === 'shift' ? `translateX(${v}px)` : `rotate(${v}deg)`)

function Leg({ side, refs, pose }: { side: 'L' | 'R'; refs: React.MutableRefObject<Partial<Record<Joint, SVGGElement | null>>>; pose: Pose }) {
  return (
    <g className={`ef-limb ef-${side}`} ref={(el) => void (refs.current[`hip${side}`] = el)} style={{ ...origin(110, 125), transform: transformOf(`hip${side}`, at(pose, `hip${side}`)) }}>
      <line x1="110" y1="125" x2="110" y2="165" />
      <g ref={(el) => void (refs.current[`kn${side}`] = el)} style={{ ...origin(110, 165), transform: transformOf(`kn${side}`, at(pose, `kn${side}`)) }}>
        <line x1="110" y1="165" x2="110" y2="205" />
        <line x1="110" y1="205" x2="122" y2="205" />
      </g>
    </g>
  )
}
function Arm({ side, refs, pose }: { side: 'L' | 'R'; refs: React.MutableRefObject<Partial<Record<Joint, SVGGElement | null>>>; pose: Pose }) {
  return (
    <g className={`ef-limb ef-${side}`} ref={(el) => void (refs.current[`sh${side}`] = el)} style={{ ...origin(110, 80), transform: transformOf(`sh${side}`, at(pose, `sh${side}`)) }}>
      <line x1="110" y1="80" x2="110" y2="110" />
      <g ref={(el) => void (refs.current[`el${side}`] = el)} style={{ ...origin(110, 110), transform: transformOf(`el${side}`, at(pose, `el${side}`)) }}>
        <line x1="110" y1="110" x2="110" y2="136" />
        <circle cx="110" cy="138" r="4" />
      </g>
    </g>
  )
}

export function ExerciseFigure({
  exercise,
  playing,
  speed = 1,
  mirror = false,
  animate = true,
  onRep,
  onPhase,
  small,
}: {
  exercise: Exercise
  playing: boolean
  speed?: number
  mirror?: boolean
  animate?: boolean
  onRep?: () => void
  onPhase?: (phase: 'down' | 'up') => void
  small?: boolean
}) {
  const refs = useRef<Partial<Record<Joint, SVGGElement | null>>>({})
  const tl = useRef<Timeline | null>(null)
  const rep = useRef(onRep)
  const phase = useRef(onPhase)
  rep.current = onRep
  phase.current = onPhase
  const floor = at(exercise.a, 'root') > 45 || at(exercise.b, 'root') > 45

  useEffect(() => {
    if (!animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const [down, hold, up] = exercise.tempo.map((s) => Math.max(1, s * 1000))
    const timeline = createTimeline({
      loop: true,
      autoplay: false,
      playbackRate: speed,
      onLoop: () => {
        rep.current?.()
        phase.current?.('down')
      },
    })
    for (const j of joints) {
      const el = refs.current[j]
      const a = at(exercise.a, j)
      const b = at(exercise.b, j)
      if (!el || (a === 0 && b === 0)) continue
      const prop = j === 'drop' ? 'translateY' : j === 'shift' ? 'translateX' : 'rotate'
      timeline.add(
        el,
        {
          [prop]: [
            { to: [a, b], duration: down, ease: 'inOutSine' },
            { to: b, duration: hold },
            { to: a, duration: up, ease: 'inOutSine' },
          ],
        },
        0,
      )
    }
    timeline.call(() => phase.current?.('up'), down + hold)
    tl.current = timeline
    return () => {
      timeline.revert()
      tl.current = null
    }
  }, [exercise, speed, animate])

  useEffect(() => {
    const t = tl.current
    if (!t) return
    if (playing) {
      t.play()
      phase.current?.('down')
    } else t.pause()
  }, [playing, exercise, speed, animate])

  const pose = animate ? exercise.a : exercise.b
  return <FigureSvg pose={pose} refs={refs} mirror={mirror} small={small} label={`${exercise.name} form guide`} floor={floor} />
}

/**
 * The figure itself. Transforms come from `pose`; pass refs to animate joints
 * directly (exercise guides), or rely on the CSS transition for smooth
 * pose-to-pose morphs (yoga flows).
 */
export function FigureSvg({
  pose,
  refs: given,
  mirror,
  small,
  label,
  floor,
  className,
}: {
  pose: Pose
  refs?: React.MutableRefObject<Partial<Record<Joint, SVGGElement | null>>>
  mirror?: boolean
  small?: boolean
  label: string
  floor?: boolean
  className?: string
}) {
  const own = useRef<Partial<Record<Joint, SVGGElement | null>>>({})
  const refs = given ?? own
  return (
    <svg className={`ef ${className ?? ''}`} data-small={small} viewBox="0 0 220 230" role="img" aria-label={label} style={{ transform: mirror ? 'scaleX(-1)' : undefined }}>
      <line className="ef-floor" x1="10" y1="208" x2="210" y2="208" />
      <g className="ef-floorshift" style={{ transform: floor ? 'translateX(-55px)' : 'none' }}>
        <g ref={(el) => void (refs.current.root = el)} style={{ ...origin(110, 205), transform: transformOf('root', at(pose, 'root')) }}>
          <g ref={(el) => void (refs.current.shift = el)} style={{ transform: transformOf('shift', at(pose, 'shift')) }}>
            <g ref={(el) => void (refs.current.drop = el)} style={{ transform: transformOf('drop', at(pose, 'drop')) }}>
              <Leg side="R" refs={refs} pose={pose} />
              <g ref={(el) => void (refs.current.torso = el)} style={{ ...origin(110, 125), transform: transformOf('torso', at(pose, 'torso')) }}>
                <Arm side="R" refs={refs} pose={pose} />
                <line className="ef-spine" x1="110" y1="125" x2="110" y2="76" />
                <circle className="ef-head" cx="110" cy="58" r="13" />
                <Arm side="L" refs={refs} pose={pose} />
              </g>
              <Leg side="L" refs={refs} pose={pose} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
