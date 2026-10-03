import { visible, type P } from './formModel'
export function frameBounds(pose: P[], mirror: boolean) {
  const points = [0, 11, 12, 13, 14, 15, 16, 19, 20].map(i => pose[i]).filter(visible)
  if (points.length < 7) return null
  const xs = points.map(p => mirror ? 1 - p.x : p.x), ys = points.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const scale = Math.max(1, Math.min(1.4, 1 / Math.max(maxX - minX + .24, maxY - minY + .3)))
  return { scale, x: Math.max(1 - scale, Math.min(0, .5 - (minX + maxX) / 2 * scale)), y: Math.max(1 - scale, Math.min(0, .5 - (minY + maxY) / 2 * scale)) }
}
