import { useRef, useState, type ReactNode } from 'react'
import './choiceSlider.css'

export type SliderAction = { id: string; label: ReactNode; run: () => void; disabled?: boolean }

/** Paging renders at most three suggestions, including for assistive technology. */
export function ChoiceSlider({ actions, label = 'Choices' }: { actions: SliderAction[]; label?: string }) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const [position, setPosition] = useState(0)
  const pages = Math.max(1, Math.ceil(actions.length / 3))
  const page = Math.min(position, pages - 1)
  return (
    <div className="choice-slider" role="group" aria-label={label}>
      <div className="choice-slider-items" onTouchStart={(event) => {
        if (actions.every((action) => action.disabled)) return
        const touch = event.touches[0]
        if (!touch) return
        touchStart.current = { x: touch.clientX, y: touch.clientY }
      }} onTouchEnd={(event) => {
        const start = touchStart.current
        touchStart.current = null
        const touch = event.changedTouches[0]
        if (!start || !touch || actions.every((action) => action.disabled)) return
        const dx = touch.clientX - start.x
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(touch.clientY - start.y) * 1.5)
          setPosition(Math.max(0, Math.min(pages - 1, page + (dx < 0 ? 1 : -1))))
      }} onTouchCancel={() => { touchStart.current = null }}>
        {actions.slice(page * 3, page * 3 + 3).map((action) => (
          <button key={action.id} type="button" className="bg-chip" disabled={action.disabled} onClick={action.run}>
            {action.label}
          </button>
        ))}
      </div>
      {pages > 1 && (
        <label className="choice-slider-control">
          <span role="status" aria-live="polite" aria-atomic="true">Suggestions {page * 3 + 1}–{Math.min(page * 3 + 3, actions.length)} of {actions.length}</span>
          <small>Slide or use arrow keys for more choices</small>
          <input type="range" disabled={actions.length > 0 && actions.every((action) => action.disabled)} min={0} max={pages - 1} step={1} value={page}
            aria-label={`Browse ${label.toLowerCase()}`} aria-valuetext={`Page ${page + 1} of ${pages}; suggestions ${page * 3 + 1} to ${Math.min(page * 3 + 3, actions.length)}`} onChange={(event) => setPosition(Number(event.target.value))} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.closest('.choice-slider')?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus() } }} />
        </label>
      )}
    </div>
  )
}
