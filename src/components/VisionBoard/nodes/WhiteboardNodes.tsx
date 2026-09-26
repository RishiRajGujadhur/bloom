import { useLayoutEffect, useRef } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import gsap from 'gsap'
import { useBoard, type CanvasNode } from '../BoardContext'
import styles from '../VisionBoard.module.css'

/** Source + target handles on all four sides so arrows can attach anywhere. */
export function Ports() {
  return (
    <>
      <Handle id="t" type="target" position={Position.Top} className={styles.port} />
      <Handle id="l" type="target" position={Position.Left} className={styles.port} />
      <Handle id="b" type="source" position={Position.Bottom} className={styles.port} />
      <Handle id="r" type="source" position={Position.Right} className={styles.port} />
    </>
  )
}

function Head({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <header>
      <span>{label}</span>
      <button className="nodrag" aria-label={`Remove ${label.toLowerCase()}`} onClick={onRemove}>
        ×
      </button>
    </header>
  )
}

export function ImageNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const { update, remove } = useBoard()
  return (
    <figure className={styles.image}>
      <NodeResizer isVisible={selected} minWidth={160} minHeight={140} keepAspectRatio color="var(--accent-color)" />
      <Ports />
      <Head label="Image" onRemove={() => remove(id)} />
      {typeof data.src === 'string' && <img src={data.src} alt={String(data.caption ?? 'Board image')} draggable={false} />}
      <input className="nodrag" aria-label="Image caption" placeholder="Add a caption" value={String(data.caption ?? '')} onChange={(e) => update(id, { caption: e.target.value })} />
    </figure>
  )
}

/** A long-term goal with a progress ring that springs when you move the slider. */
export function GoalNode({ id, data }: NodeProps<CanvasNode>) {
  const { update, remove } = useBoard()
  const progress = Number(data.progress ?? 0)
  const arc = useRef<SVGCircleElement>(null)
  const C = 2 * Math.PI * 26
  useLayoutEffect(() => {
    if (arc.current) gsap.to(arc.current, { strokeDashoffset: C * (1 - progress / 100), duration: 0.8, ease: 'elastic.out(1, 0.6)' })
  }, [progress, C])
  return (
    <article className={styles.goal} data-done={progress >= 100}>
      <Ports />
      <Head label="Long-term goal" onRemove={() => remove(id)} />
      <div className={styles.goalBody}>
        <svg viewBox="0 0 64 64" className={styles.goalRing} aria-hidden="true">
          <circle cx="32" cy="32" r="26" className={styles.goalTrack} />
          <circle ref={arc} cx="32" cy="32" r="26" className={styles.goalArc} strokeDasharray={C} strokeDashoffset={C} transform="rotate(-90 32 32)" />
          <text x="32" y="36" textAnchor="middle">
            {progress}%
          </text>
        </svg>
        <div>
          <input className="nodrag" aria-label="Goal" placeholder="Run a half marathon" value={String(data.title ?? '')} onChange={(e) => update(id, { title: e.target.value })} />
          <input className="nodrag" type="date" aria-label="Target date" value={String(data.due ?? '')} onChange={(e) => update(id, { due: e.target.value })} />
        </div>
      </div>
      <input className="nodrag" type="range" min="0" max="100" step="5" aria-label="Progress" value={progress} onChange={(e) => update(id, { progress: Number(e.target.value) })} />
    </article>
  )
}

/** A live habit card: its streak dots come straight from your habit data. */
export function HabitNode({ id, data }: NodeProps<CanvasNode>) {
  const { remove, habits = [] } = useBoard()
  const habit = habits.find((h) => h.id === data.referenceId)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 13 + i)
    return d.toISOString().slice(0, 10)
  })
  return (
    <article className={styles.habit}>
      <Ports />
      <Head label="Habit" onRemove={() => remove(id)} />
      <h3>{habit?.title ?? 'A habit you removed'}</h3>
      <div className={styles.habitDots} aria-label="Last 14 days">
        {days.map((d) => (
          <i key={d} data-on={habit?.dates.includes(d) ?? false} title={d} />
        ))}
      </div>
    </article>
  )
}
