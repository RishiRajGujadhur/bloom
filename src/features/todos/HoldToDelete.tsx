import { useEffect, useRef, useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'

export const DELETE_HOLD_MS = 1600

export function HoldToDelete({
  title,
  onDelete,
}: {
  title: string
  onDelete: () => void
}) {
  const [phase, setPhase] = useState<'idle' | 'holding' | 'deleted'>('idle')
  const active = useRef(false)
  const committed = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deleteAction = useRef(onDelete)
  deleteAction.current = onDelete

  const cancel = () => {
    if (committed.current) return
    active.current = false
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
    setPhase('idle')
  }
  const start = () => {
    if (active.current || committed.current) return
    active.current = true
    setPhase('holding')
    timer.current = setTimeout(() => {
      committed.current = true
      active.current = false
      setPhase('deleted')
      if (prefersReducedMotion()) deleteAction.current()
      else timer.current = setTimeout(() => deleteAction.current(), 220)
    }, DELETE_HOLD_MS)
  }

  useEffect(() => {
    const stop = () => {
      if (committed.current) return
      active.current = false
      if (timer.current !== null) clearTimeout(timer.current)
      timer.current = null
      setPhase('idle')
    }
    const hide = () => {
      if (document.hidden) stop()
    }
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', hide)
    return () => {
      if (timer.current !== null) clearTimeout(timer.current)
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [])

  const content = (
    <>
      <Trash2 size={15} aria-hidden="true" />
      <span>Hold to delete</span>
    </>
  )
  return (
    <button
      type="button"
      className={`hold-delete is-${phase}`}
      aria-label={`Hold to delete ${title}`}
      title="Hold for 1.6 seconds. Release to cancel."
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return
        event.currentTarget.setPointerCapture?.(event.pointerId)
        start()
      }}
      onPointerMove={(event) => {
        if (!active.current) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          cancel()
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onBlur={cancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') cancel()
        if (event.key !== ' ' && event.key !== 'Enter') return
        event.preventDefault()
        if (!event.repeat) start()
      }}
      onKeyUp={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        event.preventDefault()
        cancel()
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="hold-delete-label">
        {phase === 'deleted' ? (
          <>
            <Check size={15} aria-hidden="true" />
            <span>Deleted</span>
          </>
        ) : (
          content
        )}
      </span>
      {phase !== 'deleted' && (
        <span className="hold-delete-fill" aria-hidden="true">
          {content}
        </span>
      )}
    </button>
  )
}
