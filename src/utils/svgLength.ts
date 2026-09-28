/**
 * Safe SVG path length. getTotalLength() throws on shapes that are not
 * rendered (display:none, inside <defs>, hidden pixel-icon parts), which
 * crashed pages; fall back instead.
 */
export function pathLength(el: Element | null | undefined, fallback = 100): number {
  try {
    return (el as SVGGeometryElement | null)?.getTotalLength?.() || fallback
  } catch {
    return fallback
  }
}
