import { prefersReducedMotion } from '../utils/motion'
import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { X } from 'lucide-react'

/**
 * Native <dialog> (focus trap, Esc, inert page) with a soft entrance from CSS
 * and a matching exit played through the Web Animations API before the parent
 * unmounts it. Without WAAPI or with reduced motion it closes instantly.
 */
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  const ref = useRef<HTMLDialogElement>(null)
  const closing = useRef(false)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  const requestClose = useCallback(() => {
    const dialog = ref.current
    const panel = dialog?.firstElementChild as HTMLElement | null
    if (closing.current) return
    if (!dialog || !panel || typeof panel.animate !== 'function' || prefersReducedMotion()) {
      onClose()
      return
    }
    closing.current = true
    const timing = { duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' as const }
    try {
      dialog.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, pseudoElement: '::backdrop' })
    } catch {
      /* Backdrop animation is optional. */
    }
    panel
      .animate(
        [
          { opacity: 1, transform: 'translateY(0) scale(1)' },
          { opacity: 0, transform: 'translateY(10px) scale(0.97)' },
        ],
        timing,
      )
      .finished.then(onClose, onClose)
  }, [onClose])
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div className="modal-inner mx-4 w-full max-w-xl rounded-ui-lg border border-ui-border bg-surface p-4 sm:p-6">
        <div className="card-heading modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button modal-close"
            aria-label={t('ui.closeDialog')}
            onClick={requestClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
