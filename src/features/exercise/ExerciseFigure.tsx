import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef } from 'react'
import { createTimeline, type Timeline } from 'animejs'
import type { Exercise, Joint, Pose } from './exercises'
import { subOn } from '../subFeatures'

/**
 * Side-view figure animated with anime.js. Every limb is a nested <g> that
 * rotates about its joint, so a pose is just a set of angles; the timeline
 * eases start → end → start at the exercise's tempo. Each loop is one rep.
 */
const joints: Joint[] = [
  'root',
  'drop',
  'shift',
  'torso',
  'shL',
  'elL',
  'shR',
  'elR',
  'hipL',
  'knL',
  'hipR',
  'knR',
  'neck',
  'jaw',
  'wrL',
  'wrR',
]
const at = (p: Pose, j: Joint) => p[j] ?? 0
const origin = (x: number, y: number) =>
  ({ transformBox: 'view-box', transformOrigin: `${x}px ${y}px` }) as const
const scaled = (j: Joint) => j === 'jaw' || j === 'wrL' || j === 'wrR'
const transformOf = (j: Joint, v: number) =>
  j === 'drop'
    ? `translateY(${v}px)`
    : j === 'shift'
      ? `translateX(${v}px)`
      : j === 'jaw'
        ? `scaleY(${0.15 + v / 100})`
        : scaled(j)
          ? `scale(${1 + v / 100})`
          : `rotate(${v}deg)`

function Leg({
  side,
  refs,
  pose,
}: {
  side: 'L' | 'R'
  refs: React.MutableRefObject<Partial<Record<Joint, SVGGElement | null>>>
  pose: Pose
}) {
  return (
    <g
      className={`ef-limb ef-${side}`}
      ref={(el) => void (refs.current[`hip${side}`] = el)}
      style={{
        ...origin(110, 125),
        transform: transformOf(`hip${side}`, at(pose, `hip${side}`)),
      }}
    >
      <line x1="110" y1="125" x2="110" y2="165" />
      <g
        ref={(el) => void (refs.current[`kn${side}`] = el)}
        style={{
          ...origin(110, 165),
          transform: transformOf(`kn${side}`, at(pose, `kn${side}`)),
        }}
      >
        <line x1="110" y1="165" x2="110" y2="205" />
        <line x1="110" y1="205" x2="122" y2="205" />
      </g>
    </g>
  )
}
function Arm({
  side,
  refs,
  pose,
}: {
  side: 'L' | 'R'
  refs: React.MutableRefObject<Partial<Record<Joint, SVGGElement | null>>>
  pose: Pose
}) {
  return (
    <g
      className={`ef-limb ef-${side}`}
      ref={(el) => void (refs.current[`sh${side}`] = el)}
      style={{
        ...origin(110, 80),
        transform: transformOf(`sh${side}`, at(pose, `sh${side}`)),
      }}
    >
      <line x1="110" y1="80" x2="110" y2="110" />
      <g
        ref={(el) => void (refs.current[`el${side}`] = el)}
        style={{
          ...origin(110, 110),
          transform: transformOf(`el${side}`, at(pose, `el${side}`)),
        }}
      >
        <line x1="110" y1="110" x2="110" y2="136" />
        <g
          className="ef-hand"
          ref={(el) => void (refs.current[`wr${side}`] = el)}
          style={{ ...origin(110, 137), transform: transformOf(`wr${side}`, at(pose, `wr${side}`)) }}
        >
          <circle cx="110" cy="139" r="4.5" />
          <line x1="110" y1="141" x2="104" y2="150" />
          <line x1="110" y1="142" x2="108" y2="152" />
          <line x1="110" y1="142" x2="112" y2="152" />
          <line x1="110" y1="141" x2="116" y2="150" />
        </g>
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
    if (
      !animate ||
      prefersReducedMotion()
    )
      return
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
      const prop =
        j === 'drop' ? 'translateY' : j === 'shift' ? 'translateX' : j === 'jaw' ? 'scaleY' : scaled(j) ? 'scale' : 'rotate'
      const v = (x: number) => (j === 'jaw' ? 0.15 + x / 100 : scaled(j) ? 1 + x / 100 : x)
      timeline.add(
        el,
        {
          [prop]: [
            { to: [v(a), v(b)], duration: down, ease: 'inOutSine' },
            { to: v(b), duration: hold },
            { to: v(a), duration: up, ease: 'inOutSine' },
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
  return (
    <FigureSvg
      pose={pose}
      refs={refs}
      mirror={mirror}
      small={small}
      label={`${exercise.name} form guide`}
      wheelchair={exercise.wheelchair}
      floor={floor}
    />
  )
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
  wheelchair,
}: {
  pose: Pose
  refs?: React.MutableRefObject<Partial<Record<Joint, SVGGElement | null>>>
  mirror?: boolean
  small?: boolean
  label: string
  floor?: boolean
  wheelchair?: boolean
  className?: string
}) {
  const own = useRef<Partial<Record<Joint, SVGGElement | null>>>({})
  const refs = given ?? own
  return (
    <svg
      className={`ef ${className ?? ''} ${subOn('exerciseGuides', 'faceHands') ? '' : 'ef-plain'}`}
      data-small={small}
      viewBox="0 0 220 230"
      role="img"
      aria-label={label}
      style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
    >
      {wheelchair && subOn('exerciseGuides', 'seatedFigure') && (
        <g className="ef-chair" aria-hidden="true">
          <path className="ef-chair-frame" d="M86 84 V136 H156 L168 184 M92 136 L104 178 M156 136 V112" />
          <rect className="ef-chair-seat" x="86" y="131" width="72" height="8" rx="4" />
          <rect className="ef-chair-back" x="82" y="80" width="9" height="56" rx="4" />
          <g className="ef-wheel">
            <circle cx="104" cy="178" r="28" />
            <path d="M104 150 V206 M76 178 H132 M84 158 L124 198 M124 158 L84 198" />
          </g>
          <circle className="ef-caster" cx="168" cy="200" r="8" />
        </g>
      )}
      <line className="ef-floor" x1="10" y1="208" x2="210" y2="208" />
      <g
        className="ef-floorshift"
        style={{ transform: floor ? 'translateX(-55px)' : wheelchair ? 'translateY(8px)' : 'none' }}
      >
        <g
          ref={(el) => void (refs.current.root = el)}
          style={{
            ...origin(110, 205),
            transform: transformOf('root', at(pose, 'root')),
          }}
        >
          <g
            ref={(el) => void (refs.current.shift = el)}
            style={{ transform: transformOf('shift', at(pose, 'shift')) }}
          >
            <g
              ref={(el) => void (refs.current.drop = el)}
              style={{ transform: transformOf('drop', at(pose, 'drop')) }}
            >
              <Leg side="R" refs={refs} pose={pose} />
              <g
                ref={(el) => void (refs.current.torso = el)}
                style={{
                  ...origin(110, 125),
                  transform: transformOf('torso', at(pose, 'torso')),
                }}
              >
                <Arm side="R" refs={refs} pose={pose} />
                <line className="ef-spine" x1="110" y1="125" x2="110" y2="76" />
                <g
                  className="ef-headgroup"
                  ref={(el) => void (refs.current.neck = el)}
                  style={{ ...origin(110, 74), transform: transformOf('neck', at(pose, 'neck')) }}
                >
                  <circle className="ef-head" cx="110" cy="58" r="13" />
                  <circle className="ef-eye" cx="116" cy="55" r="1.8" />
                  <g
                    ref={(el) => void (refs.current.jaw = el)}
                    style={{ ...origin(117, 63), transform: transformOf('jaw', at(pose, 'jaw')) }}
                  >
                    <ellipse className="ef-mouth" cx="117" cy="63" rx="3.2" ry="3.2" />
                  </g>
                </g>
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
