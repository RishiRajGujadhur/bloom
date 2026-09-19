import { Handle, Position, type NodeProps } from '@xyflow/react'
import { journalText } from '../../../search/db'
import { useBoard, type CanvasNode } from '../BoardContext'
import styles from '../VisionBoard.module.css'

export function JournalNode({ id, data }: NodeProps<CanvasNode>) {
  const { journals, remove } = useBoard()
  const entry = journals.find((item) => item.id === data.referenceId)
  return (
    <article className={styles.journal}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <header>
        <span>↗ FROM YOUR DAYBOOK</span>
        <button
          className="nodrag"
          aria-label="Remove journal card"
          onClick={() => remove(id)}
        >
          ×
        </button>
      </header>
      <h3>{entry?.modeTitle ?? 'Reflection unavailable'}</h3>
      {entry ? (
        <>
          <time>
            {new Date(entry.updatedAt).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          </time>
          <p className="nodrag nowheel">
            {journalText(entry.content).slice(0, 700) ||
              'A quiet page, ready for your words.'}
          </p>
        </>
      ) : (
        <p>
          The original entry is no longer available. This pin does not contain a
          copy.
        </p>
      )}
      <small>A moment worth keeping</small>
    </article>
  )
}
