import { useCallback, useMemo, useRef, useState } from 'react'
import { area, curveMonotoneX, curveLinear } from 'd3-shape'
import { classifyKey, fingerprint, ridgePoints, type FlowFingerprint, type Keystroke } from './flowModel'
import { subOn } from '../subFeatures'
import './flow.css'

/** Records keystroke timing (not content) for the current writing session. */
export function useKeystrokeFlow() {
  const strokes = useRef<Keystroke[]>([])
  const [version, setVersion] = useState(0)
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const kind = classifyKey(event.key, event.ctrlKey || event.metaKey || event.altKey)
    if (!kind) return
    strokes.current.push({ t: performance.now(), kind })
    // Re-render at most every few keys to keep typing smooth.
    if (strokes.current.length % 4 === 0) setVersion((v) => v + 1)
  }, [])
  const current = useMemo(
    () => fingerprint(strokes.current),
    // `version` bumps as keys arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  )
  return { onKeyDown, current, snapshot: () => fingerprint(strokes.current) }
}

const layers = [
  { offset: 0.35, opacity: 0.25, scale: 0.7 },
  { offset: 0.18, opacity: 0.45, scale: 0.85 },
  { offset: 0, opacity: 1, scale: 1 },
]

/** The mountain range: three layered ridges for depth, smooth or jagged. */
export function FlowMountain({
  fp,
  height = 110,
  label,
  compact = false,
}: {
  fp: Pick<FlowFingerprint, 'h' | 'r'> & Partial<FlowFingerprint>
  height?: number
  label?: string
  compact?: boolean
}) {
  const width = 600
  const jagged = subOn('flowTopography', 'ravines')
  const paths = layers.map((layer) => {
    const shifted = {
      h: fp.h.map((_, i) => fp.h[Math.min(fp.h.length - 1, Math.round(i + layer.offset * 10))] * layer.scale),
      r: fp.r,
    }
    const points = ridgePoints(shifted, width, height, jagged && layer.offset === 0)
    return area<[number, number]>()
      .x((p) => p[0])
      .y0(height)
      .y1((p) => p[1])
      .curve(layer.offset === 0 && jagged ? curveLinear : curveMonotoneX)(points)
  })
  return (
    <figure className={`flow-mountain${compact ? ' is-compact' : ''}`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label ?? 'Writing flow mountain range'}>
        <defs>
          <linearGradient id="flow-peak" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--flow-peak, #f6c177)" />
            <stop offset="0.55" stopColor="var(--flow-mid, #d0643f)" />
            <stop offset="1" stopColor="var(--flow-base, #5b3b5c)" />
          </linearGradient>
        </defs>
        {paths.map((d, i) => (
          <path key={i} d={d ?? ''} fill="url(#flow-peak)" opacity={layers[i].opacity} />
        ))}
      </svg>
      {!compact && fp.wpm !== undefined && subOn('flowTopography', 'stats') && (
        <figcaption>
          <span>{fp.wpm} wpm</span>
          <span>{Math.round((fp.flow ?? 0) * 100)}% in flow</span>
        </figcaption>
      )}
    </figure>
  )
}
