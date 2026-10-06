import { useState } from 'react'

/** Keep the outgoing number visible while the next one drops into place. */
export function FallingCountdown({ value }: { value: string }) {
  const [frame, setFrame] = useState({ current: value, previous: '' })
  if (value !== frame.current) setFrame({ current: value, previous: frame.current })

  return (
    <strong className="iv-number">
      {frame.previous && <span key={`previous:${frame.current}`} className="iv-number-previous" aria-hidden="true">{frame.previous}</span>}
      <span key={frame.current} className={frame.previous ? 'iv-number-current is-changing' : 'iv-number-current'}>{frame.current}</span>
    </strong>
  )
}
