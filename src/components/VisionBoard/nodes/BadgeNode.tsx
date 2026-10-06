import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useBoard, type CanvasNode } from '../BoardContext'
import styles from '../VisionBoard.module.css'

export function BadgeNode({ id, data }: NodeProps<CanvasNode>) {
  const { update, remove } = useBoard()
  const earned = typeof data.referenceId === 'string'
  return (
    <article className={styles.badge}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <header>
        <span>{earned ? 'EARNED BADGE' : 'MY MILESTONE'}</span>
        <button
          className="nodrag"
          aria-label="Remove badge"
          onClick={() => remove(id)}
        >
          ×
        </button>
      </header>
      <img
        src="/rpg/chest.svg"
        alt="Pixel art treasure chest"
        draggable={false}
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
      />
      {earned ? (
        <h3>{String(data.referenceId)}</h3>
      ) : (
        <input
          className="nodrag"
          aria-label="Milestone title"
          value={String(data.title ?? '')}
          placeholder="Name your next milestone"
          onChange={(event) => update(id, { title: event.target.value })}
        />
      )}
      <p>{earned ? 'A win to remember.' : 'Something worth working toward.'}</p>
    </article>
  )
}
