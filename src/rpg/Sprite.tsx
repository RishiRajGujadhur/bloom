import type { CSSProperties } from 'react'
export function Sprite({ name, label, row = 0, size = 96 }: { name: string; label: string; row?: number; size?: number }) {
  return <span role="img" aria-label={label} className={`pixel-sprite sprite-${name}`} style={{ '--sprite-size': `${size}px`, '--sprite-row': row, backgroundImage: `url('/rpg/${name}.svg')` } as CSSProperties}/>
}
