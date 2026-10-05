import type { CSSProperties } from 'react'
import type { JournalCategory } from './types'

const patterns: Record<JournalCategory, string[]> = {
  planning: [
    '00011000',
    '00111100',
    '01111110',
    '11111111',
    '11111111',
    '01111110',
    '00111100',
    '00011000',
  ],
  reflection: [
    '01100110',
    '11111111',
    '11011011',
    '11011011',
    '11011011',
    '11011011',
    '11111111',
    '01100110',
  ],
  vision: [
    '00011000',
    '00111100',
    '01111110',
    '11100111',
    '11100111',
    '01111110',
    '00111100',
    '00011000',
  ],
  gamified: [
    '00010000',
    '00011000',
    '00111100',
    '11111111',
    '01111110',
    '00111100',
    '00011000',
    '00001000',
  ],
}

export function PixelArt({ category }: { category: JournalCategory }) {
  return (
    <svg
      className="daybook-pixel-art"
      viewBox="0 0 96 96"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {patterns[category].flatMap((row, y) =>
        Array.from(row).map((pixel, x) =>
          pixel === '1' ? (
            <rect
              key={`${x}:${y}`}
              x={8 + x * 10}
              y={8 + y * 10}
              width="9"
              height="9"
              style={
                {
                  '--pixel-delay': `${((x * 7 + y * 11) % 9) * 35}ms`,
                  '--pixel-shift': `${((x % 3) - 1) * 7}px`,
                } as CSSProperties
              }
            />
          ) : null,
        ),
      )}
    </svg>
  )
}
