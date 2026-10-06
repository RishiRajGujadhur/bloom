import { useState } from 'react'

function FallingDigit({ value }: { value: string }) {
  const [frame, setFrame] = useState({ current: value, previous: '' })
  if (value !== frame.current) setFrame({ current: value, previous: frame.current })

  return (
    <span className="iv-digit">
      {frame.previous && <span key={`previous:${frame.current}`} className="iv-number-previous" aria-hidden="true">{frame.previous}</span>}
      <span key={frame.current} className={frame.previous ? 'iv-number-current is-changing' : 'iv-number-current'}>{frame.current}</span>
    </span>
  )
}

/** Animate changed digits while keeping the complete time accessible as one value. */
export function FallingCountdown({ value }: { value: string }) {
  return (
    <strong className="iv-number">
      <span className="sr-only">{value}</span>
      <span className="iv-number-digits" aria-hidden="true">
        {[...value].map((digit, index) => <FallingDigit key={value.length - index} value={digit} />)}
      </span>
    </strong>
  )
}
