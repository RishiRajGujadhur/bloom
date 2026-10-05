import { useState, type ReactNode } from 'react'
import './choiceSlider.css'

export type SliderAction = { id: string; label: ReactNode; run: () => void; disabled?: boolean }

/** Paging renders at most three suggestions, including for assistive technology. */
export function ChoiceSlider({ actions, label = 'Choices' }: { actions: SliderAction[]; label?: string }) {
  const [position, setPosition] = useState(0)
  const pages = Math.max(1, Math.ceil(actions.length / 3))
  const page = Math.min(position, pages - 1)
  return (
    <div className="choice-slider" role="group" aria-label={label}>
      <div className="choice-slider-items">
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
          <input type="range" min={0} max={pages - 1} step={1} value={page}
            aria-label={`Browse ${label.toLowerCase()}`} aria-valuetext={`Page ${page + 1} of ${pages}; suggestions ${page * 3 + 1} to ${Math.min(page * 3 + 3, actions.length)}`} onChange={(event) => setPosition(Number(event.target.value))} />
        </label>
      )}
    </div>
  )
}
