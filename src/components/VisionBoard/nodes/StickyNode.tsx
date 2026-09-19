import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { useBoard, type CanvasNode } from '../BoardContext'
import styles from '../VisionBoard.module.css'

export function StickyNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const { update, remove } = useBoard()
  return (
    <div className={styles.sticky} data-color={String(data.color ?? 'gold')}>
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={200}
        color="var(--accent-color)"
      />
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <header>
        <span>✦ A little intention</span>
        <button
          className="nodrag"
          aria-label="Remove sticky note"
          onClick={() => remove(id)}
        >
          ×
        </button>
      </header>
      <textarea
        className="nodrag nowheel"
        aria-label="Sticky note text"
        placeholder="What are you growing toward?"
        value={String(data.text ?? '')}
        onChange={(event) => update(id, { text: event.target.value })}
      />
      <footer className="nodrag">
        <label>
          Color{' '}
          <select
            aria-label="Sticky note color"
            value={String(data.color ?? 'gold')}
            onChange={(event) => update(id, { color: event.target.value })}
          >
            <option value="gold">Honey</option>
            <option value="rose">Rose</option>
            <option value="mint">Mint</option>
            <option value="lavender">Lavender</option>
          </select>
        </label>
        <span>Make room for it.</span>
      </footer>
    </div>
  )
}
